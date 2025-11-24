/**
 * GrainTrust Blockchain Automation Service
 * 
 * Complete flow automation:
 * 1. Detect new batch creation in Supabase
 * 2. Fetch farmer MSP identity (auto-register if needed)
 * 3. Wait for all 7 stages to be uploaded
 * 4. Generate image hashes
 * 5. Submit to blockchain
 * 6. Update verification status in Supabase
 */

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto-js');
require('dotenv').config();

const app = express();
app.use(express.json());

// Supabase client with service role (full access)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ccpPath = path.resolve(__dirname, '../fabric-samples/test-network/organizations/peerOrganizations/farmer.graintrust.com/connection-farmer.json');
const walletPath = path.join(__dirname, 'wallet');

/**
 * Generate deterministic image hash from URL
 */
function generateImageHash(imageUrl) {
  const hash = crypto.SHA256(imageUrl).toString();
  return `Qm${hash.substring(0, 44)}`; // IPFS CIDv0 format
}

/**
 * Register farmer in Fabric CA and create wallet identity
 */
async function registerFarmer(farmerId, farmerName) {
  try {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    
    // Check if farmer identity already exists
    const existingIdentity = await wallet.get(`farmer_${farmerId}`);
    if (existingIdentity) {
      console.log(`✅ Farmer ${farmerName} already registered`);
      return `farmer_${farmerId}`;
    }
    
    // Load admin identity (must exist)
    const adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
      throw new Error('Admin identity not found. Run enrollment script first.');
    }
    
    // Create new identity for farmer
    const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(ccpJSON);
    
    const FabricCAServices = require('fabric-ca-client');
    const caInfo = ccp.certificateAuthorities['ca.farmer.graintrust.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
    
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');
    
    // Register farmer
    const secret = await ca.register({
      affiliation: 'org1.department1',
      enrollmentID: `farmer_${farmerId}`,
      role: 'client',
      attrs: [
        { name: 'farmerName', value: farmerName, ecert: true },
        { name: 'farmerId', value: farmerId, ecert: true }
      ]
    }, adminUser);
    
    // Enroll farmer
    const enrollment = await ca.enroll({
      enrollmentID: `farmer_${farmerId}`,
      enrollmentSecret: secret
    });
    
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: 'FarmerOrgMSP',
      type: 'X.509',
    };
    
    await wallet.put(`farmer_${farmerId}`, x509Identity);
    console.log(`✅ Registered farmer: ${farmerName} (${farmerId})`);
    
    return `farmer_${farmerId}`;
  } catch (error) {
    console.error(`Failed to register farmer: ${error}`);
    throw error;
  }
}

/**
 * Connect to blockchain with specific farmer identity
 */
async function connectAsIdentity(identityName) {
  const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
  const ccp = JSON.parse(ccpJSON);
  
  const wallet = await Wallets.newFileSystemWallet(walletPath);
  const gateway = new Gateway();
  
  await gateway.connect(ccp, {
    wallet,
    identity: identityName,
    discovery: { enabled: true, asLocalhost: true }
  });
  
  const network = await gateway.getNetwork(process.env.CHANNEL_NAME);
  const contract = network.getContract(process.env.CHAINCODE_NAME);
  
  return { gateway, contract };
}

/**
 * Check if batch has all 7 stages completed
 */
async function isBatchComplete(batchId) {
  const { data: stages } = await supabase
    .from('stages')
    .select('id, name, imageUrls')
    .eq('batchId', batchId);
  
  if (!stages || stages.length < 7) return false;
  
  // Check all stages have images
  const allHaveImages = stages.every(stage => 
    stage.imageUrls && stage.imageUrls.length > 0
  );
  
  return allHaveImages;
}

/**
 * MAIN AUTOMATION: Process batch and submit to blockchain
 */
