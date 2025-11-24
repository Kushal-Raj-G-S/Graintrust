/**
 * 🌉 BLOCKCHAIN BRIDGE SERVER
 * 
 * Run this on the BLOCKCHAIN MACHINE (where Hyperledger Fabric is running)
 * 
 * Purpose:
 * - Receives simplified requests from Frontend Bridge
 * - Translates to Hyperledger Fabric format
 * - Invokes chaincode
 * - Returns QR certificate
 * 
 * Start: node blockchain-bridge.js
 * Listen: http://localhost:9000
 */

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const PORT = process.env.BLOCKCHAIN_PORT || 9000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * POST /generate-certificate
 * Receives batch data from Frontend Bridge
 * Generates blockchain certificate and QR code
 */
app.post('/generate-certificate', async (req, res) => {
  try {
    const batchData = req.body;

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║        📥 CERTIFICATE REQUEST FROM FRONTEND BRIDGE           ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    console.log('📦 Batch Data Received:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`   Batch ID: ${batchData.batchId}`);
    console.log(`   Farmer: ${batchData.farmerName} (${batchData.farmerId})`);
    console.log(`   Location: ${batchData.farmerLocation}`);
    console.log(`   Crop: ${batchData.cropType} - ${batchData.quantity}kg`);
    console.log(`   Variety: ${batchData.varietyName}`);
    console.log(`   Total Images: ${batchData.totalVerifiedImages}`);
    console.log(`   Stages Complete: ${batchData.stagesComplete}/7`);
    console.log('─────────────────────────────────────────────────────────────\n');

    // Validate required fields
    if (!batchData.batchId || !batchData.farmerId || batchData.stagesComplete !== 7) {
      console.log('❌ Validation failed\n');
      return res.status(400).json({
        success: false,
        error: 'Invalid batch data or incomplete stages'
      });
    }

    console.log('✅ Validation passed');
    console.log('🔗 Connecting to Hyperledger Fabric...\n');

    // TODO: Replace with actual Fabric SDK code
    // const { Gateway, Wallets } = require('fabric-network');
    // const gateway = new Gateway();
    // await gateway.connect(connectionProfile, {
    //   wallet,
    //   identity: 'admin',
    //   discovery: { enabled: true, asLocalhost: true }
    // });
    // const network = await gateway.getNetwork('graintrust-channel');
    // const contract = network.getContract('graintrust');
    // const result = await contract.submitTransaction('GenerateCertificate', JSON.stringify(batchData));

    // MOCK: Simulate Hyperledger Fabric response
    console.log('📝 Invoking chaincode: GenerateCertificate');
    console.log('⏳ Waiting for blockchain confirmation...\n');

    // Simulate blockchain processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate certificate
    const certificateId = `CERT-${batchData.batchId}-${Date.now()}`;
    const transactionId = `TX-${crypto.randomBytes(16).toString('hex')}`;
    const blockNumber = Math.floor(Math.random() * 1000000) + 500000;
    const blockHash = `0x${crypto.randomBytes(32).toString('hex')}`;
    
    // Certificate hash (immutable proof)
    const certificateHash = crypto.createHash('sha256')
      .update(JSON.stringify({
        batchId: batchData.batchId,
        farmerId: batchData.farmerId,
        cropType: batchData.cropType,
        quantity: batchData.quantity,
        stagesComplete: batchData.stagesComplete,
        timestamp: new Date().toISOString()
      }))
      .digest('hex');

    const qrCodeUrl = `https://graintrust.com/verify/${certificateId}`;

    const fabricResponse = {
      success: true,
      certificateId,
      qrCode: qrCodeUrl,
      blockchain: {
        transactionId,
        blockNumber,
        blockHash,
        certificateHash,
        channel: 'graintrust-channel',
        chaincode: 'graintrust',
        peer: 'peer0.farmer.graintrust.com:7051',
        timestamp: new Date().toISOString()
      },
      batch: {
        batchId: batchData.batchId,
        farmerId: batchData.farmerId,
        farmerName: batchData.farmerName,
        cropType: batchData.cropType,
        quantity: batchData.quantity,
        totalImages: batchData.totalVerifiedImages
      }
    };

    console.log('✅ Transaction confirmed on blockchain!\n');
    console.log('📜 Certificate Generated:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`   Certificate ID: ${certificateId}`);
    console.log(`   QR Code: ${qrCodeUrl}`);
    console.log(`   Transaction: ${transactionId}`);
    console.log(`   Block: #${blockNumber}`);
    console.log(`   Block Hash: ${blockHash.substring(0, 20)}...`);
    console.log(`   Certificate Hash: ${certificateHash.substring(0, 20)}...`);
    console.log('─────────────────────────────────────────────────────────────\n');

    console.log('📤 Sending response to Frontend Bridge...\n');

    res.json(fabricResponse);

  } catch (error) {
    console.error('❌ Blockchain error:', error.message);
    console.error(error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /record-image
 * Receives verified image data from Frontend Bridge
 * Records to Hyperledger Fabric blockchain
 */
app.post('/record-image', async (req, res) => {
  try {
    const imageData = req.body;

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║        📸 RECORDING IMAGE TO BLOCKCHAIN                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    console.log('🖼️  Image Data Received:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`   Batch ID: ${imageData.batchId}`);
    console.log(`   Stage: ${imageData.stageId}`);
    console.log(`   Verification ID: ${imageData.verificationId}`);
    console.log(`   First Image: ${imageData.isFirstImage ? 'YES ✨' : 'No'}`);
    
    if (imageData.isFirstImage) {
      console.log(`\n👨‍🌾 Farmer: ${imageData.farmerDetails?.name}`);
      console.log(`   Email: ${imageData.farmerDetails?.email}`);
      console.log(`   Location: ${imageData.farmerDetails?.location || 'N/A'}`);
      console.log(`\n📦 Batch: ${imageData.batchDetails?.cropType}`);
      console.log(`   Variety: ${imageData.batchDetails?.variety || 'N/A'}`);
      console.log(`   Quantity: ${imageData.batchDetails?.quantity} ${imageData.batchDetails?.unit}`);
    }
    console.log('─────────────────────────────────────────────────────────────\n');

    // Validate required fields
    if (!imageData.batchId || !imageData.stageId || !imageData.imageUrl) {
      console.log('❌ Validation failed\n');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: batchId, stageId, imageUrl'
      });
    }

    console.log('✅ Validation passed');
    console.log('🔗 Connecting to Hyperledger Fabric...\n');

    // TODO: Replace with actual Fabric SDK code
    // const { Gateway, Wallets } = require('fabric-network');
    // const gateway = new Gateway();
    // await gateway.connect(connectionProfile, {
    //   wallet,
    //   identity: 'admin',
    //   discovery: { enabled: true, asLocalhost: true }
    // });
    // const network = await gateway.getNetwork('graintrust-channel');
    // const contract = network.getContract('graintrust');
    // 
    // if (imageData.isFirstImage) {
    //   // Record complete batch data + first image
    //   await contract.submitTransaction('RecordBatchWithImage', JSON.stringify(imageData));
    // } else {
    //   // Record image only (batch already exists)
    //   await contract.submitTransaction('RecordImage', JSON.stringify(imageData));
    // }

    // MOCK: Simulate Hyperledger Fabric response
    const chaincodeMethod = imageData.isFirstImage ? 'RecordBatchWithImage' : 'RecordImage';
    console.log(`📝 Invoking chaincode: ${chaincodeMethod}`);
    console.log('⏳ Waiting for blockchain confirmation...\n');

    // Simulate blockchain processing delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generate blockchain response
    const transactionId = `TX-${crypto.randomBytes(16).toString('hex')}`;
    const blockNumber = Math.floor(Math.random() * 1000000) + 500000;
    const blockHash = `0x${crypto.randomBytes(32).toString('hex')}`;
    
    // Image hash (immutable proof)
    const imageHash = crypto.createHash('sha256')
      .update(JSON.stringify({
        imageUrl: imageData.imageUrl,
        stageId: imageData.stageId,
        batchId: imageData.batchId,
        verificationId: imageData.verificationId,
        timestamp: imageData.timestamp
      }))
      .digest('hex');

    const fabricResponse = {
      success: true,
      transactionId,
      blockNumber,
      blockHash,
      imageHash,
      timestamp: new Date().toISOString(),
      chaincode: chaincodeMethod,
      isFirstImage: imageData.isFirstImage
    };

    console.log('✅ Image recorded to blockchain!\n');
    console.log('🔗 Blockchain Details:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`   Transaction ID: ${transactionId}`);
    console.log(`   Block Number: ${blockNumber}`);
    console.log(`   Block Hash: ${blockHash.substring(0, 20)}...`);
    console.log(`   Image Hash: ${imageHash.substring(0, 20)}...`);
    console.log(`   Chaincode: ${chaincodeMethod}`);
    console.log('─────────────────────────────────────────────────────────────\n');

    console.log('📤 Sending response to Frontend Bridge...\n');

    res.json(fabricResponse);

  } catch (error) {
    console.error('❌ Blockchain error:', error.message);
    console.error(error.stack);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Blockchain Bridge',
    blockchain: 'Hyperledger Fabric',
    peer: 'peer0.farmer.graintrust.com:7051',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║        🔗 BLOCKCHAIN BRIDGE SERVER STARTED                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`   🌐 Server: http://localhost:${PORT}`);
  console.log(`   📍 Endpoints:`);
  console.log(`      - POST /generate-certificate (QR certificate)`);
  console.log(`      - POST /record-image (Record verified images)`);
  console.log(`   🔗 Blockchain: Hyperledger Fabric`);
  console.log(`   🖥️  Peer: peer0.farmer.graintrust.com:7051`);
  console.log(`   ⏳ Waiting for requests from Frontend Bridge...\n`);
  console.log('   💡 Health check: GET http://localhost:' + PORT + '/health');
  console.log('   🛑 Press Ctrl+C to stop\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down Blockchain Bridge...');
  process.exit(0);
});
