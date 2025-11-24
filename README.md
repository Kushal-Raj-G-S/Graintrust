# 🌾 GrainTrust Blockchain System

## ONE-COMMAND STARTUP

After PC restart or VS Code crash, just run:

```bash
cd /home/kush/graintrust-2.0
bash blockchain/START_BLOCKCHAIN.sh
```

That's it! The script will:
- ✅ Check if network is running
- ✅ Start Fabric network if needed
- ✅ Deploy chaincode automatically
- ✅ Create connection profiles
- ✅ Start bridge server on port 9000
- ✅ Show complete system status

## What Just Happened?

The startup script just completed successfully! Your system is now:

### ✅ Running:
- **3 Docker Containers**: orderer + 2 peers
- **Fabric Channel**: graintrust
- **Bridge Server**: http://localhost:9000 (PID: 11073)
- **Verification Page**: http://localhost:9000/verify.html

### ⏳ In Progress:
- **Chaincode Deployment**: graincc v1.1 (installing on peers)

## Quick Status Check

```bash
# Check Docker containers
docker ps

# Check bridge server
curl http://localhost:9000/health

# Check chaincode (after deployment completes)
cd /home/kush/graintrust-2.0/blockchain/fabric-samples/test-network
export PATH=${PWD}/../bin:$PATH
peer lifecycle chaincode querycommitted --channelID graintrust --name graincc
```

## API Endpoints (Once Chaincode is Deployed)

### Record Image
```bash
POST http://localhost:9000/record-image
# or from frontend: http://172.29.54.144:9000/record-image
```

### Generate Certificate (After 7 stages)
```bash
POST http://localhost:9000/generate-certificate
```

### View Certificate
```bash
GET http://localhost:9000/verify/CERT-xxxxx
# or browse: http://localhost:9000/verify.html
```

## System Files

```
/home/kush/graintrust-2.0/
├── blockchain/                    ← All blockchain components
│   ├── START_BLOCKCHAIN.sh         ← RUN THIS AFTER PC RESTART
│   ├── QUICK_START_GUIDE.md        ← Detailed guide
│   ├── fabric-samples/
│   │   ├── test-network/           ← Blockchain network
│   │   └── chaincode/grain/        ← Smart contract
│   └── blockchain-api/
│       ├── blockchain-bridge.js    ← Bridge server
│       ├── bridge.log             ← Server logs
│       ├── wallet/                 ← Auto-created
│       ├── connection-org1.json    ← Auto-created
│       └── public/
│           └── verify.html         ← Branded verification page
└── README.md                       ← This file
```

## Troubleshooting

### If Something Fails:

**1. Complete Clean Restart:**
```bash
# Stop everything
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker volume rm $(docker volume ls -q | grep -E 'peer0|orderer')

# Run startup script
cd /home/kush/graintrust-2.0
bash blockchain/START_BLOCKCHAIN.sh
```

**2. Check Logs:**
```bash
# Bridge logs
tail -f /home/kush/graintrust-2.0/blockchain/blockchain-api/bridge.log

# Docker logs
docker logs peer0.farmer.graintrust.com
```

**3. Verify Network:**
```bash
docker ps  # Should show 3 containers
curl http://localhost:9000/health  # Should return healthy
```

## Next Steps

1. **Wait for chaincode deployment to complete** (check with `docker ps` - you'll see chaincode containers)
2. **Test from your frontend** at localhost:3005
3. **Record images** for 7 stages (minimum 2 images each)
4. **Generate certificate** after completion
5. **Scan QR code** to see branded verification page

## Important Notes

- **Network persists** across terminal sessions (runs in Docker)
- **Bridge runs in background** (check logs at blockchain/blockchain-api/bridge.log)
- **Wallet auto-recreates** when network restarts
- **Connection profile auto-creates** if missing

---

**🌾 GrainTrust - Blockchain-Verified Grain Supply Chain 🌾**

*For detailed information, see [blockchain/QUICK_START_GUIDE.md](./blockchain/QUICK_START_GUIDE.md)*
