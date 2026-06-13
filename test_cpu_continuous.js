const si = require('systeminformation');

async function testCPUContinuous() {
    console.log('=== Testing continuous currentLoad() calls ===\n');
    
    for (let i = 1; i <= 10; i++) {
        const load = await si.currentLoad();
        console.log(`Call ${i}: Total ${load.currentLoad.toFixed(2)}%, Cores: ${load.cpus.slice(0, 3).map(c => c.load.toFixed(1) + '%').join(', ')}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

testCPUContinuous().then(() => {
    console.log('\n=== Test complete ===');
    process.exit(0);
}).catch(e => {
    console.error('Error:', e);
    process.exit(1);
});
