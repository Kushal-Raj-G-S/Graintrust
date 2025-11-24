#!/bin/bash

echo "🧪 Testing REAL Blockchain Integration"
echo "========================================"
echo ""

# Test 1: Record first image (creates batch)
echo "Test 1: Recording first image (creates batch on blockchain)..."
curl -X POST http://localhost:9000/record-image \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "TEST-BATCH-001",
    "stageId": "stage-1",
    "stageName": "Land Preparation",
    "verificationId": "ver-001",
    "imageUrl": "https://example.com/image1.jpg",
    "isFirstImage": true,
    "timestamp": "2025-11-02T00:00:00Z",
    "farmerDetails": {
      "name": "Test Farmer",
      "email": "test@farm.com",
      "location": "Test Farm, India"
    },
    "batchDetails": {
      "cropType": "Rice",
      "variety": "Basmati",
      "quantity": 100,
      "unit": "kg"
    }
  }'

echo -e "\n\n"
sleep 2

# Test 2: Record second image (adds stage)
echo "Test 2: Recording second image (adds stage to existing batch)..."
curl -X POST http://localhost:9000/record-image \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "TEST-BATCH-001",
    "stageId": "stage-2",
    "stageName": "Sowing",
    "verificationId": "ver-002",
    "imageUrl": "https://example.com/image2.jpg",
    "isFirstImage": false,
    "timestamp": "2025-11-02T01:00:00Z",
    "farmerDetails": {
      "location": "Test Farm, India"
    }
  }'

echo -e "\n\n"
sleep 2

# Test 3: Verify on blockchain
echo "Test 3: Verifying batch exists on blockchain..."
cd ../fabric-samples/test-network
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config/
. scripts/envVar.sh
setGlobals 1
peer chaincode query -C graintrust -n graincc -c '{"function":"queryGrainBatch","Args":["TEST-BATCH-001"]}' 2>&1 | grep -v "Using organization"

echo -e "\n\n✅ Test Complete!"
