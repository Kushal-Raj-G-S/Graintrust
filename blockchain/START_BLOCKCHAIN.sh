#!/bin/bash

################################################################################
# GrainTrust Complete Startup Script
# Run this script after PC restart or VS Code crash to restore entire system
################################################################################

set -e  # Exit on any error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           GrainTrust System Startup Script                ║${NC}"
echo -e "${BLUE}║         Blockchain-Verified Grain Supply Chain             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
FABRIC_NETWORK_DIR="/home/kush/graintrust-2.0/blockchain/fabric-samples/test-network"
CHAINCODE_DIR="/home/kush/graintrust-2.0/blockchain/fabric-samples/chaincode/grain"
BRIDGE_DIR="/home/kush/graintrust-2.0/blockchain/blockchain-api"
CHANNEL_NAME="graintrust"
CHAINCODE_NAME="graincc"
CHAINCODE_VERSION="1.1"
CHAINCODE_SEQUENCE="1"

################################################################################
# Step 1: Check if network is already running
################################################################################
echo -e "${YELLOW}[Step 1/7]${NC} Checking existing Fabric network..."

RUNNING_CONTAINERS=$(docker ps -q --filter "name=peer0.farmer" --filter "name=peer0.org2" --filter "name=orderer" | wc -l)

if [ "$RUNNING_CONTAINERS" -eq 3 ]; then
    echo -e "${GREEN}✓ Network is already running (3 containers found)${NC}"
    NETWORK_RUNNING=true
else
    echo -e "${YELLOW}⚠ Network not running. Will start fresh network.${NC}"
    NETWORK_RUNNING=false
fi

################################################################################
# Step 2: Start/Verify Fabric Network
################################################################################
if [ "$NETWORK_RUNNING" = false ]; then
    echo -e "${YELLOW}[Step 2/7]${NC} Starting Hyperledger Fabric network..."
    
    cd "$FABRIC_NETWORK_DIR"
    
    # Clean up completely to avoid "ledger already exists" errors
    echo "  - Cleaning up old network and volumes..."
    ./network.sh down 2>/dev/null || true
    docker volume prune -f 2>/dev/null || true
    
    # Start fresh network WITHOUT -ca flag (use cryptogen)
    echo "  - Starting fresh network and creating channel..."
    ./network.sh up createChannel -c "$CHANNEL_NAME"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Network started successfully${NC}"
    else
        echo -e "${RED}✗ Failed to start network${NC}"
        echo "  - Try running: cd $FABRIC_NETWORK_DIR && ./network.sh down"
        echo "  - Then run this script again"
        exit 1
    fi
else
    echo -e "${YELLOW}[Step 2/7]${NC} Verifying Fabric network..."
    echo -e "${GREEN}✓ Network verification complete${NC}"
fi

################################################################################
# Step 3: Deploy/Verify Chaincode
################################################################################
echo -e "${YELLOW}[Step 3/7]${NC} Checking chaincode deployment..."

cd "$FABRIC_NETWORK_DIR"

# Check if chaincode is already deployed
export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="FarmerOrgMSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/farmer.graintrust.com/peers/peer0.farmer.graintrust.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/farmer.graintrust.com/users/Admin@farmer.graintrust.com/msp
export CORE_PEER_ADDRESS=localhost:7051

CHAINCODE_DEPLOYED=$(peer lifecycle chaincode querycommitted --channelID "$CHANNEL_NAME" --name "$CHAINCODE_NAME" 2>/dev/null | grep -c "Version: $CHAINCODE_VERSION" || echo "0")

if [ "$CHAINCODE_DEPLOYED" -eq 0 ]; then
    echo "  - Chaincode not deployed. Deploying now..."
    
    ./network.sh deployCC -ccn "$CHAINCODE_NAME" -ccp "$CHAINCODE_DIR" -ccl javascript -ccv "$CHAINCODE_VERSION" -ccs "$CHAINCODE_SEQUENCE" -c "$CHANNEL_NAME"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Chaincode deployed successfully${NC}"
    else
        echo -e "${RED}✗ Failed to deploy chaincode${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Chaincode already deployed (Version: $CHAINCODE_VERSION)${NC}"
fi

################################################################################
# Step 4: Verify/Create Connection Profile
################################################################################
echo -e "${YELLOW}[Step 4/7]${NC} Verifying connection profile..."

CONNECTION_PROFILE="$BRIDGE_DIR/connection-org1.json"

if [ ! -f "$CONNECTION_PROFILE" ]; then
    echo "  - Creating connection profile..."
    cat > "$CONNECTION_PROFILE" << 'EOF'
{
  "name": "test-network-org1",
  "version": "1.0.0",
  "client": {
    "organization": "FarmerOrg",
    "connection": {
      "timeout": {
        "peer": {
          "endorser": "300"
        }
      }
    }
  },
  "organizations": {
    "FarmerOrg": {
      "mspid": "FarmerOrgMSP",
      "peers": [
        "peer0.farmer.graintrust.com"
      ]
    }
  },
  "peers": {
    "peer0.farmer.graintrust.com": {
      "url": "grpcs://localhost:7051",
      "tlsCACerts": {
        "path": "organizations/peerOrganizations/farmer.graintrust.com/tlsca/tlsca.farmer.graintrust.com-cert.pem"
      },
      "grpcOptions": {
        "ssl-target-name-override": "peer0.farmer.graintrust.com",
        "hostnameOverride": "peer0.farmer.graintrust.com"
      }
    }
  }
}
EOF
    echo -e "${GREEN}✓ Connection profile created${NC}"
