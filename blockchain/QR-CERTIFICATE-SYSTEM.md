# 📜 GrainTrust QR Certificate System

## Overview
After all 7 stages are completed with at least 2 images per stage, the system generates a blockchain-verified certificate with a QR code. Scanning the QR code displays all batch data and images in a beautiful verification page.

## How It Works

### 1. Image Recording (During Journey)
**Endpoint:** `POST /record-image`

Your frontend sends image data for each stage:
```json
{
  "batchId": "BATCH-001",
  "stageId": 1,
  "stageName": "Land Preparation",
  "imageUrl": "https://supabase-storage-url/image1.jpg",
  "verificationId": "VER-001",
  "isFirstImage": true,  // true for first image of batch
  "farmerDetails": {
    "name": "Farmer Name",
    "email": "farmer@example.com",
    "location": "Farm Location"
  },
  "batchDetails": {
    "cropType": "Wheat",
    "variety": "HD-2967",
    "quantity": 100,
    "unit": "kg"
  }
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "TX-REAL-1730512345678",
  "chaincode": "createGrainBatch",
  "isFirstImage": true,
  "timestamp": "2025-11-02T03:22:35.909Z",
  "batchOnChain": {
    "batchId": "BATCH-001",
    "farmerName": "Farmer Name",
    "grainType": "Wheat",
    "currentStage": "Harvested",
    "stages": [...]
  }
}
```

### 2. Certificate Generation (After Completion)
**Endpoint:** `POST /generate-certificate`

Call this endpoint after all 7 stages are complete:
```json
{
  "batchId": "BATCH-001"
}
```

**Response:**
```json
{
  "success": true,
  "certificateId": "CERT-BATCH-001-1730512345678",
  "qrCodeUrl": "https://graintrust.com/verify/CERT-BATCH-001-1730512345678",
  "certificateHash": "a1b2c3d4e5f6...",
  "blockchain": {
    "channel": "graintrust",
    "chaincode": "graincc",
    "peer": "peer0.farmer.graintrust.com:7051",
    "verified": true,
    "transactionCount": 15
  },
  "batch": {
    "batchId": "BATCH-001",
    "farmerName": "Farmer Name",
    "grainType": "Wheat",
    "quantity": "100 kg",
    "totalStages": 7,
    "totalImages": 18,
    "stages": [
      {
        "stageNumber": 1,
        "stageName": "Land Preparation",
        "timestamp": "2025-11-01T10:00:00.000Z",
        "imageHash": "Qm...",
        "verifiedBy": "FarmerOrgMSP",
        "location": "Farm Field A1",
        "imageUrls": [
          "https://storage.url/image1.jpg",
          "https://storage.url/image2.jpg",
          "https://storage.url/image3.jpg"
        ],
        "imageCount": 3
      },
      // ... 6 more stages
    ]
  }
}
```

### 3. QR Code Verification (Consumer Scans)
**Endpoint:** `GET /verify/:certificateId`

When someone scans the QR code, they're directed to:
```
http://localhost:9000/verify/CERT-BATCH-001-1730512345678
```

This displays a beautiful verification page showing:
- ✅ Blockchain verification status
- 📦 Batch information (ID, farmer, crop type, quantity)
- 📸 All images from all 7 stages
- 🔗 Blockchain proof (hash, transaction count, timestamp)
- 📍 Location and verification details for each stage

## Frontend Integration Guide

### Step 1: Upload Images to Supabase Storage
```javascript
// In your frontend, after image verification
const uploadedUrl = await supabase.storage
  .from('grain-images')
  .upload(`batch-${batchId}/stage-${stageId}/image-${Date.now()}.jpg`, imageFile);
```

### Step 2: Record Image to Blockchain
```javascript
const response = await fetch('http://localhost:9000/record-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    batchId: batchId,
    stageId: currentStage,
    stageName: stageName,
    imageUrl: uploadedUrl,
    verificationId: verificationId,
    isFirstImage: currentStage === 1 && isFirstImageOfBatch,
    farmerDetails: {
      name: farmerName,
      email: farmerEmail,
      location: farmLocation
    },
    batchDetails: {
      cropType: cropType,
      variety: variety,
      quantity: quantity,
      unit: 'kg'
    }
  })
});

const result = await response.json();
if (result.success) {
  console.log('✅ Image recorded to blockchain!', result.transactionId);
}
```

### Step 3: Generate Certificate (After 7 Stages)
```javascript
// After all 7 stages complete and verified
const certResponse = await fetch('http://localhost:9000/generate-certificate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    batchId: batchId
  })
});

const certificate = await certResponse.json();
if (certificate.success) {
  // Display QR code with certificate.qrCodeUrl
  // Users can scan this QR to see all data!
  console.log('🎉 Certificate generated!');
  console.log('QR Code URL:', certificate.qrCodeUrl);
  console.log('Certificate ID:', certificate.certificateId);
  
  // Generate and display QR code
  // You can use a library like 'qrcode' to generate the actual QR image
}
```

### Step 4: Generate and Display QR Code
```javascript
// Install: npm install qrcode
import QRCode from 'qrcode';

// Generate QR code image
const qrCodeDataUrl = await QRCode.toDataURL(certificate.qrCodeUrl, {
  width: 400,
  margin: 2,
  color: {
    dark: '#000000',
    light: '#FFFFFF'
  }
});

// Display in your UI
document.getElementById('qr-code').src = qrCodeDataUrl;
```

## Supabase Database Setup

Run this SQL in your Supabase SQL Editor to create the certificates table:

```sql
-- See: supabase-certificates-table.sql
```

## Validation Rules

The system enforces:
- ✅ All 7 stages must be recorded on blockchain
- ✅ Each stage must have at least 2 images
- ✅ Batch must exist in Supabase
- ✅ All blockchain transactions must be verified

## Example Flow

1. **Farmer uploads image** → Frontend uploads to Supabase → Calls `/record-image` → Blockchain records hash
2. **Repeat for all 7 stages** (minimum 2 images each)
3. **Farmer completes journey** → Frontend calls `/generate-certificate`
4. **Certificate generated** → QR code URL returned → Frontend displays QR
5. **Consumer scans QR** → Redirected to verification page → Sees all data + images!

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/record-image` | POST | Record image hash to blockchain |
| `/generate-certificate` | POST | Generate certificate with QR code |
| `/verify/:certificateId` | GET | View certificate (QR destination) |
| `/health` | GET | Health check |

## Testing

Test the complete flow:

```bash
# 1. Record first image (creates batch)
curl -X POST http://localhost:9000/record-image \
  -H "Content-Type: application/json" \
  -d '{...}'

# 2. Record more images for all 7 stages
# ... (minimum 14 images total, 2 per stage)

# 3. Generate certificate
curl -X POST http://localhost:9000/generate-certificate \
  -H "Content-Type: application/json" \
  -d '{"batchId": "BATCH-001"}'

# 4. View certificate (open in browser)
# http://localhost:9000/verify/CERT-BATCH-001-xxxxx
```

## Production Deployment

For production:
1. Replace `http://localhost:9000` with your actual domain
2. Update QR code URL in `/generate-certificate` to use production domain
3. Set up HTTPS
4. Configure CORS properly
5. Add authentication for `/record-image` and `/generate-certificate` endpoints

---

**🎉 Now your customers can scan the QR code and see the complete blockchain-verified journey with all images!**
