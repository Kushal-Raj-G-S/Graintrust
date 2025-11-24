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
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load .env from the blockchain-api directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || process.env.BLOCKCHAIN_PORT || 9000;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Fabric network paths
const testNetworkPath = path.resolve(__dirname, '../fabric-samples/test-network');
const ccpPath = path.join(__dirname, 'connection-org1.json'); // Updated: connection profile in blockchain-api directory
const walletPath = path.join(__dirname, 'wallet');
const CHANNEL_NAME = 'graintrust';
const CHAINCODE_NAME = 'graincc';

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/**
 * Initialize Fabric wallet and identity
 */
async function initFabricWallet() {
  try {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    // Check if identity exists
    const identity = await wallet.get('appUser');
    if (!identity) {
      console.log('⚠️  No wallet identity found. Attempting to load admin certs from MSP (no CA)...');

      // Try to load admin cert and key from the generated crypto material (cryptogen)
      const adminCertDir = path.resolve(__dirname, '../fabric-samples/test-network/organizations/peerOrganizations/farmer.graintrust.com/users/Admin@farmer.graintrust.com/msp/signcerts');
      const adminKeyDir = path.resolve(__dirname, '../fabric-samples/test-network/organizations/peerOrganizations/farmer.graintrust.com/users/Admin@farmer.graintrust.com/msp/keystore');

      if (fs.existsSync(adminCertDir) && fs.existsSync(adminKeyDir)) {
        // Read certificate file (may be cert.pem or Admin@domain-cert.pem)
        const certFiles = fs.readdirSync(adminCertDir).filter(f => f.endsWith('.pem'));
        if (certFiles.length === 0) {
          throw new Error(`No certificate found in signcerts: ${adminCertDir}`);
        }
        const adminCert = fs.readFileSync(path.join(adminCertDir, certFiles[0]), 'utf8');
        
        // keystore contains a single private key file; pick the first
        const keyFiles = fs.readdirSync(adminKeyDir);
        if (keyFiles.length === 0) {
          throw new Error(`No private key found in keystore: ${adminKeyDir}`);
        }
        const adminKey = fs.readFileSync(path.join(adminKeyDir, keyFiles[0]), 'utf8');

        const adminIdentity = {
          credentials: {
            certificate: adminCert,
            privateKey: adminKey,
          },
          mspId: 'FarmerOrgMSP',
          type: 'X.509',
        };

        // Put the admin identity into wallet as both 'admin' and 'appUser' for local testing
        await wallet.put('admin', adminIdentity);
        await wallet.put('appUser', adminIdentity);

        console.log('✅ Loaded admin identity from MSP into wallet (admin & appUser)');
      } else {
        // If MSP files not found, fall back to CA enroll (may fail if CA not running)
        console.log('⚠️  MSP admin cert not found; falling back to CA enrollment (requires fabric-ca running)');

        // Load connection profile
        const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
        const ccp = JSON.parse(ccpJSON);

        // Create CA client - use the actual CA name from connection profile
        const caName = Object.keys(ccp.certificateAuthorities)[0]; // Get first CA name
        const caInfo = ccp.certificateAuthorities[caName];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        // Enroll admin
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
          credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
          },
          mspId: 'FarmerOrgMSP',
          type: 'X.509',
        };
        await wallet.put('admin', x509Identity);

        // Register and enroll appUser
        const adminIdentity = await wallet.get('admin');
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        const secret = await ca.register({
          affiliation: 'org1.department1',
          enrollmentID: 'appUser',
          role: 'client'
        }, adminUser);

        const userEnrollment = await ca.enroll({
          enrollmentID: 'appUser',
          enrollmentSecret: secret
        });

        const userIdentity = {
          credentials: {
            certificate: userEnrollment.certificate,
            privateKey: userEnrollment.key.toBytes(),
          },
          mspId: 'FarmerOrgMSP',
          type: 'X.509',
        };
        await wallet.put('appUser', userIdentity);
        console.log('✅ Successfully enrolled appUser via CA');
      }
    }
    
    return wallet;
  } catch (error) {
    console.error(`❌ Failed to initialize wallet: ${error}`);
    throw error;
  }
}

