# 🚀 Quick Start: Blockchain Image Verification

## TL;DR - Start Everything

```bash
# Terminal 1: Frontend Bridge (Windows)
cd "e:\BMSIT\Hackathon projects\BioBloom\blockchain\graintrust-2.0"
node bridges/frontend-bridge.js

# Terminal 2: Blockchain Bridge (Ubuntu - SSH into 172.29.54.144)
cd /path/to/graintrust-2.0
node bridges/blockchain-bridge.js

# Terminal 3: Next.js Dev Server
npm run dev

# Terminal 4: Test the flow
node scripts/test-image-blockchain-flow.js
```

## What Happens Automatically

1. **Admin clicks "Verify as Real"** → Image verified ✅
2. **System checks**: Is this the first image in batch?
   - **YES** → Send farmer + batch + image to blockchain
   - **NO** → Send image data only
3. **Blockchain records** → Transaction ID returned
4. **Database updated** → blockchain_tx_id stored
5. **Stage 7 check**: If Stage 7 ≥2 images:
   - Count all 7 stages
   - If ALL stages ≥2 images → **Auto-generate QR certificate** 🎉

## Check It's Working

### 1. Check Bridges Running
```bash
# Frontend Bridge
curl http://localhost:8080/health

# Blockchain Bridge (from Ubuntu)
curl http://localhost:9000/health
```

### 2. Watch Logs
When you verify an image, you should see:

**Frontend Bridge**:
```
╔══════════════════════════════════════════════════════════════╗
║        📸 IMAGE VERIFICATION → BLOCKCHAIN                    ║
╚══════════════════════════════════════════════════════════════╝

🖼️  Image Details:
   Batch ID: 550e8400-e29b-41d4-a716-446655440000
   Stage: stage-1
   First Image: YES ✨

👨‍🌾 Farmer: John Farmer
📦 Crop: Wheat - 500kg
✅ Image recorded to blockchain

🔗 Blockchain Details:
   Transaction ID: TX-abc123...
   Block Number: 552145
```

**Blockchain Bridge**:
```
╔══════════════════════════════════════════════════════════════╗
║        📸 RECORDING IMAGE TO BLOCKCHAIN                      ║
╚══════════════════════════════════════════════════════════════╝

✅ Image recorded to blockchain!

🔗 Blockchain Details:
   Transaction ID: TX-abc123...
   Block Number: 552145
   Chaincode: RecordBatchWithImage
```

### 3. Check Database
```sql
-- Check blockchain transaction IDs
SELECT 
  "stageId",
  "imageUrl",
  "blockchainTxId",
  "blockNumber",
  "isFirstImageInBatch",
  "blockchainRecordedAt"
FROM image_verifications
WHERE "batchId" = 'your-batch-id'
ORDER BY "verifiedAt";

-- Expected output:
-- stageId  | blockchainTxId | blockNumber | isFirstImageInBatch
-- stage-1  | TX-abc123...   | 552145      | true
-- stage-1  | TX-def456...   | 552146      | false
-- stage-2  | TX-ghi789...   | 552147      | false
```

## Complete Test Flow

### Step 1: Run Migration (First Time Only)
```bash
# Connect to Supabase SQL Editor
# Run: database/add-blockchain-columns-to-verifications.sql
```

### Step 2: Start Bridges
```bash
# Windows (Terminal 1)
node bridges/frontend-bridge.js

# Ubuntu (Terminal 2 - SSH)
ssh user@172.29.54.144
cd /path/to/graintrust-2.0
node bridges/blockchain-bridge.js
```

### Step 3: Start Next.js
```bash
# Terminal 3
npm run dev
```

### Step 4: Verify Images (Admin Dashboard)
1. Login as admin
2. Navigate to farmer's batch
3. Click "Verify as Real" on images
4. Watch console logs

### Step 5: Verify Stage 1 (2 images)
```
Image 1 → ✅ Recorded (with farmer+batch details)
Image 2 → ✅ Recorded (image only)
```

### Step 6: Verify Stages 2-6 (2 images each)
```
Stage 2 Image 1 → ✅ Recorded
Stage 2 Image 2 → ✅ Recorded
...
Stage 6 Image 1 → ✅ Recorded
Stage 6 Image 2 → ✅ Recorded
```

