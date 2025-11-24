const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Fabric network configuration
const ccpPath = path.resolve(__dirname, '../fabric-samples/test-network/organizations/peerOrganizations/farmer.graintrust.com/connection-farmer.json');
const walletPath = path.join(__dirname, 'wallet');

/**
 * Generate SHA-256 hash from image URL (simulating IPFS hash)
 */
function generateImageHash(imageUrl) {
  const hash = crypto.SHA256(imageUrl).toString();
  return `Qm${hash.substring(0, 44)}`; // Format like IPFS CIDv0
}

/**
 * Initialize Fabric wallet and identity
 */
async function initFabricWallet() {
  try {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    // Check if identity exists
    const identity = await wallet.get('appUser');
    if (!identity) {
      console.log('Creating new identity for appUser...');
      
      // Load connection profile
      const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
      const ccp = JSON.parse(ccpJSON);
      
      // Create CA client
      const caInfo = ccp.certificateAuthorities['ca.farmer.graintrust.com'];
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
      console.log('✅ Successfully enrolled appUser');
    }
    
    return wallet;
  } catch (error) {
    console.error(`Failed to initialize wallet: ${error}`);
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
    
    const wallet = await initFabricWallet();
    const gateway = new Gateway();
    
    await gateway.connect(ccp, {
      wallet,
      identity: 'appUser',
      discovery: { enabled: true, asLocalhost: true }
    });
    
    const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
    const contract = network.getContract(process.env.CHAINCODE_NAME);
    
    return { gateway, contract };
  } catch (error) {
    console.error(`Failed to connect to Fabric: ${error}`);
    throw error;
  }
}

// ============ API ENDPOINTS ============

/**
 * POST /api/create-batch
 * Create a new grain batch on blockchain (Frontend sends all data)
 * 
 * Request body:
 * {
 *   batchCode: "FB001",
 *   farmerName: "John Doe",
 *   grainType: "Rice",
 *   area: "10 acres",
 *   location: "Farm Location, India",
 *   stages: [
 *     { name: "Land Preparation", imageUrls: ["url1", "url2"] },
 *     { name: "Sowing", imageUrls: ["url1", "url2"] },
 *     ...
 *   ]
 * }
 */
app.post('/api/create-batch', async (req, res) => {
  try {
    const { batchCode, farmerName, grainType, area, location, stages } = req.body;
    
    // Validation
    if (!batchCode || !farmerName || !grainType || !area || !stages || !Array.isArray(stages)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: batchCode, farmerName, grainType, area, stages[]'
      });
    }
    
    console.log(`📦 Creating batch ${batchCode} for farmer ${farmerName}...`);
    
    const batch = { batchCode, name: grainType, area, location: { address: location } };
    const farmer = { name: farmerName };
    
    // Connect to blockchain
    const { gateway, contract } = await connectToFabric();
    
    try {
      // Create batch on blockchain with first stage
      const firstStage = stages[0];
      const firstImageHash = firstStage.imageUrls.length > 0 
        ? generateImageHash(firstStage.imageUrls[0]) 
        : 'QmDefault';
      
      await contract.submitTransaction(
        'createGrainBatch',
        batch.batchCode,
        farmer.name,
        batch.name, // grainType (Rice, Wheat, etc.)
        `${batch.area} acres`,
        firstImageHash,
        batch.location?.address || 'Unknown'
      );
      
      console.log(`✅ Created batch ${batch.batchCode} on blockchain`);
      
      // Add remaining stages
      for (let i = 1; i < stages.length; i++) {
        const stage = stages[i];
        const imageHash = stage.imageUrls.length > 0
          ? generateImageHash(stage.imageUrls[0])
          : 'QmDefault';
        
        await contract.submitTransaction(
          'addStage',
          batch.batchCode,
          stage.name,
          imageHash,
          batch.location?.address || 'Unknown'
        );
        
        console.log(`✅ Added stage: ${stage.name}`);
      }
      
      // Query the final batch to verify
      const result = await contract.evaluateTransaction('queryGrainBatch', batch.batchCode);
      const batchOnChain = JSON.parse(result.toString());
      
      res.json({
        success: true,
        message: `Batch ${batch.batchCode} synced to blockchain`,
        data: {
          supabase: {
            batch,
            stages: stages.length
          },
          blockchain: batchOnChain
        }
      });
      
    } finally {
      await gateway.disconnect();
    }
    
  } catch (error) {
    console.error(`Error syncing batch: ${error}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/batches
 * Fetch all batches from Supabase
 */
app.get('/api/batches', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('batches')
      .select(`
        *,
        stages (
          id,
          name,
          status,
          imageUrls
        )
      `)
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error(`Error fetching batches: ${error}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/blockchain/batch/:batchCode
 * Query batch from blockchain
 */
app.get('/api/blockchain/batch/:batchCode', async (req, res) => {
  try {
    const { batchCode } = req.params;
    const { gateway, contract } = await connectToFabric();
    
    try {
      const result = await contract.evaluateTransaction('queryGrainBatch', batchCode);
      const batch = JSON.parse(result.toString());
      
      res.json({
        success: true,
        data: batch
      });
    } finally {
      await gateway.disconnect();
    }
  } catch (error) {
    console.error(`Error querying blockchain: ${error}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/blockchain/verify-image
 * Verify image hash on blockchain
 */
app.post('/api/blockchain/verify-image', async (req, res) => {
  try {
    const { batchCode, stageIndex, imageUrl } = req.body;
    const expectedHash = generateImageHash(imageUrl);
    
    const { gateway, contract } = await connectToFabric();
    
    try {
      const result = await contract.evaluateTransaction(
        'verifyImageHash',
        batchCode,
        stageIndex.toString(),
        expectedHash
      );
      
      res.json({
        success: true,
        verified: result.toString() === 'true',
        expectedHash
      });
    } finally {
      await gateway.disconnect();
    }
  } catch (error) {
    console.error(`Error verifying image: ${error}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/blockchain/history/:batchCode
 * Get complete audit trail for a batch
 */
app.get('/api/blockchain/history/:batchCode', async (req, res) => {
  try {
    const { batchCode } = req.params;
    const { gateway, contract } = await connectToFabric();
    
    try {
      const result = await contract.evaluateTransaction('getGrainHistory', batchCode);
      const history = JSON.parse(result.toString());
      
      res.json({
        success: true,
        data: history
      });
    } finally {
      await gateway.disconnect();
    }
  } catch (error) {
    console.error(`Error fetching history: ${error}`);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'GrainTrust Blockchain API is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 GrainTrust Blockchain API running on port ${PORT}`);
  console.log(`📊 Supabase: ${process.env.SUPABASE_URL}`);
  console.log(`⛓️  Blockchain: ${process.env.CHANNEL_NAME}/${process.env.CHAINCODE_NAME}`);
});
