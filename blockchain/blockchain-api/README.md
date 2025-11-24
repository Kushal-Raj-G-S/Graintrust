# GrainTrust Blockchain API

Bridge between Supabase frontend and Hyperledger Fabric blockchain.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode with auto-reload
npm run dev
```

## 📡 API Endpoints

### 1. Sync Batch to Blockchain
```bash
POST /api/sync-batch/:batchId
```
Fetches batch from Supabase and pushes all 7 stages to blockchain.

**Example:**
```bash
curl -X POST http://localhost:3001/api/sync-batch/31a31d00-1f51-4677-ba47-f6c51ec69d76
```

### 2. Get All Batches
```bash
GET /api/batches
```
Returns all batches with stages from Supabase.

### 3. Query Blockchain Batch
```bash
GET /api/blockchain/batch/:batchCode
```
Query batch directly from blockchain ledger.

**Example:**
```bash
curl http://localhost:3001/api/blockchain/batch/FB001
```

### 4. Verify Image Hash
```bash
POST /api/blockchain/verify-image
{
  "batchCode": "FB001",
  "stageIndex": 0,
  "imageUrl": "https://..."
}
```
Verify that an image hash matches what's on the blockchain.

### 5. Get Audit Trail
```bash
GET /api/blockchain/history/:batchCode
```
Complete transaction history for a batch.

## 🔧 Configuration

Edit `.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
CHANNEL_NAME=graintrust
CHAINCODE_NAME=graincc
PORT=3001
```

## 📊 Data Flow

```
Frontend (localhost:3005)
      ↓
  Supabase
      ↓
  API (localhost:3001)
      ↓
  Hyperledger Fabric
  (graintrust channel)
```

## 🌾 Usage Example

1. Start the API:
```bash
npm start
```

2. Sync a batch:
```bash
curl -X POST http://localhost:3001/api/sync-batch/31a31d00-1f51-4677-ba47-f6c51ec69d76
```

3. Query from blockchain:
```bash
curl http://localhost:3001/api/blockchain/batch/FB001 | jq .
```

## 🔐 Security

- Image hashes are generated using SHA-256
- All blockchain transactions are signed with FarmerOrgMSP identity
- Complete audit trail maintained on immutable ledger
