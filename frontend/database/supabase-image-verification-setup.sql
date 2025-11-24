-- Create image_verifications table for admin verification of farmer-uploaded images
-- This table stores which images have been verified as REAL or flagged as FAKE by admins

CREATE TABLE IF NOT EXISTS image_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "imageUrl" TEXT NOT NULL,
  "verificationStatus" TEXT NOT NULL CHECK ("verificationStatus" IN ('REAL', 'FAKE')),
  "rejectionReason" TEXT, -- Admin's reason when marking image as FAKE
  "verifiedBy" UUID NOT NULL,
  "verifiedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "stageId" TEXT NOT NULL,
  "batchId" UUID NOT NULL,
  "farmerId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key to users table for the admin who verified
  CONSTRAINT fk_verified_by FOREIGN KEY ("verifiedBy") REFERENCES users(id) ON DELETE CASCADE,
  
  -- Foreign key to batches table (assuming you have a batches table)
  -- CONSTRAINT fk_batch FOREIGN KEY ("batchId") REFERENCES batches(id) ON DELETE CASCADE,
  
  -- Foreign key to farmers (users table with role FARMER)
  CONSTRAINT fk_farmer FOREIGN KEY ("farmerId") REFERENCES users(id) ON DELETE CASCADE,
  
  -- Unique constraint: one verification per image URL + stage combination
  CONSTRAINT unique_image_stage UNIQUE ("imageUrl", "stageId")
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_image_verifications_batch_id ON image_verifications("batchId");
CREATE INDEX IF NOT EXISTS idx_image_verifications_stage_id ON image_verifications("stageId");
CREATE INDEX IF NOT EXISTS idx_image_verifications_farmer_id ON image_verifications("farmerId");
CREATE INDEX IF NOT EXISTS idx_image_verifications_verified_by ON image_verifications("verifiedBy");
CREATE INDEX IF NOT EXISTS idx_image_verifications_status ON image_verifications("verificationStatus");

-- Enable Row Level Security (RLS)
ALTER TABLE image_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow admins to insert/update/delete verification records
CREATE POLICY "Admins can manage image verifications" ON image_verifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
    )
  );

-- RLS Policy: Allow authenticated users to view verification records
CREATE POLICY "Authenticated users can view verifications" ON image_verifications
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Comments for documentation
COMMENT ON TABLE image_verifications IS 'Stores admin verification status for farmer-uploaded images';
COMMENT ON COLUMN image_verifications."imageUrl" IS 'Full URL of the image in Supabase Storage';
COMMENT ON COLUMN image_verifications."verificationStatus" IS 'REAL (authentic) or FAKE (fraudulent)';
COMMENT ON COLUMN image_verifications."rejectionReason" IS 'Admin explanation when marking image as FAKE (e.g., "Not from actual farm", "AI generated")';
COMMENT ON COLUMN image_verifications."verifiedBy" IS 'Admin user ID who verified the image';
COMMENT ON COLUMN image_verifications."stageId" IS 'Farming stage ID the image belongs to';
COMMENT ON COLUMN image_verifications."batchId" IS 'Batch ID the image belongs to';
COMMENT ON COLUMN image_verifications."farmerId" IS 'Farmer user ID who uploaded the image';