async function processBatch(batchId) {
  console.log(`\n🔄 Processing batch: ${batchId}`);
  
  try {
    // 1. Fetch batch details
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('*')
      .eq('id', batchId)
      .single();
    
    if (batchError) throw batchError;
    
    // 2. Check if batch is complete (all 7 stages uploaded)
    const isComplete = await isBatchComplete(batchId);
    if (!isComplete) {
      console.log(`⏳ Batch ${batch.batchCode} not complete yet. Waiting for all stages...`);
      return { success: false, message: 'Batch incomplete' };
    }
    
    // 3. Fetch farmer info
    const { data: farmer, error: farmerError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', batch.farmerId)
      .single();
    
    if (farmerError) throw farmerError;
    
    // 4. Register/Get farmer MSP identity
    const farmerIdentity = await registerFarmer(farmer.id, farmer.name);
    
    // 5. Fetch all stages in order
    const { data: stages, error: stagesError } = await supabase
      .from('stages')
      .select('*')
      .eq('batchId', batchId)
      .order('createdAt', { ascending: true });
    
    if (stagesError) throw stagesError;
    
    // 6. Connect to blockchain as farmer
    const { gateway, contract } = await connectAsIdentity(farmerIdentity);
    
    try {
      // 7. Create batch on blockchain with first stage
      const firstStage = stages[0];
      const firstImageHash = generateImageHash(firstStage.imageUrls[0]);
      
      console.log(`📝 Creating batch ${batch.batchCode} on blockchain...`);
      await contract.submitTransaction(
        'createGrainBatch',
        batch.batchCode,
        farmer.name,
        batch.name, // crop type
        `${batch.area} acres`,
        firstImageHash,
        batch.location?.address || 'Unknown'
      );
      
      console.log(`✅ Created batch ${batch.batchCode}`);
      
      // 8. Add remaining 6 stages
      for (let i = 1; i < stages.length; i++) {
        const stage = stages[i];
        const imageHash = generateImageHash(stage.imageUrls[0]);
        
        await contract.submitTransaction(
          'addStage',
          batch.batchCode,
          stage.name,
          imageHash,
          batch.location?.address || 'Unknown'
        );
        
        console.log(`✅ Added stage ${i + 1}/7: ${stage.name}`);
        
        // Update stage verification status in Supabase
        await supabase
          .from('stages')
          .update({ 
            status: 'VERIFIED',
            updatedAt: new Date().toISOString()
          })
          .eq('id', stage.id);
      }
      
      // 9. Mark batch as blockchain-verified in Supabase
      await supabase
        .from('batches')
        .update({
          verified: true,
          verificationStatus: 'BLOCKCHAIN_VERIFIED',
          verifiedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', batchId);
      
      // 10. Query final state from blockchain
      const result = await contract.evaluateTransaction('queryGrainBatch', batch.batchCode);
      const batchOnChain = JSON.parse(result.toString());
      
      console.log(`\n🎉 SUCCESS! Batch ${batch.batchCode} is now on blockchain with ${stages.length} stages\n`);
      
      return {
        success: true,
        batchCode: batch.batchCode,
        stages: stages.length,
        blockchain: batchOnChain
      };
      
    } finally {
      await gateway.disconnect();
    }
    
  } catch (error) {
    console.error(`❌ Error processing batch: ${error.message}`);
    
    // Update batch with error status
    await supabase
      .from('batches')
      .update({
        verificationStatus: 'ERROR',
        updatedAt: new Date().toISOString()
      })
      .eq('id', batchId);
    
    throw error;
  }
}

// ============ API ENDPOINTS ============

/**
 * Webhook endpoint - Called by Supabase when batch is created/updated
 */
app.post('/webhook/batch-updated', async (req, res) => {
  try {
    const { type, record } = req.body;
    
    console.log(`\n📥 Webhook received: ${type} for batch ${record.batchCode}`);
    
    // Only process if batch verification is requested
    if (record.verificationStatus === 'PENDING' || record.verified === false) {
      // Check if complete before processing
      const isComplete = await isBatchComplete(record.id);
      
      if (isComplete) {
        // Process asynchronously
        processBatch(record.id)
          .then(result => console.log('✅ Batch processed:', result))
          .catch(err => console.error('❌ Processing failed:', err));
        
        res.json({ 
          success: true, 
          message: 'Batch processing started',
          batchCode: record.batchCode
        });
      } else {
        res.json({ 
          success: false, 
          message: 'Batch not complete yet'
        });
      }
    } else {
      res.json({ success: true, message: 'No action needed' });
    }
    
  } catch (error) {
    console.error(`Webhook error: ${error}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Manual trigger - Process specific batch
 */
app.post('/api/process-batch/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const result = await processBatch(batchId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Check batch status
 */
app.get('/api/batch-status/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    
    const { data: batch } = await supabase
      .from('batches')
      .select('*, stages (*)')
      .eq('id', batchId)
      .single();
    
    const isComplete = await isBatchComplete(batchId);
    
    res.json({
      batch: batch.batchCode,
      complete: isComplete,
      stages: batch.stages?.length || 0,
      verified: batch.verified,
      status: batch.verificationStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Process ALL pending batches (batch job)
 */
app.post('/api/process-all-pending', async (req, res) => {
  try {
    // Find all batches that are complete but not blockchain-verified
    const { data: batches } = await supabase
      .from('batches')
      .select('id, batchCode')
      .neq('verificationStatus', 'BLOCKCHAIN_VERIFIED');
    
    const results = [];
    
    for (const batch of batches) {
      const isComplete = await isBatchComplete(batch.id);
      if (isComplete) {
        try {
          const result = await processBatch(batch.id);
          results.push({ batchCode: batch.batchCode, ...result });
        } catch (error) {
          results.push({ batchCode: batch.batchCode, success: false, error: error.message });
        }
      }
    }
    
    res.json({
      success: true,
      processed: results.length,
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'GrainTrust Automation',
    blockchain: `${process.env.CHANNEL_NAME}/${process.env.CHAINCODE_NAME}`
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🤖 GrainTrust AUTOMATION Service`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(`📊 Supabase: ${process.env.SUPABASE_URL}`);
  console.log(`⛓️  Blockchain: ${process.env.CHANNEL_NAME}/${process.env.CHAINCODE_NAME}`);
  console.log(`\n📝 Endpoints:`);
  console.log(`   POST /webhook/batch-updated - Supabase webhook`);
  console.log(`   POST /api/process-batch/:batchId - Manual trigger`);
  console.log(`   POST /api/process-all-pending - Batch job`);
  console.log(`   GET  /api/batch-status/:batchId - Check status\n`);
});
