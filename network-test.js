// Network connectivity test script
const os = require('os');

console.log('\n🔍 Network Diagnostics:\n');

// Get all network interfaces
const interfaces = os.networkInterfaces();

console.log('📡 Available Network Interfaces:');
for (const name of Object.keys(interfaces)) {
  console.log(`\n  ${name}:`);
  for (const iface of interfaces[name]) {
    if (iface.family === 'IPv4') {
      console.log(`    IPv4: ${iface.address}`);
      console.log(`    Internal: ${iface.internal ? 'Yes (localhost)' : 'No (accessible from network)'}`);
    }
  }
}

// Get primary network IP
function getNetworkIP() {
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

const networkIP = getNetworkIP();

console.log('\n✨ Server Access URLs:');
console.log(`  Local (this computer):  http://localhost:3000`);
if (networkIP) {
  console.log(`  Network (other devices): http://${networkIP}:3000`);
  console.log('\n📱 For mobile/other laptop:');
  console.log(`  1. Connect to same WiFi`);
  console.log(`  2. Open: http://${networkIP}:3000/login.html`);
} else {
  console.log('  ⚠️  No network IP detected - check WiFi connection');
}

console.log('\n🔧 Troubleshooting Steps:');
console.log('  1. Make sure both devices are on SAME WiFi');
console.log('  2. Disable VPN if running');
console.log('  3. Check WiFi is not guest/isolated network');
console.log('  4. Try http (not https)');
console.log('\n');
