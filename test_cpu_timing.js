const si = require('systeminformation');

async function testCPU() {
    console.log('=== Testing currentLoad() timing on Windows ===\n');
    
    console.log('First call (establishing baseline):');
    const load1 = await si.currentLoad();
    console.log('Total:', load1.currentLoad.toFixed(2) + '%');
    console.log('Cores:', load1.cpus.map((c, i) => `CPU${i}: ${c.load.toFixed(1)}%`).join(', '));
    
    console.log('\nWaiting 1.5 seconds...\n');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('Second call (should have accurate data):');
    const load2 = await si.currentLoad();
    console.log('Total:', load2.currentLoad.toFixed(2) + '%');
    console.log('Cores:', load2.cpus.map((c, i) => `CPU${i}: ${c.load.toFixed(1)}%`).join(', '));
    
    console.log('\nWaiting 1 second...\n');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Third call:');
    const load3 = await si.currentLoad();
    console.log('Total:', load3.currentLoad.toFixed(2) + '%');
    console.log('Cores:', load3.cpus.map((c, i) => `CPU${i}: ${c.load.toFixed(1)}%`).join(', '));
    
    console.log('\nWaiting 1 second...\n');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Fourth call:');
    const load4 = await si.currentLoad();
    console.log('Total:', load4.currentLoad.toFixed(2) + '%');
    console.log('Cores:', load4.cpus.map((c, i) => `CPU${i}: ${c.load.toFixed(1)}%`).join(', '));
}

testCPU().then(() => {
    console.log('\n=== Test complete ===');
    process.exit(0);
}).catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