### Step 7: Verify Stage 7 (2 images - triggers QR)
```
Stage 7 Image 1 → ✅ Recorded
Stage 7 Image 2 → ✅ Recorded → 🎯 ALL STAGES COMPLETE!
                              ↓
                   🎉 AUTO-GENERATE QR CERTIFICATE
```

### Step 8: Check QR Certificate
```sql
SELECT 
  id,
  certificate_id,
  qr_code,
  status
FROM batches
WHERE id = 'your-batch-id';

-- Expected output:
-- certificate_id          | qr_code                                    | status
-- CERT-uuid-timestamp     | https://graintrust.com/verify/CERT-...    | certified
```

## Troubleshooting

### ❌ Error: "Frontend Bridge unavailable"
**Fix**:
```bash
# Check if running
curl http://localhost:8080/health

# Start if not running
node bridges/frontend-bridge.js
```

### ❌ Error: "Blockchain Bridge unavailable"
**Fix**:
```bash
# SSH to Ubuntu
ssh user@172.29.54.144

# Check if running
curl http://localhost:9000/health

# Start if not running
node bridges/blockchain-bridge.js
```

### ❌ Error: "Column blockchainTxId does not exist"
**Fix**:
```bash
# Run migration in Supabase SQL Editor
# File: database/add-blockchain-columns-to-verifications.sql
```

### ⚠️ Warning: QR not auto-generating
**Check**:
1. All 7 stages have ≥2 images?
2. Look for this log after Stage 7 verification:
   ```
   🎯 Stage 7 verified - checking if all stages complete...
   ✅ All 7 stages complete! Generating QR certificate...
   ```
3. Check for errors in Next.js console

## Key Files

```
📁 graintrust-2.0/
├─ 📁 bridges/
│  ├─ frontend-bridge.js          ← Start on Windows (port 8080)
│  └─ blockchain-bridge.js         ← Start on Ubuntu (port 9000)
│
├─ 📁 src/app/api/
│  ├─ image-verification/route.ts ← Main verification endpoint
│  └─ blockchain/
│     ├─ record-image/route.ts    ← Records to blockchain
│     └─ generate-qr/route.ts     ← Generates QR certificate
│
├─ 📁 database/
│  └─ add-blockchain-columns-to-verifications.sql ← Run first time
│
├─ 📁 scripts/
│  └─ test-image-blockchain-flow.js ← Test complete flow
│
└─ 📄 BLOCKCHAIN_IMAGE_FLOW.md    ← Full documentation
```

## Expected Behavior

### When Admin Verifies Image:
```
1. ✅ Image saved to database
2. 🔔 Notification sent to farmer
3. 🔗 Blockchain recording started
4. 📦 Transaction ID returned
5. 💾 Blockchain details saved
6. 🎯 Stage 7 check (if applicable)
```

### First Image in Batch:
```json
{
  "farmer": "John Farmer",
  "crop": "Wheat - 500kg",
  "location": "Karnataka",
  "image": "stage-1.jpg"
}
→ Complete context recorded to blockchain ✨
```

### Subsequent Images:
```json
{
  "image": "stage-2.jpg",
  "stage": "stage-2"
}
→ Incremental data recorded to blockchain 📸
```

### When All Stages Complete:
```
🎉 QR Certificate Auto-Generated!

Certificate: CERT-uuid-timestamp
QR Code: https://graintrust.com/verify/CERT-...
Status: ✅ Certified
```

## Next Steps After Setup

1. ✅ Verify images through admin dashboard
2. ✅ Check blockchain transaction IDs in database
3. ✅ Complete all 7 stages (2+ images each)
4. ✅ Verify QR certificate generated
5. ✅ Test QR code link
6. 🚀 Replace mock blockchain with real Hyperledger Fabric SDK

## Production Checklist

- [ ] Run database migration
- [ ] Configure environment variables
- [ ] Replace mock blockchain with real Fabric SDK
- [ ] Add API authentication between bridges
- [ ] Use HTTPS for bridge communication
- [ ] Set up monitoring and alerts
- [ ] Test complete flow end-to-end
- [ ] Load test with multiple simultaneous verifications
- [ ] Document blockchain transaction format
- [ ] Create admin dashboard for blockchain monitoring

---

**Ready to test?** → `node scripts/test-image-blockchain-flow.js` 🚀

**Need help?** → Check `BLOCKCHAIN_IMAGE_FLOW.md` for detailed docs 📖

**Status**: ✅ All systems ready for testing
