const si = require('systeminformation');

async function testNetwork() {
    console.log('Testing network interfaces...\n');
    
    try {
        const interfaces = await si.networkInterfaces();
        console.log('Network Interfaces:', JSON.stringify(interfaces, null, 2));
        
        console.log('\n--- Summary ---');
        interfaces.forEach(iface => {
            console.log(`${iface.iface}:`);
            console.log(`  Internal: ${iface.internal}`);
            console.log(`  RX bytes: ${iface.rx_bytes}`);
            console.log(`  TX bytes: ${iface.tx_bytes}`);
            console.log(`  Operstate: ${iface.operstate}`);
        });
        
        // Wait and check again
        console.log('\nWaiting 2 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const interfaces2 = await si.networkInterfaces();
        console.log('Network Interfaces (2nd read):');
        interfaces2.forEach(iface => {
            const prev = interfaces.find(i => i.iface === iface.iface);
            if (prev) {
                const rxDelta = (iface.rx_bytes || 0) - (prev.rx_bytes || 0);
                const txDelta = (iface.tx_bytes || 0) - (prev.tx_bytes || 0);
                console.log(`${iface.iface}: RX delta=${rxDelta}, TX delta=${txDelta}`);
            }
        });
        
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testNetwork().then(() => process.exit(0));
