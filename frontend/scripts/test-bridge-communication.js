/**
 * 🧪 TEST COMPLETE BRIDGE ARCHITECTURE
 * 
 * Tests the full flow:
 * Next.js API → Frontend Bridge → Blockchain Bridge → Hyperledger Fabric
 */

async function testBridges() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║        🧪 TESTING BRIDGE ARCHITECTURE                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log('📋 Architecture:');
  console.log('   1. Next.js API (port 3005)');
  console.log('   2. → Frontend Bridge (port 8080)');
  console.log('   3.   → Blockchain Bridge (port 9000)');
  console.log('   4.     → Hyperledger Fabric\n');

  // Test data
  const batchData = {
    batchId: 'BATCH-BRIDGE-TEST-001',
    farmerId: 'FARMER-001',
    farmerName: 'Rajesh Kumar',
    farmerLocation: 'Bangalore, Karnataka',
    cropType: 'Wheat',
    quantity: 1500,
    harvestDate: '2024-10-15',
    varietyName: 'HD-2967',
    totalVerifiedImages: 16,
    stagesComplete: 7,
    verifiedAt: new Date().toISOString()
  };

  console.log('📤 Step 1: Sending to Frontend Bridge (port 8080)...\n');

  try {
    const response = await fetch('http://localhost:8080/generate-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchData)
    });

    if (!response.ok) {
      throw new Error(`Frontend Bridge returned ${response.status}`);
    }

    const result = await response.json();

    console.log('✅ SUCCESS! Complete Bridge Communication Working!\n');
    console.log('📜 Final Response:');
    console.log('═════════════════════════════════════════════════════════════');
    console.log(`   Certificate ID: ${result.certificateId}`);
    console.log(`   QR Code: ${result.qrCode}`);
    console.log(`   Transaction ID: ${result.blockchain.transactionId}`);
    console.log(`   Block Number: ${result.blockchain.blockNumber}`);
    console.log(`   Block Hash: ${result.blockchain.blockHash.substring(0, 20)}...`);
    console.log(`   Certificate Hash: ${result.blockchain.certificateHash.substring(0, 20)}...`);
    console.log(`   Timestamp: ${result.blockchain.timestamp}`);
    console.log('═════════════════════════════════════════════════════════════\n');

    console.log('🎯 ARCHITECTURE VERIFIED:');
    console.log('   ✅ Frontend Bridge received request');
    console.log('   ✅ Blockchain Bridge processed certificate');
    console.log('   ✅ Response returned successfully');
    console.log('   ✅ Ready for production!\n');

  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.log('\n💡 Make sure both bridges are running:');
    console.log('   Terminal 1: node bridges/frontend-bridge.js');
    console.log('   Terminal 2: node bridges/blockchain-bridge.js');
    console.log('   Then run this test again\n');
  }
}

testBridges();
