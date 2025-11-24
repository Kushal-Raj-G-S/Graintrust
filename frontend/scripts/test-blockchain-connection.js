/**
 * 🧪 TEST FRONTEND → BLOCKCHAIN COMMUNICATION
 * 
 * This simulates what the frontend will send to blockchain
 */

async function testBlockchainRequest() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║        🧪 TESTING FRONTEND → BLOCKCHAIN                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // Sample batch data (what frontend will send)
  const batchData = {
    batchId: 'BATCH-12345',
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

  console.log('📤 Sending Request to Blockchain Server...\n');
  console.log('Request Data:');
  console.log(JSON.stringify(batchData, null, 2));
  console.log('\n');

  try {
    const response = await fetch('http://localhost:8080/generate-qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ SUCCESS! Blockchain Responded:\n');
      console.log('─────────────────────────────────────────────────────────────');
      console.log(`   Certificate ID: ${result.certificateId}`);
      console.log(`   QR Code URL: ${result.qrCode}`);
      console.log(`   Transaction ID: ${result.blockchain.transactionId}`);
      console.log(`   Block Number: ${result.blockchain.blockNumber}`);
      console.log(`   Block Hash: ${result.blockchain.blockHash.substring(0, 20)}...`);
      console.log(`   Timestamp: ${result.blockchain.timestamp}`);
      console.log('─────────────────────────────────────────────────────────────\n');
      
      console.log('🎯 This is what frontend will receive and store in database!\n');
    } else {
      console.log('❌ FAILED! Blockchain Error:\n');
      console.log(`   Error: ${result.error}`);
      console.log('\n');
    }
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
    console.log('\n💡 Make sure blockchain server is running:');
    console.log('   node blockchain-mock-server.js\n');
  }
}

testBlockchainRequest();