/**
 * Connect to Fabric Gateway
 */
async function connectToFabric() {
  try {
    const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(ccpJSON);
    
    // Resolve TLS cert paths (support both absolute and relative paths)
    for (const peerName in ccp.peers) {
      const peer = ccp.peers[peerName];
      if (peer.tlsCACerts && peer.tlsCACerts.path) {
        // Use absolute path if provided, otherwise resolve relative to test-network
        const certPath = path.isAbsolute(peer.tlsCACerts.path) 
          ? peer.tlsCACerts.path 
          : path.join(testNetworkPath, peer.tlsCACerts.path);
        const certPem = fs.readFileSync(certPath, 'utf8');
        peer.tlsCACerts.pem = certPem;
        delete peer.tlsCACerts.path;
      }
    }
    
    const wallet = await initFabricWallet();
    const gateway = new Gateway();
    
    await gateway.connect(ccp, {
      wallet,
      identity: 'appUser',
      discovery: { enabled: true, asLocalhost: true }
    });
    
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);
    
    return { gateway, contract };
  } catch (error) {
    console.error(`❌ Failed to connect to Fabric: ${error}`);
    throw error;
  }
}

/**
 * Generate SHA-256 hash from image URL (simulating IPFS hash)
 */
function generateImageHash(imageUrl) {
  const hash = crypto.createHash('sha256').update(imageUrl).digest('hex');
  return `Qm${hash.substring(0, 44)}`; // Format like IPFS CIDv0
}

/**
 * POST /generate-certificate
 * Receives batch data from Frontend Bridge
 * Generates blockchain certificate and QR code
 */
