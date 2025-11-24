/**
 * 🔗 SIMPLE BLOCKCHAIN SERVER (Mock)
 * 
 * Run this on your blockchain machine to:
 * 1. Receive batch data from frontend
 * 2. Validate the request
 * 3. Generate QR certificate
 * 4. Send response back
 * 
 * Start: node blockchain-mock-server.js
 * Listen: http://localhost:8080/generate-qr
 */

const http = require('http');
const crypto = require('crypto');

const PORT = 8080;

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Handle POST /generate-qr
  if (req.method === 'POST' && req.url === '/generate-qr') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);

        console.log('\n╔══════════════════════════════════════════════════════════════╗');
        console.log('║        📥 BLOCKCHAIN REQUEST RECEIVED                        ║');
        console.log('╚══════════════════════════════════════════════════════════════╝\n');
        
        console.log('📦 Received Data:');
        console.log('─────────────────────────────────────────────────────────────');
        console.log(`   Batch ID: ${data.batchId}`);
        console.log(`   Farmer: ${data.farmerName} (${data.farmerId})`);
        console.log(`   Location: ${data.farmerLocation}`);
        console.log(`   Crop: ${data.cropType} - ${data.quantity}kg`);
        console.log(`   Variety: ${data.varietyName}`);
        console.log(`   Harvest Date: ${data.harvestDate}`);
        console.log(`   Total Images: ${data.totalVerifiedImages}`);
        console.log(`   Stages Complete: ${data.stagesComplete}/7`);
        console.log(`   Verified At: ${data.verifiedAt}`);
        console.log('─────────────────────────────────────────────────────────────\n');

        // Validate required fields
        const requiredFields = [
          'batchId', 'farmerId', 'farmerName', 'cropType', 
          'quantity', 'stagesComplete', 'totalVerifiedImages'
        ];

        const missingFields = requiredFields.filter(field => !data[field]);

        if (missingFields.length > 0) {
          console.log(`❌ Validation Failed - Missing fields: ${missingFields.join(', ')}\n`);
          
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'Missing required fields',
            missingFields
          }));
          return;
        }

        // Check if all stages complete
        if (data.stagesComplete !== 7) {
          console.log(`❌ Validation Failed - Only ${data.stagesComplete}/7 stages complete\n`);
          
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: 'All 7 stages must be complete',
            stagesComplete: data.stagesComplete
          }));
          return;
        }

        console.log('✅ Validation Passed!\n');

        // Generate certificate
        console.log('🔐 Generating Blockchain Certificate...');
        
        const certificateId = `CERT-${data.batchId}-${Date.now()}`;
        const transactionId = `TX-${crypto.randomBytes(16).toString('hex')}`;
        const blockNumber = Math.floor(Math.random() * 1000000);
        const blockHash = `0x${crypto.randomBytes(32).toString('hex')}`;
        
        // Create certificate hash
        const certificateHash = crypto.createHash('sha256')
          .update(JSON.stringify({
            batchId: data.batchId,
            farmerId: data.farmerId,
            cropType: data.cropType,
            quantity: data.quantity,
            timestamp: data.verifiedAt
          }))
          .digest('hex');

        const qrUrl = `https://graintrust.com/verify/${certificateId}`;

        const response = {
          success: true,
          certificateId,
          qrCode: qrUrl,
          blockchain: {
            transactionId,
            blockNumber,
            blockHash,
            certificateHash,
            timestamp: new Date().toISOString()
          },
          batch: {
            batchId: data.batchId,
            farmerId: data.farmerId,
            farmerName: data.farmerName,
            cropType: data.cropType,
            quantity: data.quantity,
            totalImages: data.totalVerifiedImages
          }
        };

        console.log('✅ Certificate Generated!\n');
        console.log('📜 Response Data:');
        console.log('─────────────────────────────────────────────────────────────');
        console.log(`   Certificate ID: ${certificateId}`);
        console.log(`   QR Code URL: ${qrUrl}`);
        console.log(`   Transaction ID: ${transactionId}`);
        console.log(`   Block Number: ${blockNumber}`);
        console.log(`   Block Hash: ${blockHash.substring(0, 20)}...`);
        console.log(`   Certificate Hash: ${certificateHash.substring(0, 20)}...`);
        console.log('─────────────────────────────────────────────────────────────\n');

        console.log('📤 Sending Response to Frontend...\n');

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response, null, 2));

      } catch (error) {
        console.error('❌ Error processing request:', error.message);
        
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: error.message
        }));
      }
    });
  } else {
    // Handle unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Endpoint not found. Use POST /generate-qr'
    }));
  }
});

server.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║        🔗 BLOCKCHAIN MOCK SERVER STARTED                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`   🌐 Server running at: http://localhost:${PORT}`);
  console.log(`   📍 Endpoint: POST http://localhost:${PORT}/generate-qr`);
  console.log(`   ⏳ Waiting for requests from frontend...\n`);
  console.log('   Press Ctrl+C to stop\n');
});
