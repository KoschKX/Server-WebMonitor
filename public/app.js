// Global variables
let ws;
let charts = {};
const MAX_PTS = 60; // Maximum data points for the ring buffer (60 seconds)

// Color palette for CPU core visualization (24 colors for up to 24 cores)
const CPU_COLORS = [
    '#e84040', '#e88040', '#e8d840', '#a0a830',
    '#40c840', '#40c0a0', '#40a0e8', '#8040e8',
    '#c040c0', '#787030', '#c88040', '#c0d840',
    '#40b0a0', '#40a8b8', '#4060c8', '#3848c0',
    '#50b858', '#c04090', '#40c0c8', '#c8b838',
    '#40d040', '#60c040', '#d06080', '#8098c0',
];

// Fixed time labels for the 60-point ring buffer (displayed on x-axis)
const XLABELS = Array.from({ length: MAX_PTS }, (_, i) => {
    const map = { 0: '1 min', 10: '50 secs', 20: '40 secs', 30: '30 secs', 40: '20 secs', 50: '10 secs' };
    return map[i] !== undefined ? map[i] : '';
});

// Create an empty data array for the ring buffer
function makeEmptyData() {
    return Array(MAX_PTS).fill(null);
}

// Add a value to the ring buffer (maintains MAX_PTS length)
function pushRing(arr, val) {
    arr.push(val);
    if (arr.length > MAX_PTS) arr.shift();
}

// ---- Chart Configuration ----

// Common x-axis configuration for all charts
const xScale = {
    border: { display: false },
    grid: { color: '#2a2a2a' },
    ticks: {
        color: '#777',
        font: { size: 11 },
        autoSkip: false,
        maxRotation: 0,
        callback: (v, i) => XLABELS[i] || null,
    }
};

// Y-axis configuration for percentage-based metrics (CPU, Memory)
function yPercent() {
    return {
        position: 'right',
        beginAtZero: true,
        max: 100,
        border: { display: false },
        grid: { color: '#2a2a2a' },
        ticks: {
            color: '#777',
            font: { size: 11 },
            stepSize: 25,
            callback: v => v + ' %',
        }
    };
}

// Y-axis configuration for rate-based metrics (Network, Disk)
function yRate() {
    return {
        position: 'right',
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#2a2a2a' },
        ticks: {
            color: '#777',
            font: { size: 11 },
            callback: v => {
                if (v === 0) return '0 bytes/s';
                if (v < 1024) return v.toFixed(1) + ' bytes/s';
                if (v < 1024 * 1024) return (v / 1024).toFixed(1) + ' KiB/s';
                return (v / 1024 / 1024).toFixed(1) + ' MiB/s';
            }
        }
    };
}

// Common options for all Chart.js instances
const commonOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 }, // No animation for real-time updates
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    elements: { point: { radius: 0 }, line: { borderWidth: 1.2, tension: 0.3 } },
};

// ---- Data Formatting Helpers ----

// Format bytes per second to human-readable rates
function fmtRate(bps) {
    if (bps === 0) return '0 bytes/s';
    if (bps < 1024) return bps.toFixed(1) + ' bytes/s';
    if (bps < 1024 * 1024) return (bps / 1024).toFixed(1) + ' KiB/s';
    return (bps / 1024 / 1024).toFixed(1) + ' MiB/s';
}

