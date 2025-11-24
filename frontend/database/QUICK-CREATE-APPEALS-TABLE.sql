-- ============================================
-- QUICK SETUP: IMAGE APPEALS TABLE
-- Copy and paste this into Supabase SQL Editor
-- ============================================

-- Step 1: Create AppealStatus enum (if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE "AppealStatus" AS ENUM (
    'PENDING',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'WITHDRAWN'
  );
EXCEPTION
  WHEN duplicate_object THEN 
    RAISE NOTICE 'AppealStatus enum already exists, skipping...';
END $$;

-- Step 2: Create image_appeals table
CREATE TABLE IF NOT EXISTS image_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "verificationId" UUID NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "farmerId" TEXT NOT NULL,
  "appealReason" TEXT NOT NULL,
  "appealStatus" "AppealStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP WITH TIME ZONE,
  "adminResponse" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_appeals_verification_id ON image_appeals("verificationId");
CREATE INDEX IF NOT EXISTS idx_appeals_farmer_id ON image_appeals("farmerId");
CREATE INDEX IF NOT EXISTS idx_appeals_status ON image_appeals("appealStatus");
CREATE INDEX IF NOT EXISTS idx_appeals_created_at ON image_appeals("createdAt" DESC);

-- Step 4: Enable Row Level Security
ALTER TABLE image_appeals ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Service role can do everything" ON image_appeals;
DROP POLICY IF EXISTS "Farmers can view own appeals" ON image_appeals;
DROP POLICY IF EXISTS "Farmers can create appeals" ON image_appeals;
DROP POLICY IF EXISTS "Admins can view all appeals" ON image_appeals;
DROP POLICY IF EXISTS "Admins can update appeals" ON image_appeals;

-- Step 6: Create RLS policies
-- Allow service role (backend) to do everything
CREATE POLICY "Service role can do everything" ON image_appeals
  FOR ALL
  USING (true);

-- Farmers can view their own appeals (if using auth)
CREATE POLICY "Farmers can view own appeals" ON image_appeals
  FOR SELECT
  USING (
    auth.uid() IS NULL OR  -- Allow when no auth
    "farmerId" = auth.uid()::text
  );

-- Farmers can create appeals (if using auth)
CREATE POLICY "Farmers can create appeals" ON image_appeals
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL OR  -- Allow when no auth
    "farmerId" = auth.uid()::text
  );

-- Admins can view all appeals
CREATE POLICY "Admins can view all appeals" ON image_appeals
  FOR SELECT
  USING (
    auth.uid() IS NULL OR  -- Allow when no auth
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role = 'ADMIN'
    )
  );

-- Admins can update appeals
CREATE POLICY "Admins can update appeals" ON image_appeals
  FOR UPDATE
  USING (
    auth.uid() IS NULL OR  -- Allow when no auth
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role = 'ADMIN'
    )
  );

-- Step 7: Create update trigger for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_image_appeals_updated_at ON image_appeals;
CREATE TRIGGER update_image_appeals_updated_at
    BEFORE UPDATE ON image_appeals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Verify setup
SELECT 'SUCCESS! Image appeals table is ready!' as status;
SELECT COUNT(*) as total_appeals FROM image_appeals;

-- Display table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'image_appeals'
ORDER BY ordinal_position;
