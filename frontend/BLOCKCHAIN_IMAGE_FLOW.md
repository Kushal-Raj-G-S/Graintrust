# 🔗 Blockchain Image Verification Flow

## Overview

Every admin-verified image is automatically recorded to the Hyperledger Fabric blockchain in real-time. When all 7 stages are complete (each with ≥2 verified images), a QR certificate is automatically generated.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPLETE FLOW DIAGRAM                       │
└─────────────────────────────────────────────────────────────────┘

1. ADMIN VERIFIES IMAGE
   ↓
   [Admin Dashboard] → Click "Verify as Real"
   ↓
2. API PROCESSES VERIFICATION
   ↓
   [/api/image-verification] → Store in database
   ↓
3. BLOCKCHAIN RECORDING
   ↓
   [Check if first image in batch]
   ├─ YES → Send farmer + batch + stage + image
   └─ NO  → Send image data only
   ↓
   [POST /api/blockchain/record-image]
   ↓
   [Frontend Bridge :8080] → /record-image
   ↓
   [Blockchain Bridge :9000] → /record-image
   ↓
   [Hyperledger Fabric] → chaincode.RecordImage()
   ↓
   [Return transaction ID, block number, image hash]
   ↓
4. UPDATE DATABASE
   ↓
   [Store blockchain details in image_verifications]
   - blockchainTxId
   - blockchainHash
   - blockNumber
   - isFirstImageInBatch
   ↓
5. CHECK STAGE 7 COMPLETION
   ↓
   [If Stage 7 verified AND Stage 7 ≥2 images]
   ↓
   [Count all 7 stages]
   ↓
   [If ALL stages ≥2 images each]
   ↓
6. AUTO-GENERATE QR CERTIFICATE
   ↓
   [POST /api/blockchain/generate-qr]
   ↓
   [Frontend Bridge :8080] → /generate-qr
   ↓
   [Blockchain Bridge :9000] → /generate-certificate
   ↓
   [Hyperledger Fabric] → chaincode.GenerateCertificate()
   ↓
   [Store certificate_id & qr_code in batches table]
   ↓
   ✅ COMPLETE! QR certificate available
