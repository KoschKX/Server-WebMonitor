const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const si = require('systeminformation');
const path = require('path');
const cors = require('cors');

// Initialize Express app and create HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.static('public')); // Serve static files from public directory

console.log('Starting Linux System Monitor...');

// API endpoint for initial data
app.get('/api/system-info', async (req, res) => {
  try {
    const [cpu, mem, osInfo, fsSize, networkInterfaces] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.fsSize(),
      si.networkInterfaces()
    ]);

    res.json({
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        speed: cpu.speed
      },
      memory: {
        total: mem.total
      },
      os: {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        hostname: osInfo.hostname
      },
      disks: fsSize.map(disk => ({
        fs: disk.fs,
        type: disk.type,
        size: disk.size,
        mount: disk.mount
      })),
      network: networkInterfaces.map(iface => ({
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
wss.on('connection', (ws) => {
  console.log('Client connected');

  // Send updated metrics every second
  const interval = setInterval(async () => {
    // Only collect metrics if the connection is still open
    if (ws.readyState === WebSocket.OPEN) {
      try {
        // Collect all system metrics in parallel for better performance
        const [currentLoad, mem, cpuTemp, fsStats, networkStats] = await Promise.all([
          si.currentLoad(),
          si.mem(),
          si.cpuTemperature(),
          si.fsStats(),
          si.networkStats()
        ]);

        // Linux-specific CPU handling
        const totalLoad = currentLoad.currentLoad || 0;
        
        // Get per-core CPU usage
        const cpuCores = currentLoad.cpus ? currentLoad.cpus.map((cpu, index) => ({
          core: index,
          load: cpu.load.toFixed(2)
        })) : [];

        // Linux-specific memory handling (excludes buffers/cache)
        const memUsed = mem.used;
        const memPercent = ((mem.total - mem.available) / mem.total * 100).toFixed(2);

        // Construct metrics payload
        const metrics = {
          timestamp: Date.now(),
          cpu: {
            total: totalLoad.toFixed(2),
            cores: cpuCores,
            temperature: cpuTemp.main || 0
          },
          memory: {
            total: mem.total,
            used: memUsed,
            free: mem.free,
            active: mem.active,
            available: mem.available,
            buffcache: mem.buffcache || 0,
            usedPercent: memPercent,
            swapTotal: mem.swaptotal,
            swapUsed: mem.swapused,
            swapFree: mem.swapfree,
            swapPercent: mem.swaptotal > 0 ? ((mem.swapused / mem.swaptotal) * 100).toFixed(2) : 0
          },
          disk: {
            rx: fsStats.rx_sec || 0,
            wx: fsStats.wx_sec || 0,
            tx: fsStats.tx_sec || 0,
            rIO: fsStats.rIO_sec || 0,
            wIO: fsStats.wIO_sec || 0,
            rxTotal: fsStats.rx || 0,
            wxTotal: fsStats.wx || 0
          },
          network: networkStats.map(net => ({
            iface: net.iface,
            rx_sec: net.rx_sec || 0,
            tx_sec: net.tx_sec || 0,
            rx_bytes: net.rx_bytes || 0,
            tx_bytes: net.tx_bytes || 0
          }))
        };

        ws.send(JSON.stringify(metrics));
      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    }
  }, 1000);

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clearInterval(interval);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Linux System Monitor running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});
