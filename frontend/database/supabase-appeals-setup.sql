-- ============================================
-- IMAGE VERIFICATION APPEALS SYSTEM
-- Allow farmers to dispute admin's flagging decision
-- Run this in Supabase SQL Editor
-- ============================================

-- Create AppealStatus enum
CREATE TYPE "AppealStatus" AS ENUM (
  'PENDING',           -- Farmer filed appeal, waiting for admin review
  'UNDER_REVIEW',      -- Admin is reviewing the appeal
  'APPROVED',          -- Appeal approved, image marked as REAL
  'REJECTED',          -- Appeal rejected, image stays FAKE
  'WITHDRAWN'          -- Farmer withdrew the appeal
);

-- Create image_appeals table
CREATE TABLE IF NOT EXISTS image_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "verificationId" UUID NOT NULL,                  -- Link to image_verifications
  "imageUrl" TEXT NOT NULL,                        -- Image that was flagged
  "farmerId" TEXT NOT NULL,                        -- Farmer who filed appeal
  "appealReason" TEXT NOT NULL,                    -- Farmer's explanation why image is real
  "appealStatus" "AppealStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedBy" TEXT,                               -- Admin who reviewed the appeal
  "reviewedAt" TIMESTAMP WITH TIME ZONE,
  "adminResponse" TEXT,                            -- Admin's response to appeal
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_farmer FOREIGN KEY ("farmerId") REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviewer FOREIGN KEY ("reviewedBy") REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_appeals_verification_id ON image_appeals("verificationId");
CREATE INDEX idx_appeals_farmer_id ON image_appeals("farmerId");
CREATE INDEX idx_appeals_status ON image_appeals("appealStatus");
CREATE INDEX idx_appeals_created_at ON image_appeals("createdAt" DESC);

-- Enable RLS
ALTER TABLE image_appeals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Farmers can view their own appeals
CREATE POLICY "Farmers can view own appeals" ON image_appeals
  FOR SELECT
  USING ("farmerId" = auth.uid()::text);

-- Farmers can create appeals
CREATE POLICY "Farmers can create appeals" ON image_appeals
  FOR INSERT
  WITH CHECK ("farmerId" = auth.uid()::text);

-- Farmers can update their own pending appeals (withdraw)
CREATE POLICY "Farmers can update own pending appeals" ON image_appeals
  FOR UPDATE
  USING ("farmerId" = auth.uid()::text AND "appealStatus" = 'PENDING');

-- Admins can view all appeals
CREATE POLICY "Admins can view all appeals" ON image_appeals
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role = 'ADMIN'
    )
  );

-- Admins can update appeals (review them)
CREATE POLICY "Admins can update appeals" ON image_appeals
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role = 'ADMIN'
    )
  );

-- Trigger for auto-updating updatedAt
CREATE TRIGGER update_image_appeals_updated_at
    BEFORE UPDATE ON image_appeals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE image_appeals IS 'Stores farmer appeals when they dispute admin image flagging';
COMMENT ON COLUMN image_appeals."appealReason" IS 'Farmer explanation why the flagged image is actually real';
COMMENT ON COLUMN image_appeals."appealStatus" IS 'Status of appeal: PENDING, UNDER_REVIEW, APPROVED, REJECTED, WITHDRAWN';
COMMENT ON COLUMN image_appeals."adminResponse" IS 'Admin explanation for approving/rejecting the appeal';

-- Verify setup
SELECT 'SUCCESS! Image appeals table created!' as status;
SELECT COUNT(*) as total_appeals FROM image_appeals;
