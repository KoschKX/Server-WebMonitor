const si = require('systeminformation');

async function debugSystemInfo() {
    console.log('=== Testing systeminformation on Windows ===\n');
    
    console.log('--- CPU Current Load ---');
    try {
        const load = await si.currentLoad();
        console.log('Full object:', JSON.stringify(load, null, 2));
        console.log('\nCPU cores:');
        if (load.cpus) {
            load.cpus.forEach((cpu, i) => {
                console.log(`Core ${i}:`, cpu);
            });
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
    
    console.log('\n--- Network Stats ---');
    try {
        const net = await si.networkStats();
        console.log('Full object:', JSON.stringify(net, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
    
    console.log('\n--- Disk Stats ---');
    try {
        const disk = await si.fsStats();
        console.log('Full object:', JSON.stringify(disk, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
    
    console.log('\n--- Disk I/O (disksIO) ---');
    try {
        const diskIO = await si.disksIO();
        console.log('Full object:', JSON.stringify(diskIO, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

debugSystemInfo().then(() => {
    console.log('\n=== Debug complete ===');
    process.exit(0);
});