```

## Data Flow

### First Image in Batch
```json
{
  "action": "recordImage",
  "data": {
    "batchId": "uuid",
    "farmerId": "uuid",
    "stageId": "stage-1",
    "imageUrl": "https://...",
    "verificationId": "uuid",
    "isFirstImage": true,
    "timestamp": "2025-01-31T12:00:00Z",
    
    "farmerDetails": {
      "name": "John Farmer",
      "email": "john@farm.com",
      "phone": "+91XXXXXXXXXX",
      "location": "Karnataka, India"
    },
    
    "batchDetails": {
      "cropName": "Wheat",
      "cropType": "Grain",
      "variety": "Durum",
      "quantity": 500,
      "unit": "kg",
      "expectedHarvestDate": "2025-03-15",
      "farmLocation": "Village XYZ, District ABC"
    }
  }
}
```

### Subsequent Images
```json
{
  "action": "recordImage",
  "data": {
    "batchId": "uuid",
    "farmerId": "uuid",
    "stageId": "stage-2",
    "imageUrl": "https://...",
    "verificationId": "uuid",
    "isFirstImage": false,
    "timestamp": "2025-01-31T13:00:00Z"
  }
}
```

### Blockchain Response
```json
{
  "success": true,
  "transactionId": "TX-abc123...",
  "blockNumber": 552145,
  "blockHash": "0x5fb87038...",
  "imageHash": "f291adc01dc045bd...",
  "timestamp": "2025-01-31T12:00:00Z",
  "chaincode": "RecordImage",
  "isFirstImage": true
}
```

## Database Schema

### image_verifications Table (Updated)
```sql
CREATE TABLE image_verifications (
  id UUID PRIMARY KEY,
  "imageUrl" TEXT NOT NULL,
  "verificationStatus" TEXT NOT NULL, -- 'REAL' or 'FAKE'
  "stageId" TEXT NOT NULL,
  "batchId" UUID NOT NULL,
  "farmerId" UUID NOT NULL,
  "verifiedBy" UUID NOT NULL,
  "verifiedAt" TIMESTAMP NOT NULL,
  "rejectionReason" TEXT,
  
  -- 🔗 BLOCKCHAIN COLUMNS
  "blockchainTxId" TEXT,              -- Transaction ID from Fabric
  "blockchainHash" TEXT,              -- SHA256 hash of image data
  "blockchainRecordedAt" TIMESTAMP,   -- When recorded to blockchain
  "blockNumber" INTEGER,              -- Block number in Fabric ledger
  "isFirstImageInBatch" BOOLEAN,      -- True if includes farmer+batch data
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Index for blockchain lookups
CREATE INDEX idx_blockchain_tx_id ON image_verifications("blockchainTxId");
```

## API Endpoints

### 1. `/api/image-verification` (POST)
**Purpose**: Admin verifies image, auto-records to blockchain

**Request**:
```json
{
  "imageUrl": "https://...",
  "verificationStatus": "REAL",
  "stageId": "stage-3",
  "batchId": "uuid",
  "farmerId": "uuid",
  "verifiedBy": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "verification": { /* verification record */ },
  "notificationCreated": true,
  "blockchain": {
    "recorded": true,
    "transactionId": "TX-abc123...",
    "blockNumber": 552145
  }
}
```

### 2. `/api/blockchain/record-image` (POST)
**Purpose**: Record verified image to blockchain

**Request**: See "Data Flow" section above

**Response**: See "Blockchain Response" section above

### 3. `/api/blockchain/generate-qr` (POST)
**Purpose**: Generate QR certificate when all stages complete

**Request**:
```json
{
  "batchId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "certificateId": "CERT-uuid-timestamp",
  "qrCode": "https://graintrust.com/verify/CERT-...",
  "blockchain": {
    "transactionId": "TX-xyz789...",
    "blockNumber": 552200,
    "certificateHash": "e7f8g9h0..."
  }
}
```

## Bridge Servers

### Frontend Bridge (Windows - localhost:8080)
**Location**: `bridges/frontend-bridge.js`

**Endpoints**:
- `POST /record-image` - Receives from Next.js, forwards to Blockchain Bridge
- `POST /generate-qr` - QR certificate generation
- `GET /health` - Health check

**Start**:
```bash
node bridges/frontend-bridge.js
```

### Blockchain Bridge (Ubuntu - 172.29.54.144:9000)
**Location**: `bridges/blockchain-bridge.js`

**Endpoints**:
- `POST /record-image` - Records to Hyperledger Fabric
- `POST /generate-certificate` - Generates certificate
- `GET /health` - Health check

**Start**:
```bash
node bridges/blockchain-bridge.js
```

## Stage Completion Logic

### Validation Rules
- **Total Stages**: 7 (Preparation → Storage)
- **Minimum Images Per Stage**: 2
- **QR Generation Trigger**: All 7 stages ≥2 images each

### Stage Flow
```
Stage 1: Land Preparation    → 2+ images → ✅ Recorded
Stage 2: Sowing              → 2+ images → ✅ Recorded
Stage 3: Growth              → 2+ images → ✅ Recorded
Stage 4: Maintenance         → 2+ images → ✅ Recorded
Stage 5: Harvesting          → 2+ images → ✅ Recorded
Stage 6: Processing          → 2+ images → ✅ Recorded
Stage 7: Storage             → 2+ images → ✅ Recorded
                                          ↓
                        🎯 AUTO-GENERATE QR CERTIFICATE
```

### Auto-Trigger Logic
```typescript
// After EACH Stage 7 verification:
1. Extract stage number from stageId
2. If stage === 7:
   - Count images in all 7 stages
   - Check if ALL stages ≥2 images
   - If YES → Call /api/blockchain/generate-qr
```

## Testing

### Test Script
```bash
node scripts/test-image-blockchain-flow.js
```

### Manual Testing
1. **Start Bridges**:
   ```bash
   # Terminal 1 (Windows)
   node bridges/frontend-bridge.js
   
   # Terminal 2 (Ubuntu - SSH)
   node bridges/blockchain-bridge.js
   ```

2. **Start Next.js**:
   ```bash
   npm run dev
   ```

3. **Verify Images**:
   - Login as admin
   - Go to farmer dashboard
   - Verify images (2+ per stage)
   - Check console for blockchain logs

4. **Check Results**:
   ```sql
   -- Check blockchain records
   SELECT 
     "stageId", 
     "blockchainTxId", 
     "blockNumber", 
     "isFirstImageInBatch"
   FROM image_verifications
   WHERE "batchId" = 'your-batch-id'
   ORDER BY "verifiedAt";
   
   -- Check QR certificate
   SELECT 
     id, 
     certificate_id, 
     qr_code, 
     status
   FROM batches
   WHERE id = 'your-batch-id';
   ```

## Troubleshooting

### Issue: Blockchain not recording
**Check**:
1. Frontend Bridge running? → `http://localhost:8080/health`
2. Blockchain Bridge running? → `http://172.29.54.144:9000/health`
3. Check Next.js logs for blockchain errors
4. Check image_verifications.blockchainTxId column

### Issue: QR not auto-generating
**Check**:
1. All 7 stages have ≥2 verified images?
2. Check Next.js console after Stage 7 verification
3. Look for "🎯 Stage 7 verified - checking if all stages complete"
4. Check batches.certificate_id column

### Issue: First image not including farmer details
**Check**:
1. Verify image_verifications.isFirstImageInBatch = true
2. Check Frontend Bridge logs for "First Image: YES ✨"
3. Check Blockchain Bridge logs for "RecordBatchWithImage"

## Environment Variables

```env
# Frontend Bridge
FRONTEND_BRIDGE_PORT=8080
BLOCKCHAIN_BRIDGE_URL=http://172.29.54.144:9000

# Blockchain Bridge
BLOCKCHAIN_PORT=9000
FABRIC_PEER=peer0.farmer.graintrust.com:7051
FABRIC_CHANNEL=graintrust-channel
FABRIC_CHAINCODE=graintrust
```

## Production Considerations

### TODO: Replace Mock with Real Fabric SDK
```javascript
// In blockchain-bridge.js
// Replace this:
const transactionId = `TX-${crypto.randomBytes(16).toString('hex')}`;

// With this:
const { Gateway, Wallets } = require('fabric-network');
const gateway = new Gateway();
await gateway.connect(connectionProfile, {
  wallet,
  identity: 'admin',
  discovery: { enabled: true, asLocalhost: false }
});
const network = await gateway.getNetwork('graintrust-channel');
const contract = network.getContract('graintrust');
const result = await contract.submitTransaction('RecordImage', JSON.stringify(imageData));
```

### Security
- Add API key authentication between bridges
- Use HTTPS in production
- Validate all input data
- Rate limiting on API endpoints
- Encrypt sensitive farmer data

### Monitoring
- Log all blockchain transactions
- Alert on blockchain recording failures
- Monitor bridge health
- Track QR generation success rate

## Summary

✅ **Automated**: Every verified image → blockchain (no manual intervention)  
✅ **First Image**: Complete farmer + batch context  
✅ **Subsequent Images**: Incremental image data  
✅ **Smart Trigger**: Auto-generate QR when Stage 7 complete  
✅ **Validation**: Each stage must have ≥2 images  
✅ **Traceable**: Every image has blockchain transaction ID  
✅ **Immutable**: Blockchain ensures data integrity  
✅ **Transparent**: QR certificate links to blockchain record  

---

**Last Updated**: January 31, 2025  
**Version**: 1.0  
**Status**: ✅ Ready for Testing
