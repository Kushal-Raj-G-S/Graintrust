# 🌾 GrainTrust 2.0

> **Blockchain-Powered Agricultural Supply Chain Transparency Platform**

[![Next.js](https://img.shields.io/static/v1?label=Next.js&message=15.3&color=000000&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/static/v1?label=TypeScript&message=5.0&color=3178C6&logo=typescript)](https://www.typescriptlang.org/)
[![Hyperledger Fabric](https://img.shields.io/static/v1?label=Hyperledger%20Fabric&message=2.5&color=2F3134&logo=hyperledger)](https://www.hyperledger.org/use/fabric)
[![Supabase](https://img.shields.io/static/v1?label=Supabase&message=Database&color=3ECF8E&logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/static/v1?label=License&message=MIT&color=44cc11)](LICENSE)

GrainTrust is a comprehensive blockchain-based platform designed to ensure transparency, authenticity, and traceability across the agricultural supply chain. From farm to fork, every step is verified, recorded, and accessible through AI-powered image verification, QR code certificates, and real-time market data.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [User Roles](#-user-roles)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Complete Workflow](#-complete-workflow)
- [Blockchain Integration](#-blockchain-integration)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

GrainTrust 2.0 addresses critical challenges in agricultural supply chains:

- **Lack of Transparency**: Real-time tracking of products from farm to consumer
- **Counterfeit Products**: Blockchain-backed authenticity verification
- **Trust Deficit**: Immutable records building trust among stakeholders
- **Information Asymmetry**: Equal access to supply chain data for all parties
- **Quality Assurance**: AI-powered image verification at each stage

### Problem Statement

The agricultural industry faces significant challenges with:
- Fake pesticides and seeds causing crop failures
- Lack of visibility in supply chains
- Consumer uncertainty about product authenticity
- Difficulty in tracing contaminated products
- Farmer exploitation due to information gaps

### Our Solution

GrainTrust provides:
- **End-to-end traceability** using blockchain technology
- **QR code-based verification** for instant product authentication
- **Multi-stakeholder platform** connecting farmers, manufacturers, and consumers
- **AI-powered fraud detection** through image verification
- **Real-time market data** integration (NCDEX prices)
- **Educational resources** for all stakeholders
- **Community-driven trust** through transparency

---

## ✨ Key Features

### 🔐 Blockchain-Powered Security
- **Immutable Records**: All transactions recorded on Hyperledger Fabric
- **Tamper-Proof**: Cryptographic hashing ensures data integrity
- **Decentralized**: No single point of failure
- **Audit Trail**: Complete history of product journey

### 📸 AI Image Verification
- **7-Stage Verification**: Land Preparation → Sowing → Growth → Maintenance → Harvesting → Processing → Storage
- **Hugging Face AI Integration**: Automated fake image detection
- **Manual Admin Review**: Human oversight for critical decisions
- **Blockchain Recording**: Every verified image recorded on-chain

### 📱 QR Code Certificates
- **Auto-Generation**: Triggered when all 7 stages complete (2+ images per stage)
- **Scannable Verification**: Consumers verify authenticity instantly
- **Detailed Timeline**: Complete supply chain journey visualization
- **Downloadable Certificates**: PDF/PNG export for sharing

### 👥 Multi-Role Platform
- **Farmers**: Create and track crop batches
- **Manufacturers**: Manage product batches and certifications
- **Consumers**: Verify product authenticity via QR scanning
- **Admins**: Monitor system, verify images, manage users
- **Education Center**: Learning resources accessible to all

### 🌐 Multilingual Support
- **5 Languages**: English, Hindi, Kannada, Bengali, Tamil
- **Auto-Detection**: Browser language detection
- **Seamless Switching**: Change language on-the-fly

### 📊 Analytics & Insights
- **Real-Time Dashboards**: Track batches, verifications, fraud reports
- **NCDEX Price Integration**: Live commodity market data
- **Fraud Detection Analytics**: Identify patterns and trends
- **Performance Metrics**: Batch completion rates, verification statistics

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15.3 (React 19)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 4.0
- **UI Components**: Radix UI, Shadcn/ui
- **Animations**: Framer Motion, Lottie React
- **State Management**: React Context API
- **Forms**: React Hook Form + Zod validation

### Backend
- **Runtime**: Node.js 18+
- **API Routes**: Next.js API Routes
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma 6.11
- **Authentication**: Custom JWT-based auth
- **File Storage**: Supabase Storage

### Blockchain
- **Platform**: Hyperledger Fabric 2.5
- **Bridge Architecture**: Dual-server setup (Frontend Bridge + Blockchain Bridge)
- **Chaincode**: Smart contracts for batch/image recording
- **Consensus**: Practical Byzantine Fault Tolerance (PBFT)

### AI/ML
- **Image Verification**: Hugging Face Inference API
- **Model**: Pre-trained image classification models
- **Fake Detection**: Binary classification (Real/Fake)

### Third-Party APIs
- **Market Data**: NCDEX (National Commodity & Derivatives Exchange)
- **Web Scraping**: Cheerio for price fetching
- **QR Generation**: qrcode library
- **PDF Export**: jsPDF, html2canvas

### DevOps & Tools
- **Version Control**: Git
- **Package Manager**: npm
- **Code Quality**: ESLint
- **Database Migration**: Prisma Migrate
- **Environment**: .env files

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GRAINTRUST ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│   CLIENT (Browser)   │
│   Next.js Frontend   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────┐
│        Next.js API Routes (Backend)       │
│  - /api/batches                          │
│  - /api/image-verification               │
│  - /api/blockchain/*                     │
│  - /api/auth/*                           │
└──────┬──────────┬────────────────┬───────┘
       │          │                │
       ▼          ▼                ▼
┌──────────┐ ┌──────────┐  ┌──────────────────┐
│ Supabase │ │ Prisma   │  │ Frontend Bridge  │
│ Storage  │ │ ORM      │  │ (localhost:8080) │
└──────────┘ └────┬─────┘  └────────┬─────────┘
                  │                 │
                  ▼                 ▼
         ┌─────────────────┐ ┌─────────────────────┐
         │  PostgreSQL DB  │ │ Blockchain Bridge   │
         │   (Supabase)    │ │ (Ubuntu:9000)       │
         └─────────────────┘ └──────────┬──────────┘
                                        │
                                        ▼
                              ┌──────────────────────┐
                              │ Hyperledger Fabric   │
                              │   - Peer Nodes       │
                              │   - Orderer Nodes    │
                              │   - Smart Contracts  │
                              └──────────────────────┘
```

---

## 👥 User Roles

### 1. 🚜 Farmer
**Primary Users**: Agricultural producers

**Capabilities**:
- Create crop batches with details (crop type, variety, quantity)
- Upload images for each farming stage (7 stages)
- Track batch progress through supply chain
- Generate QR certificates for verified batches
- View notifications on image verification status
- Access market prices (NCDEX integration)

### 2. 🏭 Manufacturer
**Primary Users**: Seed/pesticide producers, food processors

**Capabilities**:
- Create product batches
- Link to farmer batches for traceability
- Manage quality certifications
- Generate product QR codes
- Track compliance and lab tests

### 3. 👥 Consumer
**Primary Users**: End consumers, retailers

**Capabilities**:
- Scan QR codes to verify product authenticity
- View complete supply chain journey
- Access product information and certifications
- Report suspected fraud
- Learn about product origins

### 4. 🎓 Education Center
**Available to**: All users (public access)

**Content**:
- How to identify fake products
- Understanding supply chain transparency
- Blockchain basics for agriculture
- Best practices for farmers
- Consumer rights and safety
- Community Q&A forums

### 5. 🛡️ Admin
**Primary Users**: Platform administrators

**Capabilities**:
- Verify uploaded images (AI-assisted + manual review)
- Manage user accounts
- Monitor system analytics
- Handle fraud reports
- View all batches across farmers
- Generate system-wide reports

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Docker**: For blockchain network
- **PostgreSQL**: v14.0 or higher (or Supabase account)

### 1. Clone and Install

```bash
git clone https://github.com/Kushal-Raj-G-S/Graintrust.git
cd graintrust-2.0
npm install
```

### 2. Database Setup

Create a Supabase project and run the setup scripts in Supabase SQL Editor:
- `blockchain/blockchain-api/supabase-certificates-table.sql`
- `database/supabase-setup.sql`
- `database/supabase-batches-setup.sql`
- `database/supabase-image-verification-setup.sql`
- `database/add-blockchain-columns-to-verifications.sql`
- `database/ncdex-prices-setup.sql`
- `database/supabase-notifications-FIXED.sql`
- `database/supabase-appeals-setup.sql`

### 3. Environment Configuration

Create `.env.local`:
```env
DATABASE_URL="your-supabase-connection-string"
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NEXT_PUBLIC_FRONTEND_BRIDGE_URL="http://localhost:8080"
BLOCKCHAIN_BRIDGE_URL="http://172.29.54.144:9000"
HUGGINGFACE_API_KEY="your-huggingface-key"
JWT_SECRET="your-jwt-secret"
```

### 4. Start Blockchain Network

```bash
cd blockchain
bash START_BLOCKCHAIN.sh
```

This starts:
- Hyperledger Fabric network (3 containers)
- Blockchain bridge server (port 9000)
- Chaincode deployment

### 5. Start Frontend

```bash
# Terminal 1: Frontend Bridge
node bridges/frontend-bridge.js

# Terminal 2: Next.js App
npm run dev
```

Access at: http://localhost:3005

### 6. Create Test Data

```bash
npm run db:seed
```

Demo accounts:
- **Farmer**: farmer@demo.com / farmer123
- **Admin**: admin@graintrust.com / admin123
- **Consumer**: consumer@demo.com / consumer123

---

## 📁 Project Structure

```
graintrust-2.0/
├── blockchain/                    # Blockchain components
│   ├── START_BLOCKCHAIN.sh         # One-command startup
│   ├── QUICK_START_GUIDE.md        # Blockchain guide
│   ├── fabric-samples/            # Hyperledger Fabric
│   │   ├── test-network/          # Blockchain network
│   │   └── chaincode/grain/       # Smart contracts
│   └── blockchain-api/            # Bridge server
│       ├── blockchain-bridge.js   # Main bridge
│       ├── server.js              # API server
│       └── public/verify.html     # Verification page
├── bridges/                       # Bridge servers
│   ├── frontend-bridge.js         # Frontend ↔ Blockchain
│   └── blockchain-bridge.js       # Blockchain connection
├── database/                      # Database schemas
│   ├── supabase-setup.sql         # Main schema
│   ├── supabase-batches-setup.sql # Batch tables
│   └── ncdex-prices-setup.sql     # Market data
├── prisma/                        # Database ORM
│   ├── schema.prisma              # Schema definition
│   └── seed.ts                    # Seed script
├── public/                        # Static assets
├── src/                           # Frontend source
│   ├── app/                       # Next.js app router
│   │   ├── admin/                 # Admin pages
│   │   ├── api/                   # API routes
│   │   ├── farmer/                # Farmer dashboard
│   │   ├── consumer/              # Consumer pages
│   │   └── market/                # Market data
│   ├── components/                # React components
│   ├── context/                   # React context
│   ├── hooks/                     # Custom hooks
│   ├── lib/                       # Utilities
│   └── types/                     # TypeScript types
├── scripts/                       # Utility scripts
├── .env.local                     # Environment vars
├── package.json                   # Dependencies
├── next.config.ts                 # Next.js config
└── README.md                      # This file
```

---

## 🔄 Complete Workflow

### Phase 1: Farmer Creates Batch
1. **Farmer Login** → Dashboard
2. **Create Batch** → Enter crop details (wheat, rice, etc.)
3. **Upload Images** → 7 stages, minimum 2 images each
4. **AI Verification** → Hugging Face analyzes authenticity
5. **Admin Review** → Manual verification of AI results

### Phase 2: Blockchain Recording
1. **First Image** → Records farmer + batch + image data
2. **Subsequent Images** → Incremental image data only
3. **Stage Completion** → All 7 stages verified
4. **Auto QR Generation** → Certificate created

### Phase 3: Consumer Verification
1. **QR Scan** → Consumer scans product QR code
2. **Blockchain Fetch** → Retrieve complete supply chain
3. **Timeline View** → See all 7 stages with images
4. **Authenticity Check** → Verify blockchain-backed data

### Phase 4: Market Integration
1. **NCDEX Prices** → Real-time commodity prices
2. **Farmer Access** → Market insights for pricing
3. **Trend Analysis** → Historical price data
4. **Automated Updates** → Daily price fetching

---

## ⛓️ Blockchain Integration

### Bridge Architecture

**Why Two Bridges?**
1. **Frontend Bridge** (localhost:8080):
   - Runs alongside Next.js app
   - Handles frontend requests
   - Forwards to Blockchain Bridge

2. **Blockchain Bridge** (172.29.54.144:9000):
   - Runs on server with Hyperledger Fabric
   - Connects to blockchain network
   - Executes smart contracts

### Smart Contracts

#### RecordBatchWithImage
Records first image with complete batch context.

#### RecordImage
Records subsequent images (incremental data).

#### GenerateCertificate
Creates QR certificate when all stages complete.

### Data Flow

```
Farmer Upload → AI Analysis → Admin Verify → Blockchain Record → QR Generate → Consumer Verify
```

---

## 🚢 Deployment

### Frontend (Vercel)
```bash
npm run build
npm start
```

### Backend Bridges
```bash
# Frontend Bridge
pm2 start bridges/frontend-bridge.js --name "graintrust-frontend-bridge"

# Blockchain Bridge
pm2 start bridges/blockchain-bridge.js --name "graintrust-blockchain-bridge"
```

### Blockchain Network
```bash
cd blockchain
bash START_BLOCKCHAIN.sh
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style
- Follow existing TypeScript/React patterns
- Use Prettier for formatting
- Run ESLint before committing
- Write meaningful commit messages

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📧 Contact & Support

- **Project Lead**: Kushal Raj G S
- **GitHub**: [Kushal-Raj-G-S/Graintrust](https://github.com/Kushal-Raj-G-S/Graintrust)
- **Issues**: [GitHub Issues](https://github.com/Kushal-Raj-G-S/Graintrust/issues)

---

## 🙏 Acknowledgments

- **Hyperledger Fabric** for blockchain infrastructure
- **Supabase** for database and storage
- **Hugging Face** for AI/ML capabilities
- **NCDEX** for market data
- **Next.js** and **Vercel** for web framework
- **Open Source Community** for amazing tools and libraries

---

**Built with ❤️ for a transparent agricultural future**

*For detailed documentation, see [frontend/README.md](./frontend/README.md) and [blockchain/QUICK_START_GUIDE.md](./blockchain/QUICK_START_GUIDE.md)*