// Format bytes to human-readable sizes
function fmtSize(bytes) {
    if (bytes === 0) return '0 bytes';
    if (bytes < 1024) return bytes.toFixed(0) + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KiB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' MiB';
    return (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GiB';
}

// Format bytes to gigabytes
function fmtGB(bytes) {
    const gib = bytes / 1024 / 1024 / 1024;
    return gib.toFixed(1) + ' GB';
}

// ---- UI Functions ----

// Toggle section visibility (expand/collapse)
function toggleSection(id) {
    const content = document.getElementById('content-' + id.replace('section-', ''));
    const arrow = document.getElementById('arrow-' + id.replace('section-', ''));
    content.classList.toggle('collapsed');
    arrow.classList.toggle('collapsed');
}

// ---- WebSocket Connection ----

// Establish WebSocket connection for real-time updates
function connectWebSocket() {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}`;
    console.log('Connecting to WebSocket:', wsUrl);
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('✅ WebSocket connected');
    };
    
    ws.onmessage = e => {
        const data = JSON.parse(e.data);
        console.log('📊 Received metrics:', data);
        if (!data.cpu || !data.memory) {
            console.error('⚠️ Incomplete metrics data:', data);
        }
        updateMetrics(data);
    };
    
    ws.onclose = () => {
        console.log('❌ WebSocket disconnected, reconnecting in 3 seconds...');
        setTimeout(connectWebSocket, 3000);
    };
    
    ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
    };
}

// ---- System Initialization ----

// Fetch initial system info (CPU core count, etc.)
async function fetchSystemInfo() {
    try {
        console.log('Fetching system info...');
        const res = await fetch('/api/system-info');
        const data = await res.json();
        console.log('✅ System info:', data);
        initCPULegend(data.cpu.cores);
        initCPUChart(data.cpu.cores);
    } catch (e) {
        console.error('❌ Failed to fetch system info:', e);
    }
}

// ---- CPU Legend & Chart Initialization ----

// Create the CPU legend showing all cores with their colors
function initCPULegend(coreCount) {
    const legend = document.getElementById('cpuLegend');
    const rows = Math.ceil(coreCount / 4);
    legend.style.gridTemplateRows = `repeat(${rows}, auto)`;
    legend.innerHTML = '';
    for (let i = 0; i < coreCount; i++) {
        const color = CPU_COLORS[i % CPU_COLORS.length];
        const item = document.createElement('div');
        item.className = 'cpu-legend-item';
        item.innerHTML = `
            <span class="cpu-color-box" style="background:${color}"></span>
            <span class="cpu-name">CPU${i + 1}</span>
            <span class="cpu-value" id="legend-cpu-${i}">0%</span>
        `;
        legend.appendChild(item);
    }
}

// Initialize the CPU chart with one line per core
function initCPUChart(coreCount) {
    if (charts.cpu) charts.cpu.destroy();
    const datasets = Array.from({ length: coreCount }, (_, i) => ({
        data: makeEmptyData(),
        borderColor: CPU_COLORS[i % CPU_COLORS.length],
        borderWidth: 1,
        fill: false,
        tension: 0.3,
        pointRadius: 0,
    }));
    charts.cpu = new Chart(document.getElementById('cpuChart'), {
        type: 'line',
        data: { labels: [...XLABELS], datasets },
        options: { ...commonOpts, scales: { x: xScale, y: yPercent() } }
    });
}

// ---- Memory Chart Initialization ----

// Initialize memory and swap usage chart
function initMemoryChart() {
    charts.memory = new Chart(document.getElementById('memoryChart'), {
        type: 'line',
        data: {
            labels: [...XLABELS],
            datasets: [
                { data: makeEmptyData(), borderColor: '#e84040', fill: false }, // Memory
                { data: makeEmptyData(), borderColor: '#40c880', fill: false }, // Swap
            ]
        },
        options: { ...commonOpts, scales: { x: xScale, y: yPercent() } }
    });
}

// ---- Network Chart Initialization ----

// Initialize network traffic chart (TX and RX)
function initNetworkChart() {
    charts.network = new Chart(document.getElementById('networkChart'), {
        type: 'line',
        data: {
            labels: [...XLABELS],
            datasets: [
                { data: makeEmptyData(), borderColor: '#e88040', fill: false }, // TX (sending)
                { data: makeEmptyData(), borderColor: '#4080c8', fill: false }, // RX (receiving)
            ]
        },
        options: { ...commonOpts, scales: { x: xScale, y: yRate() } }
    });
}

// ---- Disk Chart Initialization ----

// Initialize disk I/O chart (read and write)
function initDiskChart() {
    charts.disk = new Chart(document.getElementById('diskChart'), {
        type: 'line',
        data: {
            labels: [...XLABELS],
            datasets: [
                { data: makeEmptyData(), borderColor: '#e88040', fill: false }, // Write
                { data: makeEmptyData(), borderColor: '#4080c8', fill: false }, // Read
            ]
        },
        options: { ...commonOpts, scales: { x: xScale, y: yRate() } }
    });
}

// ---- Metrics Update Functions ----

// Main update handler for incoming WebSocket data
function updateMetrics(data) {
    console.log('🔄 updateMetrics called with:', data);
    updateCPU(data.cpu);
    updateMemory(data.memory);
    updateNetwork(data.network);
    updateDisk(data.disk);
}

// Update CPU metrics and chart
function updateCPU(cpu) {
    if (!charts.cpu) return;
    cpu.cores.forEach((c, i) => {
        if (i >= charts.cpu.data.datasets.length) return;
        pushRing(charts.cpu.data.datasets[i].data, parseFloat(c.load));
        const el = document.getElementById(`legend-cpu-${i}`);
        if (el) el.textContent = c.load + '%';
    });
    charts.cpu.update();
}

// Update memory and swap metrics
function updateMemory(mem) {
    if (!charts.memory) return;
    const memPct = parseFloat(mem.usedPercent);
    const swapPct = parseFloat(mem.swapPercent) || 0;
    pushRing(charts.memory.data.datasets[0].data, memPct);
    pushRing(charts.memory.data.datasets[1].data, swapPct);
    charts.memory.update();

    const usedGB = fmtGB(mem.used);
    const totalGB = fmtGB(mem.total);
    document.getElementById('memoryInfo').textContent =
        `${usedGB} (${memPct}%) of ${totalGB}`;

    const cacheGB = mem.buffcache ? fmtGB(mem.buffcache) : '—';
    document.getElementById('memoryCacheInfo').textContent = `Cache ${cacheGB}`;

    const swapUsed = mem.swapUsed > 0 ? fmtSize(mem.swapUsed) : '0 bytes';
    const swapTotal = fmtGB(mem.swapTotal);
    document.getElementById('swapInfo').textContent =
        `${swapUsed} (${swapPct}%) of ${swapTotal}`;
}

// Update network metrics (aggregate all interfaces)
function updateNetwork(network) {
    if (!charts.network) return;
    const totalRx = network.reduce((s, n) => s + (n.rx_sec || 0), 0);
    const totalTx = network.reduce((s, n) => s + (n.tx_sec || 0), 0);
    const totalRxBytes = network.reduce((s, n) => s + (n.rx_bytes || 0), 0);
    const totalTxBytes = network.reduce((s, n) => s + (n.tx_bytes || 0), 0);

    pushRing(charts.network.data.datasets[0].data, totalTx);
    pushRing(charts.network.data.datasets[1].data, totalRx);
    charts.network.update();

    document.getElementById('netRxRate').textContent = fmtRate(totalRx);
    document.getElementById('netRxTotal').textContent = fmtSize(totalRxBytes);
    document.getElementById('netTxRate').textContent = fmtRate(totalTx);
    document.getElementById('netTxTotal').textContent = fmtSize(totalTxBytes);
}

// Update disk I/O metrics
function updateDisk(disk) {
    if (!charts.disk) return;
    const rx = disk.rx || 0;
    const wx = disk.wx || 0;
    const rxTotal = disk.rxTotal || 0;
    const wxTotal = disk.wxTotal || 0;

    pushRing(charts.disk.data.datasets[0].data, wx);  // Write (orange)
    pushRing(charts.disk.data.datasets[1].data, rx);  // Read (blue)
    charts.disk.update();

    document.getElementById('diskReadRate').textContent = fmtRate(rx);
    document.getElementById('diskReadTotal').textContent = fmtSize(rxTotal);
    document.getElementById('diskWriteRate').textContent = fmtRate(wx);
    document.getElementById('diskWriteTotal').textContent = fmtSize(wxTotal);
}

// ---- Application Entry Point ----

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    initMemoryChart();
    initNetworkChart();
    initDiskChart();
    await fetchSystemInfo(); // Fetch CPU core count and create CPU chart
    connectWebSocket();
});
