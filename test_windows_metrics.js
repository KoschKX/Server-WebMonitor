const os = require('os');
const si = require('systeminformation');

async function testAllMetrics() {
    console.log('=== Testing Windows Metrics ===\n');
    
    // Test 1: CPU with os.cpus()
    console.log('--- Test 1: CPU using os.cpus() ---');
    const cpus1 = os.cpus();
    console.log('First reading:', cpus1[0].times);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const cpus2 = os.cpus();
    console.log('Second reading:', cpus2[0].times);
    
    // Calculate CPU load manually
    const cpu0_1 = cpus1[0].times;
    const cpu0_2 = cpus2[0].times;
    const idle = cpu0_2.idle - cpu0_1.idle;
    const total = Object.values(cpu0_2).reduce((a, b) => a + b) - 
                  Object.values(cpu0_1).reduce((a, b) => a + b);
    const load = total > 0 ? 100 - (idle / total * 100) : 0;
    console.log(`CPU 0 Load: ${load.toFixed(2)}%\n`);
    
    // Test 2: Disk I/O
    console.log('--- Test 2: Disk I/O using disksIO() ---');
    try {
        const diskIO = await si.disksIO();
        console.log('Success:', JSON.stringify(diskIO, null, 2));
    } catch (e) {
        console.log('Error:', e.message);
    }
    console.log();
    
    // Test 3: Network Interfaces
    console.log('--- Test 3: Network using networkInterfaces() ---');
    try {
        const netIfaces = await si.networkInterfaces();
        console.log('Interface count:', netIfaces.length);
        netIfaces.forEach(iface => {
            console.log(`- ${iface.iface}: ${iface.operstate}, RX: ${iface.rx_bytes}, TX: ${iface.tx_bytes}`);
        });
    } catch (e) {
        console.log('Error:', e.message);
    }
    console.log();
    
    // Test 4: Alternative - use networkStats
    console.log('--- Test 4: Network using networkStats() (with timeout) ---');
    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout after 2s')), 2000)
    );
    
    try {
        const netStats = await Promise.race([si.networkStats(), timeoutPromise]);
        console.log('Success:', JSON.stringify(netStats, null, 2));
    } catch (e) {
        console.log('Error:', e.message);
    }
    
    console.log('\n=== Test Complete ===');
}

testAllMetrics().then(() => process.exit(0)).catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
