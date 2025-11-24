-- ============================================
-- GRAINTRUST BATCHES & STAGES SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create BatchStatus enum
CREATE TYPE "BatchStatus" AS ENUM ('ACTIVE', 'HARVESTED', 'SOLD', 'PROCESSING');

-- Step 2: Create StageStatus enum
CREATE TYPE "StageStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED', 'REJECTED');

-- Step 3: Create batches table
CREATE TABLE "batches" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "batchCode" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "sowingDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "status" "BatchStatus" NOT NULL DEFAULT 'ACTIVE',
    "qrCode" TEXT,
    "location" JSONB,
    "farmerId" TEXT NOT NULL,
    "timeline" JSONB[] DEFAULT '{}',
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "imageUrls" TEXT[] DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "batches_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Step 4: Create stages table
CREATE TABLE "stages" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "status" "StageStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "imageUrls" TEXT[] DEFAULT '{}',
    "batchId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stages_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stages_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Step 5: Create indexes for faster lookups
CREATE INDEX "batches_farmerId_idx" ON "batches"("farmerId");
CREATE INDEX "batches_batchCode_idx" ON "batches"("batchCode");
CREATE INDEX "stages_batchId_idx" ON "stages"("batchId");
CREATE INDEX "stages_farmerId_idx" ON "stages"("farmerId");

-- Step 6: Create trigger for auto-updating updatedAt in batches
CREATE TRIGGER update_batches_updated_at
    BEFORE UPDATE ON "batches"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Create trigger for auto-updating updatedAt in stages
CREATE TRIGGER update_stages_updated_at
    BEFORE UPDATE ON "stages"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Verify setup
SELECT 'SUCCESS! Batches and Stages tables created!' as status;
SELECT COUNT(*) as total_batches FROM "batches";
SELECT COUNT(*) as total_stages FROM "stages";
