// Test script to verify systeminformation works on Windows
const si = require('systeminformation');

console.log('Testing systeminformation on Windows...\n');

// Helper to timeout promises
function timeoutPromise(promise, ms, name) {
  return Promise.race([
    promise,
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`${name} timed out after ${ms}ms`)), ms)
    )
  ]);
}

async function test() {
  try {
    console.log('=== Testing Current Load (with timeout) ===');
    const load = await timeoutPromise(si.currentLoad(), 3000, 'currentLoad');
    console.log('Current Load:', JSON.stringify(load, null, 2));
    
    console.log('\n=== Testing Memory ===');
    const mem = await timeoutPromise(si.mem(), 3000, 'mem');
    console.log('Memory:', JSON.stringify(mem, null, 2));
    
    console.log('\n=== Testing Network Stats ===');
    const net = await timeoutPromise(si.networkStats(), 3000, 'networkStats');
    console.log('Network:', JSON.stringify(net, null, 2));
    
    console.log('\n=== Testing FS Stats ===');
    const fs = await timeoutPromise(si.fsStats(), 3000, 'fsStats');
    console.log('FS Stats:', JSON.stringify(fs, null, 2));
    
    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

test();