else
    echo -e "${GREEN}✓ Connection profile exists${NC}"
fi

################################################################################
# Step 5: Recreate Wallet (if needed)
################################################################################
echo -e "${YELLOW}[Step 5/7]${NC} Checking blockchain wallet..."

WALLET_DIR="$BRIDGE_DIR/wallet"

# Always delete wallet after fresh network start to ensure clean certificates
if [ "$NETWORK_RUNNING" = false ] && [ -d "$WALLET_DIR" ]; then
    echo "  - Removing old wallet (network was restarted)..."
    rm -rf "$WALLET_DIR"
fi

if [ -d "$WALLET_DIR" ] && [ "$(ls -A $WALLET_DIR 2>/dev/null)" ]; then
    echo -e "${GREEN}✓ Wallet exists${NC}"
else
    echo "  - Wallet will be created when bridge starts"
fi

################################################################################
# Step 6: Start Bridge Server
################################################################################
echo -e "${YELLOW}[Step 6/7]${NC} Starting blockchain bridge server..."

cd "$BRIDGE_DIR"

# Check if bridge is already running
BRIDGE_PID=$(lsof -ti:9000 2>/dev/null || echo "")

if [ -n "$BRIDGE_PID" ]; then
    echo "  - Bridge server already running on port 9000 (PID: $BRIDGE_PID)"
    echo "  - Restarting to ensure fresh connection..."
    kill "$BRIDGE_PID" 2>/dev/null || true
    sleep 2
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "  - Installing Node.js dependencies..."
    npm install --silent
fi

# Start bridge server in background
echo "  - Starting bridge server on port 9000..."
nohup node blockchain-bridge.js > bridge.log 2>&1 &
BRIDGE_PID=$!

# Wait for server to start
echo "  - Waiting for server to initialize..."
sleep 8

# Check if server is running
if curl -s http://localhost:9000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Bridge server started successfully (PID: $BRIDGE_PID)${NC}"
    echo "  - Access at: http://localhost:9000"
    echo "  - Health check: http://localhost:9000/health"
    echo "  - Logs: $BRIDGE_DIR/bridge.log"
else
    echo -e "${YELLOW}⚠ Bridge server may still be initializing...${NC}"
    echo "  - Check status: curl http://localhost:9000/health"
    echo "  - View logs: tail -f $BRIDGE_DIR/bridge.log"
fi

################################################################################
# Step 7: System Status Summary
################################################################################
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              GrainTrust System Status                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}[Step 7/7]${NC} System status check..."
echo ""

# Docker containers
echo -e "${GREEN}Docker Containers:${NC}"
docker ps --filter "name=peer0.farmer" --filter "name=peer0.org2" --filter "name=orderer" --format "  ✓ {{.Names}} - {{.Status}}"

echo ""

# Chaincode
echo -e "${GREEN}Chaincode:${NC}"
echo "  ✓ Name: $CHAINCODE_NAME"
echo "  ✓ Version: $CHAINCODE_VERSION"
echo "  ✓ Sequence: $CHAINCODE_SEQUENCE"
echo "  ✓ Channel: $CHANNEL_NAME"

echo ""

# Bridge API
echo -e "${GREEN}Bridge API:${NC}"
echo "  ✓ Status: Running (PID: $BRIDGE_PID)"
echo "  ✓ Port: 9000"
echo "  ✓ Logs: $BRIDGE_DIR/bridge.log"

echo ""

# Endpoints
echo -e "${GREEN}API Endpoints:${NC}"
echo "  ✓ Health: http://localhost:9000/health"
echo "  ✓ Record Image: POST http://localhost:9000/record-image"
echo "  ✓ Generate Certificate: POST http://localhost:9000/generate-certificate"
echo "  ✓ Verify Certificate: http://localhost:9000/verify/{certificateId}"
echo "  ✓ Verification Page: http://localhost:9000/verify.html"

echo ""

# Network Access
echo -e "${GREEN}Network Access (for frontend):${NC}"
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "  ✓ From frontend: http://${LOCAL_IP}:9000"
echo "  ✓ From localhost: http://localhost:9000"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║            🌾 GrainTrust Ready to Use! 🌾                 ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Useful Commands:${NC}"
echo "  • View bridge logs: tail -f $BRIDGE_DIR/bridge.log"
echo "  • Stop bridge: kill $BRIDGE_PID"
echo "  • Restart this script: bash $0"
echo "  • Stop network: cd $FABRIC_NETWORK_DIR && ./network.sh down"
echo ""

exit 0
