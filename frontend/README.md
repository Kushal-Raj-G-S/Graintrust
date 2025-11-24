# 🌾 GrainTrust 2.0

> **Blockchain-Powered Agricultural Supply Chain Transparency Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Hyperledger Fabric](https://img.shields.io/badge/Hyperledger-Fabric-2F3134?logo=hyperledger)](https://www.hyperledger.org/use/fabric)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

GrainTrust is a comprehensive blockchain-based platform designed to ensure transparency, authenticity, and traceability across the agricultural supply chain. From farm to fork, every step is verified, recorded, and accessible.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [User Roles](#-user-roles)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [Core Features](#-core-features)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Blockchain Integration](#-blockchain-integration)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
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
- **Inclusive Design**: Reaches diverse user base

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
- **Runtime**: Node.js
- **API Routes**: Next.js API Routes
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma 6.11
- **Authentication**: Custom JWT-based auth
- **File Storage**: Supabase Storage

### Blockchain
- **Platform**: Hyperledger Fabric
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

┌─────────────────────────────────────────────────────────────────┐
│                     DATA FLOW - IMAGE VERIFICATION              │
└─────────────────────────────────────────────────────────────────┘

Admin Verifies Image
        ↓
Store in DB (image_verifications)
        ↓
Check: First image in batch?
 ├─ YES → Send farmer + batch + image data
 └─ NO  → Send image data only
        ↓
POST /api/blockchain/record-image
        ↓
Frontend Bridge (:8080) → /record-image
        ↓
Blockchain Bridge (:9000) → /record-image
        ↓
Hyperledger Fabric → chaincode.RecordImage()
        ↓
Return blockchain transaction details
        ↓
Update DB with blockchain metadata
        ↓
If Stage 7 complete (all 7 stages ≥2 images):
        ↓
Auto-generate QR certificate
        ↓
✅ Complete!
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

**Dashboard Features**:
- Active batches overview
- Verification status tracking
- Batch timeline visualization
- Certificate management

### 2. 🏭 Manufacturer
**Primary Users**: Seed/pesticide producers, food processors

**Capabilities**:
- Create product batches
- Link to farmer batches for traceability
- Manage quality certifications
- Generate product QR codes
- Track compliance and lab tests

**Dashboard Features**:
- Product batch management
- Quality certification tracking
- Supply chain linkage
- Analytics and reporting

### 3. 👥 Consumer
**Primary Users**: End consumers, retailers

**Capabilities**:
- Scan QR codes to verify product authenticity
- View complete supply chain journey
- Access product information and certifications
- Report suspected fraud
- Learn about product origins

**Dashboard Features**:
- QR scanner interface
- Product verification history
- Fraud reporting system
- Educational resources

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

**Dashboard Features**:
- Image verification queue
- Fraud detection analytics
- User management
- System health monitoring
- Batch oversight for all farmers

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **PostgreSQL**: v14.0 or higher (or Supabase account)
- **Git**: Latest version

### System Requirements

- **OS**: Windows 10+, macOS 10.15+, Ubuntu 20.04+
- **RAM**: Minimum 8GB (16GB recommended)
- **Storage**: 2GB free space

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/graintrust-2.0.git
cd graintrust-2.0
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js, React, TypeScript
- Prisma ORM
- Supabase client
- UI libraries (Radix, Tailwind)
- Blockchain bridge dependencies
- AI/ML libraries

### 3. Database Setup

#### Option A: Using Supabase (Recommended)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Note your project URL and service role key
3. Run the database setup scripts:

```bash
# In Supabase SQL Editor, run these in order:
# 1. database/supabase-setup.sql
# 2. database/supabase-batches-setup.sql
# 3. database/supabase-image-verification-setup.sql
# 4. database/add-blockchain-columns-to-verifications.sql
# 5. database/ncdex-prices-setup.sql
# 6. database/supabase-notifications-FIXED.sql
# 7. database/supabase-appeals-setup.sql
```

#### Option B: Local PostgreSQL

```bash
# Create database
createdb graintrust

# Run Prisma migrations
npx prisma migrate dev

# Seed database with demo data
npm run db:seed
```

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/graintrust"
DIRECT_URL="postgresql://user:password@localhost:5432/graintrust"

# Supabase (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Blockchain Bridges
NEXT_PUBLIC_FRONTEND_BRIDGE_URL="http://localhost:8080"
BLOCKCHAIN_BRIDGE_URL="http://172.29.54.144:9000"

# Hugging Face AI
HUGGINGFACE_API_KEY="your-huggingface-api-key"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3005"
NODE_ENV="development"

# Security (generate secure random strings)
JWT_SECRET="your-jwt-secret-key"
ENCRYPTION_KEY="your-encryption-key"
```

### Get Required API Keys

1. **Supabase**: 
   - Sign up at [supabase.com](https://supabase.com)
   - Create a project
   - Get URL and keys from Settings → API

2. **Hugging Face**:
   - Sign up at [huggingface.co](https://huggingface.co)
   - Go to Settings → Access Tokens
   - Create a new token

---

## 🏃 Running the Application

### Development Mode

#### 1. Start the Database

```bash
# If using Supabase, skip this step

# If using local PostgreSQL:
sudo service postgresql start  # Linux
brew services start postgresql  # macOS
```

#### 2. Start Frontend Bridge (Windows Terminal)

```bash
node bridges/frontend-bridge.js
```

Expected output:
```
╔══════════════════════════════════════════════════════════════╗
║        🌉 FRONTEND BRIDGE SERVER STARTED                     ║
╚══════════════════════════════════════════════════════════════╝

   🌐 Server: http://localhost:8080
   📍 Endpoints:
      - POST /generate-qr
      - POST /record-image
   🔗 Blockchain Bridge: http://172.29.54.144:9000
```

#### 3. Start Blockchain Bridge (Ubuntu/Linux Terminal)

```bash
# SSH to Ubuntu machine (if separate server)
ssh user@172.29.54.144

# Navigate to project
cd /path/to/graintrust-2.0

# Start bridge
node bridges/blockchain-bridge.js
```

Expected output:
```
╔══════════════════════════════════════════════════════════════╗
║        🔗 BLOCKCHAIN BRIDGE SERVER STARTED                   ║
╚══════════════════════════════════════════════════════════════╝

   🌐 Server: http://localhost:9000
   📍 Endpoints:
      - POST /generate-certificate
      - POST /record-image
   🔗 Blockchain: Hyperledger Fabric
```

#### 4. Start Next.js Development Server

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3005
- **API**: http://localhost:3005/api/*

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

### Additional Scripts

```bash
# Database operations
npm run migrate:dev        # Run Prisma migrations
npm run db:seed           # Seed database with demo data
npm run db:reset          # Reset database

# Utilities
npm run update-ncdex      # Fetch latest NCDEX prices
npm run migrate:images    # Migrate images to Supabase storage
npm run lint             # Run ESLint

# Testing
node scripts/test-image-blockchain-flow.js  # Test blockchain integration
```

---

## 📁 Project Structure

```
graintrust-2.0/
├── bridges/
│   ├── frontend-bridge.js          # Frontend ↔ Blockchain bridge
│   └── blockchain-bridge.js        # Blockchain ↔ Hyperledger bridge
├── database/
│   ├── supabase-setup.sql          # Main database schema
│   ├── supabase-batches-setup.sql  # Batch management tables
│   ├── ncdex-prices-setup.sql      # Market data tables
│   └── README.md                   # Database documentation
├── prisma/
│   ├── schema.prisma               # Prisma schema definition
│   └── seed.ts                     # Database seeding script
├── public/
│   ├── images/                     # Static images
│   └── test-upload.html            # Image upload testing
├── scripts/
│   ├── update-ncdex-prices.ts      # NCDEX price updater
│   ├── add-admin-supabase.ts       # Admin user creation
│   ├── test-image-blockchain-flow.js
│   └── ...                         # Various utility scripts
├── src/
│   ├── app/
│   │   ├── admin/                  # Admin dashboard pages
│   │   ├── api/                    # API routes
│   │   │   ├── auth/              # Authentication endpoints
│   │   │   ├── batches/           # Batch management
│   │   │   ├── blockchain/        # Blockchain integration
│   │   │   └── image-verification/
│   │   ├── market/                # Market data pages
│   │   ├── profile/               # User profile pages
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Main page
│   │   └── globals.css            # Global styles
│   ├── components/
│   │   ├── admin/                 # Admin components
│   │   ├── auth/                  # Authentication UI
│   │   ├── consumer/              # Consumer dashboard
│   │   ├── education/             # Education center
│   │   ├── farmer/                # Farmer dashboard
│   │   ├── home/                  # Landing page
│   │   ├── layout/                # Layout components
│   │   ├── manufacture/           # Manufacturer dashboard
│   │   ├── shared/                # Shared components
│   │   └── ui/                    # UI primitives
│   ├── context/
│   │   ├── auth-context.tsx       # Authentication state
│   │   └── language-context.tsx   # i18n state
│   ├── hooks/
│   │   ├── useImageUpload.ts      # Image upload logic
│   │   ├── useEducationDashboard.ts
│   │   └── ...                    # Custom hooks
│   ├── lib/
│   │   ├── auth.ts                # Auth utilities
│   │   ├── i18.ts                 # Internationalization
│   │   ├── utils.ts               # General utilities
│   │   └── supabase.ts            # Supabase client
│   └── types/
│       └── index.ts               # TypeScript type definitions
├── .env.local                     # Environment variables (create this)
├── .eslintrc.json                 # ESLint configuration
├── next.config.ts                 # Next.js configuration
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── BLOCKCHAIN_IMAGE_FLOW.md       # Blockchain integration docs
├── IMPLEMENTATION_SUMMARY.md      # Feature implementation summary
├── QUICK_START_BLOCKCHAIN.md      # Blockchain quick start
├── TESTING_GUIDE.md               # Testing documentation
└── README.md                      # This file
```

---

## 🎨 Core Features

### 1. Batch Creation & Management

**Farmer Workflow**:
1. Login to farmer dashboard
2. Click "Create New Batch"
3. Fill in batch details:
   - Crop name (e.g., Wheat, Rice)
   - Crop type (Grain, Vegetable, Fruit)
   - Variety (e.g., Durum Wheat)
   - Quantity and unit
   - Expected harvest date
   - Farm location
4. Submit batch → Status: "PENDING"

**Database**: Stored in `batches` table with unique UUID

---

### 2. Image Upload & AI Verification

**7-Stage Process**:
1. **Land Preparation**: Soil preparation, plowing
2. **Sowing**: Seed planting
3. **Growth**: Crop growing phase
4. **Maintenance**: Weeding, irrigation
5. **Harvesting**: Crop collection
6. **Processing**: Cleaning, sorting
7. **Storage**: Warehouse storage

**Upload Flow**:
1. Farmer uploads images for each stage
2. AI (Hugging Face) analyzes image authenticity
3. AI result: "REAL" or "FAKE" with confidence score
4. Admin reviews AI recommendation
5. Admin makes final decision (Verify/Reject)
6. Approved → Recorded to blockchain
7. Rejected → Farmer notified with reason

**Blockchain Integration**:
- **First image** in batch: Includes farmer + batch + image data
- **Subsequent images**: Incremental image data only
- Every verified image gets blockchain transaction ID

---

### 3. QR Certificate Generation

**Auto-Trigger Logic**:
```
IF all 7 stages have ≥2 verified images each:
    → Generate QR certificate
    → Store in blockchain
    → Update batch status to "COMPLETED"
```

**Certificate Contents**:
- Unique certificate ID
- QR code URL
- Batch details (crop, farmer, location)
- Complete timeline with images
- Verification details
- Blockchain transaction hashes

**Export Options**:
- Download as PDF
- Download as PNG
- Share via link

---

### 4. Consumer Verification

**QR Scanning**:
1. Consumer scans QR code on product
2. System fetches batch data from blockchain
3. Display complete supply chain journey:
   - Farmer details
   - All 7 stages with images
   - Verification timestamps
   - Blockchain transaction IDs
   - Admin verification details

**Verification Status**:
- ✅ **Verified**: All stages complete, blockchain-backed
- ⚠️ **In Progress**: Some stages pending
- ❌ **Invalid**: QR not found or data mismatch

---

### 5. Real-Time Market Data

**NCDEX Integration**:
- Daily price updates for 20+ commodities
- Wheat, Rice, Maize, Cotton, Turmeric, etc.
- Fetches from NCDEX bhavcopy (CSV files)
- Fallback web scraping if CSV unavailable

**Data Displayed**:
- Open, High, Low, Close prices
- Trading volume
- Previous day comparison
- Price trends (7/30/90 days)

**Update Script**:
```bash
npm run update-ncdex
```

Runs daily via cron job (recommended).

---

### 6. Fraud Detection & Appeals

**Fraud Reporting**:
- Consumers can report suspicious products
- Admin investigation workflow
- Batch flagging and suspension
- Farmer notification system

**Appeals System**:
- Farmers can appeal rejected images
- Submit additional evidence
- Admin review queue
- Resolution tracking

---

### 7. Multilingual Support

**Supported Languages**:
- 🇬🇧 English
- 🇮🇳 Hindi (हिंदी)
- 🇮🇳 Kannada (ಕನ್ನಡ)
- 🇧🇩 Bengali (বাংলা)
- 🇮🇳 Tamil (தமிழ்)

**Implementation**:
- i18next framework
- Auto-detection based on browser settings
- Manual language switcher in header
- RTL support for applicable languages

---

## 🔌 API Documentation

### Authentication

#### POST `/api/auth/signup`
Create a new user account.

**Request**:
```json
{
  "name": "John Farmer",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "FARMER",
  "phone": "+91-9876543210",
  "location": "Karnataka"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Farmer",
    "role": "FARMER"
  },
  "token": "jwt-token"
}
```

#### POST `/api/auth/signin`
Login to existing account.

---

### Batch Management

#### POST `/api/batches`
Create a new crop batch.

**Request**:
```json
{
  "cropName": "Wheat",
  "cropType": "Grain",
  "variety": "Durum",
  "quantity": 500,
  "unit": "kg",
  "farmLocation": "Village XYZ",
  "expectedHarvestDate": "2025-03-15"
}
```

#### GET `/api/batches`
Get all batches for authenticated user.

#### GET `/api/batches/[id]`
Get specific batch details.

---

### Image Verification

#### POST `/api/image-verification`
Admin verifies uploaded image.

**Request**:
```json
{
  "imageUrl": "https://storage.url/image.jpg",
  "verificationStatus": "REAL",
  "stageId": "stage-3",
  "batchId": "batch-uuid",
  "farmerId": "farmer-uuid",
  "verifiedBy": "admin-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "verification": { /* details */ },
  "blockchain": {
    "recorded": true,
    "transactionId": "TX-abc123",
    "blockNumber": 552145
  },
  "notificationCreated": true
}
```

---

### Blockchain Integration

#### POST `/api/blockchain/record-image`
Record verified image to blockchain.

#### POST `/api/blockchain/generate-qr`
Generate QR certificate when all stages complete.

**Request**:
```json
{
  "batchId": "batch-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "certificateId": "CERT-uuid-timestamp",
  "qrCode": "https://graintrust.com/verify/CERT-...",
  "blockchain": {
    "transactionId": "TX-xyz789",
    "blockNumber": 552200
  }
}
```

---

### Market Data

#### GET `/api/market/ncdex-prices`
Get latest NCDEX commodity prices.

**Response**:
```json
{
  "success": true,
  "prices": [
    {
      "commodityName": "Wheat",
      "openPrice": 2450.00,
      "closePrice": 2475.50,
      "highPrice": 2485.00,
      "lowPrice": 2440.00,
      "volume": 15420,
      "tradeDate": "2025-11-18"
    }
  ]
}
```

---

## 🗄️ Database Schema

### Core Tables

#### users
```sql
- id: UUID (PK)
- email: VARCHAR (UNIQUE)
- name: VARCHAR
- password: VARCHAR (hashed)
- role: ENUM (FARMER, MANUFACTURER, CONSUMER, ADMIN)
- phone: VARCHAR
- location: VARCHAR
- isVerified: BOOLEAN
- onboardingComplete: BOOLEAN
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

#### batches
```sql
- id: UUID (PK)
- farmerId: UUID (FK → users.id)
- cropName: VARCHAR
- cropType: VARCHAR
- variety: VARCHAR
- quantity: DECIMAL
- unit: VARCHAR
- status: ENUM (PENDING, IN_PROGRESS, COMPLETED, REJECTED)
- farmLocation: VARCHAR
- expectedHarvestDate: DATE
- certificate_id: VARCHAR
- qr_code: TEXT
- createdAt: TIMESTAMP
- updatedAt: TIMESTAMP
```

#### image_verifications
```sql
- id: UUID (PK)
- batchId: UUID (FK → batches.id)
- farmerId: UUID (FK → users.id)
- stageId: VARCHAR
- imageUrl: TEXT
- verificationStatus: ENUM (REAL, FAKE, PENDING)
- verifiedBy: UUID (FK → users.id)
- verifiedAt: TIMESTAMP
- rejectionReason: TEXT
- blockchainTxId: VARCHAR
- blockchainHash: VARCHAR
- blockchainRecordedAt: TIMESTAMP
- blockNumber: INTEGER
- isFirstImageInBatch: BOOLEAN
- createdAt: TIMESTAMP
```

#### ncdex_prices
```sql
- id: SERIAL (PK)
- commodityCode: VARCHAR
- commodityName: VARCHAR
- symbol: VARCHAR
- openPrice: DECIMAL
- highPrice: DECIMAL
- lowPrice: DECIMAL
- closePrice: DECIMAL
- volume: INTEGER
- tradeDate: DATE
- createdAt: TIMESTAMP
UNIQUE (commodityCode, symbol, tradeDate)
```

[See full schema in `prisma/schema.prisma`]

---

## ⛓️ Blockchain Integration

### Bridge Architecture

**Why Two Bridges?**
1. **Frontend Bridge** (Windows, localhost:8080):
   - Runs alongside Next.js app
   - Handles frontend requests
   - Forwards to Blockchain Bridge

2. **Blockchain Bridge** (Ubuntu, 172.29.54.144:9000):
   - Runs on server with Hyperledger Fabric
   - Connects to blockchain network
   - Executes smart contracts

**Communication Flow**:
```
Next.js API → Frontend Bridge → Blockchain Bridge → Hyperledger Fabric
```

### Smart Contracts (Chaincode)

#### RecordBatchWithImage
Records first image with complete batch context.

**Input**:
```json
{
  "batchId": "uuid",
  "farmerId": "uuid",
  "farmerDetails": { /* farmer info */ },
  "batchDetails": { /* crop info */ },
  "stageId": "stage-1",
  "imageUrl": "https://...",
  "timestamp": "ISO-8601"
}
```

#### RecordImage
Records subsequent images (incremental data).

**Input**:
```json
{
  "batchId": "uuid",
  "stageId": "stage-2",
  "imageUrl": "https://...",
  "verificationId": "uuid",
  "timestamp": "ISO-8601"
}
```

#### GenerateCertificate
Creates QR certificate when all stages complete.

**Output**:
```json
{
  "certificateId": "CERT-uuid",
  "batchId": "uuid",
  "qrCode": "https://...",
  "completionDate": "ISO-8601",
  "allStages": [ /* 7 stages with images */ ]
}
```

### Blockchain Data Structure

**Block Contents**:
- Transaction ID
- Timestamp
- Previous block hash
- Data payload (batch/image/certificate)
- Digital signature
- Block number

**Immutability**:
- Cryptographic hashing (SHA-256)
- Chain of blocks (each links to previous)
- Distributed consensus
- No single point of modification

---

## 🧪 Testing

### Manual Testing

1. **Create Test User**:
```bash
# Run seed script
npm run db:seed

# Demo credentials:
# Farmer: farmer@demo.com / farmer123
# Admin: admin@graintrust.com / admin123
# Consumer: consumer@demo.com / consumer123
```

2. **Test Image Upload Flow**:
```bash
# Start all servers
node bridges/frontend-bridge.js
node bridges/blockchain-bridge.js
npm run dev

# Navigate to http://localhost:3005
# Login as farmer
# Create batch
# Upload images (2+ per stage)
# Login as admin
# Verify images
# Check blockchain logs
```

3. **Test QR Generation**:
```bash
# After all 7 stages have 2+ images:
# System should auto-generate QR
# Check batches table for certificate_id
```

### Automated Testing

```bash
# Test blockchain integration
node scripts/test-image-blockchain-flow.js

# Test NCDEX price fetching
npm run update-ncdex

# Test database connection
node scripts/test-connection.ts
```

### Health Checks

```bash
# Frontend Bridge
curl http://localhost:8080/health

# Blockchain Bridge
curl http://172.29.54.144:9000/health

# Next.js API
curl http://localhost:3005/api/health
```

---

## 🚢 Deployment

### Frontend (Vercel - Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy automatically on push

### Backend (Bridge Servers)

**Frontend Bridge**:
```bash
# Install PM2
npm install -g pm2

# Start bridge with PM2
pm2 start bridges/frontend-bridge.js --name "graintrust-frontend-bridge"
pm2 save
pm2 startup
```

**Blockchain Bridge**:
```bash
# On Ubuntu server
pm2 start bridges/blockchain-bridge.js --name "graintrust-blockchain-bridge"
pm2 save
pm2 startup
```

### Database (Supabase)

- Already hosted if using Supabase
- For self-hosted PostgreSQL:
  - Use Docker or managed service (AWS RDS, etc.)
  - Configure backups
  - Set up replication

### Blockchain (Hyperledger Fabric)

- Deploy to cloud (AWS, Azure, IBM Cloud)
- Configure peer and orderer nodes
- Set up Certificate Authority (CA)
- Deploy chaincode
- Configure bridge connection

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Bridge Connection Refused

**Symptoms**: `ECONNREFUSED` errors in logs

**Solutions**:
- Check bridge servers are running
- Verify port numbers (8080, 9000)
- Check firewall settings
- Ensure correct IP addresses in .env

#### 2. Images Not Recording to Blockchain

**Check**:
```sql
SELECT 
  "stageId", 
  "blockchainTxId", 
  "blockNumber"
FROM image_verifications
WHERE "batchId" = 'your-batch-id'
ORDER BY "verifiedAt";
```

**Solutions**:
- Verify blockchain bridge is running
- Check frontend bridge logs
- Ensure .env variables are correct

#### 3. QR Not Auto-Generating

**Check**:
```sql
SELECT 
  "stageId",
  COUNT(*) as image_count
FROM image_verifications
WHERE "batchId" = 'your-batch-id'
  AND "verificationStatus" = 'REAL'
GROUP BY "stageId";
```

**Requirement**: All 7 stages must have ≥2 images

#### 4. NCDEX Prices Not Updating

**Solutions**:
```bash
# Manual run
npm run update-ncdex

# Check logs for errors
# Verify NCDEX website is accessible
# Try different date (yesterday's data)
```

#### 5. Supabase Storage Errors

**Solutions**:
- Check storage bucket exists
- Verify RLS policies are configured
- Ensure service role key has access
- Check file size limits

### Logs Location

- **Next.js**: Console output
- **Frontend Bridge**: Console or PM2 logs (`pm2 logs graintrust-frontend-bridge`)
- **Blockchain Bridge**: Console or PM2 logs
- **Database**: Supabase dashboard → Logs

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

### Testing

- Test new features thoroughly
- Update documentation
- Add test cases where applicable

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 📧 Contact & Support

- **Project Lead**: Kushal Raj G S
- **Email**: kushalraj@example.com
- **GitHub**: [yourusername/graintrust-2.0](https://github.com/yourusername/graintrust-2.0)
- **Issues**: [GitHub Issues](https://github.com/yourusername/graintrust-2.0/issues)

---

## 🙏 Acknowledgments

- **Hyperledger Fabric** for blockchain infrastructure
- **Supabase** for database and storage
- **Hugging Face** for AI/ML capabilities
- **NCDEX** for market data
- **Next.js** and **Vercel** for web framework
- **Open Source Community** for amazing tools and libraries

---

## 📚 Additional Documentation

- [BLOCKCHAIN_IMAGE_FLOW.md](BLOCKCHAIN_IMAGE_FLOW.md) - Detailed blockchain integration
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Feature implementation details
- [QUICK_START_BLOCKCHAIN.md](QUICK_START_BLOCKCHAIN.md) - Blockchain quick start guide
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Comprehensive testing documentation
- [database/README.md](database/README.md) - Database setup and schema

---

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Core platform with 4 user roles
- ✅ Blockchain integration (Hyperledger Fabric)
- ✅ AI-powered image verification
- ✅ QR certificate generation
- ✅ Multilingual support (5 languages)

### Phase 2 (Upcoming)
- [ ] Mobile app (React Native)
- [ ] IoT sensor integration
- [ ] Advanced analytics dashboard
- [ ] Machine learning for fraud pattern detection
- [ ] Integration with government databases

### Phase 3 (Future)
- [ ] Marketplace integration
- [ ] Smart contracts for payments
- [ ] Carbon footprint tracking
- [ ] Farmer financing module
- [ ] Export documentation automation

---

## 🌟 Why GrainTrust?

### For Farmers
- **Fair Pricing**: Direct market access
- **Brand Building**: Verified quality increases value
- **Reduced Fraud**: Protection from counterfeit products
- **Market Insights**: Real-time price data

### For Consumers
- **Safety**: Know exactly what you're buying
- **Trust**: Complete supply chain visibility
- **Quality**: Verified authentic products
- **Informed Choices**: Access to product history

### For Manufacturers
- **Brand Protection**: Combat counterfeiting
- **Compliance**: Automated documentation
- **Traceability**: Quick recall capabilities
- **Market Trust**: Build consumer confidence

### For the Industry
- **Transparency**: Reduces information asymmetry
- **Efficiency**: Streamlined supply chains
- **Sustainability**: Track environmental impact
- **Innovation**: Platform for agri-tech solutions

---

**Built with ❤️ for a transparent agricultural future**
