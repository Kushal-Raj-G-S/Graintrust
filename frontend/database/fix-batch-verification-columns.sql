-- Fix Batch Verification Columns
-- Ensures verifiedAt, verifiedBy, and verificationStatus columns exist

-- Add verificationStatus if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'batches' AND column_name = 'verificationStatus'
    ) THEN
        ALTER TABLE batches ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING';
    END IF;
END $$;

-- Add verifiedAt if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'batches' AND column_name = 'verifiedAt'
    ) THEN
        ALTER TABLE batches ADD COLUMN "verifiedAt" TIMESTAMP(3);
    END IF;
END $$;

-- Add verifiedBy if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'batches' AND column_name = 'verifiedBy'
    ) THEN
        ALTER TABLE batches ADD COLUMN "verifiedBy" TEXT;
    END IF;
END $$;

-- Update existing batches with default status if null
UPDATE batches 
SET "verificationStatus" = 'PENDING' 
WHERE "verificationStatus" IS NULL;

-- Create index on verificationStatus for faster queries
CREATE INDEX IF NOT EXISTS idx_batches_verification_status 
ON batches("verificationStatus", "createdAt" DESC);

-- Verify columns exist
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'batches'
  AND column_name IN ('verificationStatus', 'verifiedAt', 'verifiedBy')
ORDER BY column_name;
