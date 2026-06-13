const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const si = require('systeminformation');
const os = require('os');
const path = require('path');
const cors = require('cors');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Initialize Express app and create HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.static('public')); // Serve static files from public directory

console.log('Starting Windows System Monitor...');

// Global CPU tracking for accurate measurements (per connection)
// Using WeakMap to track per-connection state
const connectionState = new WeakMap();

// Helper to add timeout to promises
function withTimeout(promise, ms, name) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${name} timeout`)), ms)
    )
  ]);
}

// API endpoint for initial data
app.get('/api/system-info', async (req, res) => {
  try {
    const [cpu, mem, osInfo, fsSize, networkInterfaces] = await Promise.all([
      withTimeout(si.cpu(), 2000, 'cpu').catch(e => ({ cores: 4 })),
      withTimeout(si.mem(), 2000, 'mem').catch(e => {
        const totalMem = os.totalmem();
        return { total: totalMem };
      }),
      withTimeout(si.osInfo(), 2000, 'osInfo').catch(e => ({ platform: 'Windows', distro: 'Windows', release: '', hostname: os.hostname() })),
      withTimeout(si.fsSize(), 2000, 'fsSize').catch(e => []),
      withTimeout(si.networkInterfaces(), 2000, 'networkInterfaces').catch(e => [])
    ]);

    res.json({
      cpu: {
        manufacturer: cpu.manufacturer || 'Unknown',
        brand: cpu.brand || 'Unknown',
        cores: cpu.cores || 4,
        physicalCores: cpu.physicalCores || 4,
        speed: cpu.speed || 0
      },
      memory: {
        total: mem.total || os.totalmem()
      },
      os: {
        platform: osInfo.platform || 'Windows',
        distro: osInfo.distro || 'Windows',
        release: osInfo.release || '',
        hostname: osInfo.hostname || os.hostname()
      },
      disks: (fsSize || []).map(disk => ({
        fs: disk.fs,
        type: disk.type,
        size: disk.size,
        mount: disk.mount
      })),
      network: (networkInterfaces || []).map(iface => ({
        iface: iface.iface,
        ip4: iface.ip4,
        type: iface.type
      }))
    });
  } catch (error) {
    console.error('Error fetching system info:', error);
    res.status(500).json({ error: error.message });
  }
});

// WebSocket connections for real-time metrics updates
wss.on('connection', async (ws) => {
  console.log('Client connected');

  // Initialize CPU tracking state for this connection
  const initialCpus = os.cpus();
  connectionState.set(ws, {
    prevCpus: initialCpus.map(cpu => ({
      times: { ...cpu.times }
    })),
    prevTime: Date.now(),
    prevFsStats: null,
    prevNetStats: null
  });

  // Send updated metrics every second
  const interval = setInterval(async () => {
    // Only collect metrics if the connection is still open
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const state = connectionState.get(ws);
        if (!state) return;
        
        // Get current CPU state
        const currentCpus = os.cpus();
        const currentTime = Date.now();
        const timeDelta = (currentTime - state.prevTime) / 1000;
        
        // Calculate CPU usage from per-connection tracking
        const cpuCores = [];
        let totalIdle = 0;
        let totalTick = 0;
        
        if (timeDelta >= 0.5) {  // Only calculate if enough time has passed
          currentCpus.forEach((cpu, i) => {
            const prevCpu = state.prevCpus[i];
            if (prevCpu && prevCpu.times) {
              // Calculate deltas for all time fields
              const idle = cpu.times.idle - prevCpu.times.idle;
              
              // Calculate total delta using all fields to be more robust
              const currentTotal = Object.values(cpu.times).reduce((a, b) => a + b, 0);
              const prevTotal = Object.values(prevCpu.times).reduce((a, b) => a + b, 0);
              const total = currentTotal - prevTotal;
              
              totalIdle += idle;
              totalTick += total;
              
              const load = total > 0 ? ((total - idle) / total) * 100 : 0;
              cpuCores.push({ core: i, load: Math.max(0, Math.min(100, load)).toFixed(2) });
            } else {
              cpuCores.push({ core: i, load: '0.00' });
            }
          });
          
          // Update per-connection tracking with deep copy to avoid reference issues
          state.prevCpus = currentCpus.map(cpu => ({
            times: { ...cpu.times }
          }));
          state.prevTime = currentTime;
        } else {
          // Not enough time passed, use previous values
          currentCpus.forEach((cpu, i) => {
            cpuCores.push({ core: i, load: '0.00' });
          });
        }
        
        const totalLoad = totalTick > 0 ? ((totalTick - totalIdle) / totalTick) * 100 : 0;
        
        // Collect other system metrics
        const [mem, cpuTemp, fsStats, networkStats] = await Promise.all([
          withTimeout(si.mem(), 1500, 'mem').catch(e => {
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            return {
              total: totalMem,
              free: freeMem,
              used: totalMem - freeMem,
              available: freeMem,
              swaptotal: 0,
              swapused: 0,
              swapfree: 0
            };
          }),
          withTimeout(si.cpuTemperature(), 500, 'cpuTemp').catch(e => { return { main: 0 }; }),
          withTimeout(si.fsStats(), 1000, 'fsStats').catch(e => null),
          withTimeout(si.networkStats('*'), 2000, 'networkStats').catch(e => {
            console.log('networkStats error:', e.message);
            return [];
          })
        ]);

        // Windows-specific memory handling
        const memTotal = mem.total || 0;
        const memUsed = mem.used || (mem.total - (mem.available || mem.free || 0));
        const memPercent = memTotal > 0 ? ((memUsed / memTotal) * 100).toFixed(2) : '0.00';

        // Calculate disk I/O rates from cumulative totals
        let diskMetrics = {
          rx: 0,
          wx: 0,
          tx: 0,
          rIO: 0,
          wIO: 0,
          rxTotal: 0,
          wxTotal: 0
        };
        
        if (fsStats && state.prevFsStats && timeDelta > 0) {
          const rBytes = Math.max(0, (fsStats.rx || 0) - (state.prevFsStats.rx || 0));
          const wBytes = Math.max(0, (fsStats.wx || 0) - (state.prevFsStats.wx || 0));
          const rBytesPerSec = rBytes / timeDelta;
          const wBytesPerSec = wBytes / timeDelta;
          
          diskMetrics = {
            rx: rBytesPerSec,
            wx: wBytesPerSec,
            tx: rBytesPerSec + wBytesPerSec,
            rIO: fsStats.rx || 0,
            wIO: fsStats.wx || 0,
            rxTotal: fsStats.rx || 0,
            wxTotal: fsStats.wx || 0
          };
        } else if (fsStats) {
          // First iteration, set totals but rates are 0
          diskMetrics.rxTotal = fsStats.rx || 0;
          diskMetrics.wxTotal = fsStats.wx || 0;
        }
        state.prevFsStats = fsStats ? { rx: fsStats.rx, wx: fsStats.wx } : null;

        // Process network traffic - calculate rates manually since si.networkStats may not work properly on Windows
        const networkMetrics = [];
        if (Array.isArray(networkStats) && networkStats.length > 0) {
          networkStats.forEach(net => {
            if (net && net.iface) {
              let rx_sec = net.rx_sec || 0;
              let tx_sec = net.tx_sec || 0;
              
              // If rates are not provided or are 0, calculate manually from totals
              if (state.prevNetStats && timeDelta > 0) {
                const prevNet = state.prevNetStats.find(p => p.iface === net.iface);
                if (prevNet) {
                  const rxDelta = Math.max(0, (net.rx_bytes || 0) - (prevNet.rx_bytes || 0));
                  const txDelta = Math.max(0, (net.tx_bytes || 0) - (prevNet.tx_bytes || 0));
                  rx_sec = rxDelta / timeDelta;
                  tx_sec = txDelta / timeDelta;
                }
              }
              
              networkMetrics.push({
                iface: net.iface,
                rx_sec: Math.max(0, rx_sec),
                tx_sec: Math.max(0, tx_sec),
                rx_bytes: net.rx_bytes || 0,
                tx_bytes: net.tx_bytes || 0
              });
            }
          });
        }
        // Store current network stats for next calculation
        state.prevNetStats = networkStats.map(net => ({
          iface: net.iface,
          rx_bytes: net.rx_bytes || 0,
          tx_bytes: net.tx_bytes || 0
        }));

        // Construct metrics payload
        const metrics = {
          timestamp: Date.now(),
          cpu: {
            total: Math.max(0, Math.min(100, totalLoad)).toFixed(2),
            cores: cpuCores,
            temperature: cpuTemp.main || 0
          },
          memory: {
            total: memTotal,
            used: memUsed,
            free: mem.free || mem.available || 0,
            active: mem.active || memUsed,
            available: mem.available || mem.free || 0,
            buffcache: 0,
            usedPercent: memPercent,
            swapTotal: mem.swaptotal || 0,
            swapUsed: mem.swapused || 0,
            swapFree: mem.swapfree || 0,
            swapPercent: (mem.swaptotal > 0 ? ((mem.swapused / mem.swaptotal) * 100).toFixed(2) : '0.00')
          },
          disk: diskMetrics,
          network: networkMetrics
        };

        // Log first metrics send for debugging
        if (!ws.firstSent) {
          console.log('First metrics sent:', JSON.stringify(metrics, null, 2));
          console.log('Disk raw data (fsStats):', fsStats);
          console.log('Network raw data (networkStats):', networkStats);
          ws.firstSent = true;
          ws.metricsCount = 1;
        } else {
          ws.metricsCount = (ws.metricsCount || 1) + 1;
          // Log every 5th metric to show it's working
          if (ws.metricsCount % 5 === 0) {
            console.log(`Metrics #${ws.metricsCount} - CPU: ${metrics.cpu.total}%, Mem: ${metrics.memory.usedPercent}%`);
          }
        }

        ws.send(JSON.stringify(metrics));
      } catch (error) {
        console.error('Error collecting metrics:', error);
        console.error('Stack:', error.stack);
      }
    } else {
      console.log('WebSocket not open, state:', ws.readyState);
    }
  }, 1000);

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
    connectionState.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clearInterval(interval);
    connectionState.delete(ws);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`Windows System Monitor running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
  
  // Test system info access on startup
  si.mem().then(mem => {
    console.log('Memory detection test:', mem.total ? 'OK' : 'FAILED');
  }).catch(e => console.error('Memory detection failed:', e.message));
  
  // Test CPU detection using os.cpus()
  const cpus = os.cpus();
  console.log('CPU detection test:', cpus.length > 0 ? `OK (${cpus.length} cores)` : 'FAILED');
});