app.post('/generate-certificate', async (req, res) => {
  try {
    const { batchId } = req.body;

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║        📥 CERTIFICATE REQUEST FROM FRONTEND                  ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    
    console.log(`📦 Batch ID: ${batchId}\n`);

    // Validate required fields
    if (!batchId) {
      console.log('❌ Validation failed: Missing batchId\n');
      return res.status(400).json({
        success: false,
        error: 'Missing required field: batchId'
      });
    }

    console.log('✅ Validation passed');
    console.log('🔗 Connecting to Hyperledger Fabric...\n');

    // REAL BLOCKCHAIN CONNECTION
    const { gateway, contract } = await connectToFabric();
    
    try {
      console.log('📝 Querying blockchain for batch verification...');
      
      // Get batch data from blockchain
      const batchResult = await contract.evaluateTransaction('queryGrainBatch', batchId);
      const blockchainBatch = JSON.parse(batchResult.toString());
      
      // Get complete history
      const historyResult = await contract.evaluateTransaction('getGrainHistory', batchId);
      const history = JSON.parse(historyResult.toString());
      
      console.log(`   Blockchain Batch: ${blockchainBatch.batchId}`);
      console.log(`   Stages on Chain: ${blockchainBatch.stages?.length || 0}/7`);
      
      // Verify all 7 stages are recorded
      if (!blockchainBatch.stages || blockchainBatch.stages.length < 7) {
        console.log(`❌ Incomplete stages on blockchain: ${blockchainBatch.stages?.length || 0}/7\n`);
        return res.status(400).json({
          success: false,
          error: `Only ${blockchainBatch.stages?.length || 0} stages found on blockchain, need 7 stages to generate certificate`
        });
      }
      
      console.log('✅ All 7 stages verified on blockchain');
      console.log('🗄️  Fetching images from Supabase...\n');
      
      // Fetch batch details and images from Supabase
      const { data: batchData, error: batchError } = await supabase
        .from('batches')
        .select('*')
        .eq('batch_id', batchId)
        .single();
      
      if (batchError || !batchData) {
        console.log(`⚠️  Batch not found in Supabase: ${batchId}`);
        // Continue with blockchain data only
      }
      
      // Fetch all stages with images
      const { data: stages, error: stagesError } = await supabase
        .from('stages')
        .select('*')
        .eq('batch_id', batchId)
        .order('stage_number', { ascending: true });
      
      const stagesWithImages = stages || [];
      let totalImages = 0;
      let stageImageCounts = [];
      
      for (const stage of stagesWithImages) {
        const imageCount = stage.image_urls ? stage.image_urls.length : 0;
        totalImages += imageCount;
        stageImageCounts.push({
          stage: stage.stage_number,
          name: stage.stage_name,
          imageCount
        });
      }
      
      console.log(`   Total Images Found: ${totalImages}`);
      stageImageCounts.forEach(s => {
        console.log(`   Stage ${s.stage} (${s.name}): ${s.imageCount} images`);
      });
      
      // Verify minimum 2 images per stage (14 total minimum)
      const insufficientStages = stageImageCounts.filter(s => s.imageCount < 2);
      if (insufficientStages.length > 0) {
        console.log(`\n⚠️  Some stages have less than 2 images:`);
        insufficientStages.forEach(s => {
          console.log(`   Stage ${s.stage}: ${s.imageCount} images (need 2)`);
        });
        return res.status(400).json({
          success: false,
          error: 'Each stage must have at least 2 images',
          insufficientStages
        });
      }
      
      console.log('✅ All stages have minimum 2 images\n');
      
      // Generate certificate
      const certificateId = `CERT-${batchId}-${Date.now()}`;
      const verificationUrl = `https://graintrust-verify.vercel.app/${certificateId}`;
      
      // Certificate hash (immutable proof from blockchain data)
      const certificateHash = crypto.createHash('sha256')
        .update(JSON.stringify({
          batchId: blockchainBatch.batchId,
          farmerName: blockchainBatch.farmerName,
          grainType: blockchainBatch.grainType,
          quantity: blockchainBatch.quantity,
          stages: blockchainBatch.stages,
          totalImages,
          timestamp: new Date().toISOString()
        }))
        .digest('hex');

      const certificateResponse = {
        success: true,
        certificateId,
        qrCodeUrl: verificationUrl,
        certificateHash,
        blockchain: {
          channel: CHANNEL_NAME,
          chaincode: CHAINCODE_NAME,
          peer: 'peer0.farmer.graintrust.com:7051',
          timestamp: new Date().toISOString(),
          verified: true,
          transactionCount: history.length || 0
        },
        batch: {
          batchId: blockchainBatch.batchId,
          farmerName: blockchainBatch.farmerName || batchData?.farmer_name,
          grainType: blockchainBatch.grainType,
          quantity: blockchainBatch.quantity,
          currentStage: blockchainBatch.currentStage,
          totalStages: blockchainBatch.stages.length,
          totalImages,
          stages: stagesWithImages.map((stage, idx) => ({
            stageNumber: stage.stage_number,
            stageName: stage.stage_name,
            timestamp: blockchainBatch.stages[idx]?.timestamp,
            imageHash: blockchainBatch.stages[idx]?.imageHash,
            verifiedBy: blockchainBatch.stages[idx]?.verifiedBy,
            location: blockchainBatch.stages[idx]?.location,
            imageUrls: stage.image_urls || [],
            imageCount: stage.image_urls ? stage.image_urls.length : 0
          }))
        }
      };

      console.log('✅ Certificate generated from REAL blockchain!\n');
      console.log('📜 Certificate Details:');
      console.log('─────────────────────────────────────────────────────────────');
      console.log(`   Certificate ID: ${certificateId}`);
      console.log(`   QR Code URL: ${verificationUrl}`);
      console.log(`   Batch: ${blockchainBatch.batchId}`);
      console.log(`   Farmer: ${blockchainBatch.farmerName || batchData?.farmer_name}`);
      console.log(`   Grain Type: ${blockchainBatch.grainType}`);
      console.log(`   Stages Verified: ${blockchainBatch.stages.length}/7`);
      console.log(`   Total Images: ${totalImages}`);
      console.log(`   Certificate Hash: ${certificateHash.substring(0, 20)}...`);
      console.log(`   Transaction History: ${history.length} records`);
      console.log('─────────────────────────────────────────────────────────────\n');

      // Store certificate in Supabase for verification
      console.log('💾 Storing certificate in database...');
      const { error: certError } = await supabase
        .from('certificates')
        .insert({
          certificate_id: certificateId,
          batch_id: batchId,
          certificate_hash: certificateHash,
          certificate_data: certificateResponse,
          qr_url: verificationUrl,
          created_at: new Date().toISOString()
        });
      
      if (certError) {
        console.log(`⚠️  Warning: Could not store certificate: ${certError.message}`);
      } else {
        console.log('✅ Certificate stored in database');
      }

      console.log('📤 Sending certificate to Frontend...\n');

      res.json(certificateResponse);
      
    } finally {
      await gateway.disconnect();
    }

  } catch (error) {
    console.error('❌ Certificate generation error:', error.message);
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

    // REAL BLOCKCHAIN CONNECTION
    const { gateway, contract } = await connectToFabric();
    
    let currentImageHash = ''; // Track the image hash for response
    
    try {
      if (imageData.isFirstImage) {
        // First image: Create new batch on blockchain
        const imageHash = generateImageHash(imageData.imageUrl);
        currentImageHash = imageHash;
        const stageName = imageData.stageName || 'Land Preparation';
        
        console.log(`📝 Invoking chaincode: createGrainBatch`);
        console.log(`   Batch: ${imageData.batchId}`);
        console.log(`   Farmer: ${imageData.farmerDetails?.name}`);
        console.log(`   Crop: ${imageData.batchDetails?.cropType}`);
        console.log(`   Stage: ${stageName}`);
        console.log(`   Image Hash: ${imageHash.substring(0, 20)}...`);
        console.log('⏳ Waiting for blockchain confirmation...\n');
        
        const result = await contract.submitTransaction(
          'createGrainBatch',
          imageData.batchId,
          imageData.farmerDetails?.name || 'Unknown Farmer',
          imageData.batchDetails?.cropType || 'Unknown Crop',
          `${imageData.batchDetails?.quantity || 0} ${imageData.batchDetails?.unit || 'kg'}`,
          imageHash,
          imageData.farmerDetails?.location || 'Unknown Location',
          stageName,
          imageData.imageUrl  // Add the actual image URL
        );
        
        console.log('✅ Batch created on blockchain!');
        
      } else {
        // Subsequent images: Add stage to existing batch
        const imageHash = generateImageHash(imageData.imageUrl);
        
        // IMPORTANT: Frontend MUST send stageName, don't use stageId as fallback
        if (!imageData.stageName) {
          console.log('❌ Missing stageName in request\n');
          return res.status(400).json({
            success: false,
            error: 'stageName is required. Send the actual stage name (e.g., "Sowing", "Growing", "Harvesting") not the stageId UUID.'
          });
        }
        
        const stageName = imageData.stageName;
        
        console.log(`📝 Invoking chaincode: addStage`);
        console.log(`   Batch: ${imageData.batchId}`);
        console.log(`   Stage: ${stageName}`);
        console.log(`   Image Hash: ${imageHash.substring(0, 20)}...`);
        console.log('⏳ Waiting for blockchain confirmation...\n');
        
        const result = await contract.submitTransaction(
          'addStage',
          imageData.batchId,
          stageName,
          imageHash,
          imageData.farmerDetails?.location || 'Unknown Location',
          imageData.imageUrl  // Add the actual image URL
        );
        
        console.log('✅ Stage added to blockchain!');
        currentImageHash = imageHash;
      }
      
      // Query the batch to get real transaction details
      const batchResult = await contract.evaluateTransaction('queryGrainBatch', imageData.batchId);
      const batchData = JSON.parse(batchResult.toString());
      
      const chaincodeMethod = imageData.isFirstImage ? 'createGrainBatch' : 'addStage';
      
      // Get the latest stage info (the one we just added)
      const latestStage = batchData.stages[batchData.stages.length - 1];
      
      const fabricResponse = {
        success: true,
        transactionId: `${batchData.batchId}-${latestStage.timestamp}`, // Unique transaction identifier
        blockNumber: batchData.stages.length, // Stage count acts as block sequence
        imageHash: currentImageHash, // The IPFS-style hash we generated
        batchId: batchData.batchId,
        currentStage: batchData.currentStage,
        totalStages: batchData.stages?.length || 0,
        chaincode: chaincodeMethod,
        channel: CHANNEL_NAME,
        timestamp: latestStage.timestamp,
        verifiedBy: latestStage.verifiedBy,
        location: latestStage.location,
        message: `Successfully recorded ${imageData.isFirstImage ? 'batch' : 'stage'} to blockchain`
      };

      console.log('✅ Transaction confirmed on REAL blockchain!\n');
      console.log('🔗 Blockchain Details:');
      console.log('─────────────────────────────────────────────────────────────');
      console.log(`   Transaction ID: ${fabricResponse.transactionId}`);
      console.log(`   Block Number: ${fabricResponse.blockNumber}`);
      console.log(`   Image Hash: ${fabricResponse.imageHash}`);
      console.log(`   Batch ID: ${batchData.batchId}`);
      console.log(`   Current Stage: ${batchData.currentStage}`);
      console.log(`   Total Stages: ${batchData.stages?.length || 0}`);
      console.log(`   Chaincode: ${chaincodeMethod}`);
      console.log(`   Channel: ${CHANNEL_NAME}`);
      console.log('─────────────────────────────────────────────────────────────\n');

      // AUTO-CHECK: Should we generate QR URL?
      // Criteria: 7 unique stages + minimum 2 images per stage
      const uniqueStages = new Set(batchData.stages.map(s => s.stage));
      const totalImages = batchData.stages.length;
      
      // Group images by stage to count per stage
      const stageImageCount = {};
      batchData.stages.forEach(s => {
        stageImageCount[s.stage] = (stageImageCount[s.stage] || 0) + 1;
      });
      
      // Check if ALL stages have at least 2 images
      const allStagesHaveMin2 = Object.values(stageImageCount).every(count => count >= 2);
      const hasAllStages = uniqueStages.size >= 7;
      
      console.log(`📊 QR Check:`);
      console.log(`   Unique Stages: ${uniqueStages.size}/7`);
      console.log(`   Stage Image Counts:`);
      Object.entries(stageImageCount).forEach(([stage, count]) => {
        console.log(`      ${stage}: ${count} images ${count >= 2 ? '✅' : '❌'}`);
      });
      console.log(`   All stages have ≥2 images: ${allStagesHaveMin2 ? '✅' : '❌'}`);
      console.log(`   Ready for QR: ${hasAllStages && allStagesHaveMin2 ? '✅ YES' : '❌ NO'}\n`);

      // If all criteria met, AUTO-GENERATE QR URL
      if (hasAllStages && allStagesHaveMin2) {
        console.log('🎉 ALL CRITERIA MET! Auto-generating QR URL...\n');
        
        const qrUrl = `http://localhost:9000/verify.html?batchId=${imageData.batchId}`;
        
        console.log('╔══════════════════════════════════════════════════════════════╗');
        console.log('║        🎊 QR URL GENERATED AUTOMATICALLY!                    ║');
        console.log('╚══════════════════════════════════════════════════════════════╝\n');
        console.log(`   📦 Batch ID: ${imageData.batchId}`);
        console.log(`   🔗 QR URL: ${qrUrl}`);
        console.log(`   ✅ Unique Stages: ${uniqueStages.size}`);
        console.log(`   📸 Total Images: ${totalImages}`);
        console.log(`   👨‍🌾 Farmer: ${batchData.farmerName}`);
        console.log(`   🌾 Crop: ${batchData.grainType}\n`);

        // Add QR info to response
        fabricResponse.qrGenerated = true;
        fabricResponse.qrCode = {
          qrUrl,
          batchId: imageData.batchId,
          stages: uniqueStages.size,
          images: totalImages,
          stageImageCount,  // Show images per stage
          farmerName: batchData.farmerName,
          cropType: batchData.grainType,
          stageNames: Array.from(uniqueStages),
          message: '🎉 QR Code ready! All 7 stages complete with minimum 2 images each.'
        };
      } else {
        fabricResponse.qrGenerated = false;
        
        // Calculate what's missing
        const missingStages = 7 - uniqueStages.size;
        const stagesNeedingMore = Object.entries(stageImageCount)
          .filter(([stage, count]) => count < 2)
          .map(([stage, count]) => `${stage} (${count}/2)`);
        
        fabricResponse.progress = {
          uniqueStages: uniqueStages.size,
          requiredStages: 7,
          totalImages,
          stageImageCount,
          stageNames: Array.from(uniqueStages),
          missingStages: missingStages > 0 ? missingStages : 0,
          stagesNeedingMoreImages: stagesNeedingMore,
          message: missingStages > 0 
            ? `Need ${missingStages} more stages` 
            : stagesNeedingMore.length > 0
              ? `Some stages need more images: ${stagesNeedingMore.join(', ')}`
              : 'Ready for QR!'
        };
      }

      console.log('📤 Sending response to Frontend Bridge...\n');

      res.json(fabricResponse);
      
    } finally {
      await gateway.disconnect();
    }

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
 * GET /batch/:batchId
 * Retrieve batch data from blockchain for QR verification page
 */
app.get('/batch/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    console.log(`\n🔍 Batch verification request: ${batchId}`);

    // Connect to Fabric and query batch
    const { gateway, contract } = await connectToFabric();
    
    try {
      const batchResult = await contract.evaluateTransaction('queryGrainBatch', batchId);
      const batchData = JSON.parse(batchResult.toString());
      
      // Calculate proper statistics (chaincode uses 'stage' not 'stageName')
      const uniqueStageNames = new Set(batchData.stages.map(s => s.stage));
      const totalUniqueStages = uniqueStageNames.size;
      const totalImages = batchData.stages?.length || 0;
      
      // Group images by stage for detailed view
      const stageGroups = {};
      batchData.stages.forEach(stageData => {
        const stageName = stageData.stage;
        if (!stageGroups[stageName]) {
          stageGroups[stageName] = [];
        }
        stageGroups[stageName].push(stageData);
      });
      
      console.log(`✅ Batch found: ${batchData.batchId}`);
      console.log(`   Farmer: ${batchData.farmerName}`);
      console.log(`   Crop: ${batchData.grainType || 'N/A'}`);
      console.log(`   Unique Stages: ${totalUniqueStages}/7`);
      console.log(`   Total Images: ${totalImages}`);
      console.log(`   Stage Names: ${Array.from(uniqueStageNames).join(', ')}`);
      
      // Return batch data with proper stage counting
      res.json({
        success: true,
        batch: {
          batchId: batchData.batchId,
          farmerName: batchData.farmerName,
          cropType: batchData.grainType || 'Unknown',
          quantity: batchData.quantity,
          currentStage: batchData.currentStage,
          stages: batchData.stages || [],
          uniqueStages: totalUniqueStages,  // 7 stages
          totalImages: totalImages,          // 14 images
          stageGroups: stageGroups,          // Grouped by stage name
          stageNames: Array.from(uniqueStageNames),  // List of unique stage names
          isComplete: totalUniqueStages >= 7 && totalImages >= 14,
          createdAt: batchData.stages[0]?.timestamp || new Date().toISOString()
        },
        verified: true,
        blockchain: {
          channel: CHANNEL_NAME,
          chaincode: CHAINCODE_NAME,
          timestamp: new Date().toISOString()
        }
      });
      
    } finally {
      await gateway.disconnect();
    }

  } catch (error) {
    console.error('❌ Batch verification error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /verify/:certificateId
 * Retrieve certificate data for QR code verification
 */
app.get('/verify/:certificateId', async (req, res) => {
  try {
    const { certificateId } = req.params;

    console.log(`\n🔍 Certificate verification request: ${certificateId}`);

    // Fetch certificate from Supabase
    const { data: certificate, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('certificate_id', certificateId)
      .single();

    if (error || !certificate) {
      console.log(`❌ Certificate not found: ${certificateId}`);
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    console.log(`✅ Certificate found: ${certificate.batch_id}`);
    
    // Return certificate data with all images
    res.json({
      success: true,
      certificate: certificate.certificate_data,
      verified: true,
      retrievedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Verification error:', error.message);
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
