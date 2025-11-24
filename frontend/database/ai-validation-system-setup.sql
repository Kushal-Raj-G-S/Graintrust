-- ============================================
-- AI VALIDATION SYSTEM - COMPLETE SETUP
-- 4-Table Architecture for Image Validation
-- Run this in Supabase SQL Editor
-- ============================================

-- =============================================
-- TABLE 1: RAW UPLOADS (Audit Log - Every Image)
-- =============================================
CREATE TABLE IF NOT EXISTS raw_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "batchId" VARCHAR NOT NULL,
  "stageId" VARCHAR,
  "farmerId" VARCHAR NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "imageHash" VARCHAR UNIQUE NOT NULL,
  "fileSize" INT,
  "uploadedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_raw_batch FOREIGN KEY ("batchId") REFERENCES batches(id) ON DELETE CASCADE,
  CONSTRAINT fk_raw_farmer FOREIGN KEY ("farmerId") REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for raw_uploads
CREATE INDEX IF NOT EXISTS idx_raw_uploads_batch ON raw_uploads("batchId");
CREATE INDEX IF NOT EXISTS idx_raw_uploads_farmer ON raw_uploads("farmerId");
CREATE INDEX IF NOT EXISTS idx_raw_uploads_hash ON raw_uploads("imageHash");
CREATE INDEX IF NOT EXISTS idx_raw_uploads_uploaded ON raw_uploads("uploadedAt" DESC);

-- =============================================
-- TABLE 2: AI VALIDATIONS (AI Assessment Results)
-- =============================================

-- Create AIAction enum
DO $$ BEGIN
  CREATE TYPE "AIAction" AS ENUM (
    'AUTO_APPROVE',
    'AUTO_REJECT',
    'FLAG_FOR_HUMAN'
  );
EXCEPTION
  WHEN duplicate_object THEN 
    RAISE NOTICE 'AIAction enum already exists, skipping...';
END $$;

CREATE TABLE IF NOT EXISTS ai_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "rawUploadId" UUID NOT NULL,
  "batchId" VARCHAR NOT NULL,
  "stageId" VARCHAR,
  "imageUrl" TEXT NOT NULL,
  "imageHash" VARCHAR NOT NULL,
  
  -- Validation Results
  "formatValid" BOOLEAN DEFAULT true,
  "integrityValid" BOOLEAN DEFAULT true,
  "deepfakeScore" FLOAT DEFAULT 0.0,          -- 0.0 to 1.0 (0 = real, 1 = fake)
  "visualSenseScore" INT DEFAULT 0,           -- 0 to 100
  
  -- AI Decision
  "aiAction" "AIAction" NOT NULL,
  "aiReason" TEXT,
  "aiRequiresHumanReview" BOOLEAN DEFAULT false,
  
  -- Metadata
  "aiModel" VARCHAR DEFAULT 'HuggingFace-DeepFake-Detector-v2',
  "validatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key
  CONSTRAINT fk_ai_raw_upload FOREIGN KEY ("rawUploadId") REFERENCES raw_uploads(id) ON DELETE CASCADE
);

-- Indexes for ai_validations
CREATE INDEX IF NOT EXISTS idx_ai_validations_raw_upload ON ai_validations("rawUploadId");
CREATE INDEX IF NOT EXISTS idx_ai_validations_batch ON ai_validations("batchId");
CREATE INDEX IF NOT EXISTS idx_ai_validations_action ON ai_validations("aiAction");
CREATE INDEX IF NOT EXISTS idx_ai_validations_human_review ON ai_validations("aiRequiresHumanReview") WHERE "aiRequiresHumanReview" = true;
CREATE INDEX IF NOT EXISTS idx_ai_validations_deepfake ON ai_validations("deepfakeScore" DESC);

-- =============================================
-- TABLE 3: EXPERT REVIEWS (Human Expert Decisions)
-- =============================================

-- Create ExpertDecision enum
DO $$ BEGIN
  CREATE TYPE "ExpertDecision" AS ENUM (
    'APPROVED',
    'REJECTED',
    'PENDING'
  );
EXCEPTION
  WHEN duplicate_object THEN 
    RAISE NOTICE 'ExpertDecision enum already exists, skipping...';
END $$;

CREATE TABLE IF NOT EXISTS expert_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "aiValidationId" UUID NOT NULL,
  "batchId" VARCHAR NOT NULL,
  "stageId" VARCHAR,
  "imageUrl" TEXT NOT NULL,
  
  -- Expert Info
  "expertId" VARCHAR NOT NULL,
  "decision" "ExpertDecision" DEFAULT 'PENDING',
  "comments" TEXT,
  "rejectionReason" TEXT,
  
  -- Timestamps
  "assignedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "reviewedAt" TIMESTAMP WITH TIME ZONE,
  
  -- Foreign keys
  CONSTRAINT fk_expert_ai_validation FOREIGN KEY ("aiValidationId") REFERENCES ai_validations(id) ON DELETE CASCADE,
  CONSTRAINT fk_expert_user FOREIGN KEY ("expertId") REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for expert_reviews
CREATE INDEX IF NOT EXISTS idx_expert_reviews_ai_validation ON expert_reviews("aiValidationId");
CREATE INDEX IF NOT EXISTS idx_expert_reviews_batch ON expert_reviews("batchId");
CREATE INDEX IF NOT EXISTS idx_expert_reviews_expert ON expert_reviews("expertId");
CREATE INDEX IF NOT EXISTS idx_expert_reviews_decision ON expert_reviews("decision");
CREATE INDEX IF NOT EXISTS idx_expert_reviews_pending ON expert_reviews("decision") WHERE "decision" = 'PENDING';

-- =============================================
-- TABLE 4: VERIFIED STAGES (Blockchain-Ready Records)
-- =============================================

-- Create VerificationMethod enum
DO $$ BEGIN
  CREATE TYPE "VerificationMethod" AS ENUM (
    'AUTO_APPROVE',
    'EXPERT_APPROVED'
  );
EXCEPTION
  WHEN duplicate_object THEN 
    RAISE NOTICE 'VerificationMethod enum already exists, skipping...';
END $$;

CREATE TABLE IF NOT EXISTS verified_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "batchId" VARCHAR NOT NULL,
  "stageId" VARCHAR NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "imageHash" VARCHAR NOT NULL,
  
  -- Approval Chain (Audit Trail)
  "aiValidationId" UUID NOT NULL,
  "expertReviewId" UUID,                      -- NULL if auto-approved
  
  -- Blockchain Info (filled later)
  "blockchainTxId" VARCHAR,
  "blockchainRecordedAt" TIMESTAMP WITH TIME ZONE,
  
  -- Verification Method
  "verifiedMethod" "VerificationMethod" NOT NULL,
  "verifiedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign keys
  CONSTRAINT fk_verified_ai_validation FOREIGN KEY ("aiValidationId") REFERENCES ai_validations(id) ON DELETE RESTRICT,
  CONSTRAINT fk_verified_expert_review FOREIGN KEY ("expertReviewId") REFERENCES expert_reviews(id) ON DELETE RESTRICT,
  CONSTRAINT fk_verified_batch FOREIGN KEY ("batchId") REFERENCES batches(id) ON DELETE CASCADE
);

-- Indexes for verified_stages
CREATE INDEX IF NOT EXISTS idx_verified_stages_batch ON verified_stages("batchId");
CREATE INDEX IF NOT EXISTS idx_verified_stages_stage ON verified_stages("stageId");
CREATE INDEX IF NOT EXISTS idx_verified_stages_hash ON verified_stages("imageHash");
CREATE INDEX IF NOT EXISTS idx_verified_stages_method ON verified_stages("verifiedMethod");
CREATE INDEX IF NOT EXISTS idx_verified_stages_blockchain ON verified_stages("blockchainTxId") WHERE "blockchainTxId" IS NOT NULL;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE raw_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE verified_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Service role can do everything
CREATE POLICY "Service role can do everything on raw_uploads" ON raw_uploads
  FOR ALL USING (true);

CREATE POLICY "Service role can do everything on ai_validations" ON ai_validations
  FOR ALL USING (true);

CREATE POLICY "Service role can do everything on expert_reviews" ON expert_reviews
  FOR ALL USING (true);

CREATE POLICY "Service role can do everything on verified_stages" ON verified_stages
  FOR ALL USING (true);

-- RLS Policy: Farmers can view their own uploads
CREATE POLICY "Farmers can view own raw uploads" ON raw_uploads
  FOR SELECT
  USING (auth.uid() IS NULL OR "farmerId" = auth.uid()::text);

-- RLS Policy: Admins can view all
CREATE POLICY "Admins can view all ai_validations" ON ai_validations
  FOR SELECT
  USING (
    auth.uid() IS NULL OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()::text
      AND users.role = 'ADMIN'
    )
  );

-- =============================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- =============================================

CREATE OR REPLACE FUNCTION update_reviewed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.decision != OLD.decision AND NEW.decision != 'PENDING' THEN
    NEW."reviewedAt" = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reviewed_at ON expert_reviews;
CREATE TRIGGER trigger_update_reviewed_at
  BEFORE UPDATE ON expert_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviewed_at();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE raw_uploads IS 'Audit log of every image upload (never deleted)';
COMMENT ON TABLE ai_validations IS 'AI assessment results for each uploaded image';
COMMENT ON TABLE expert_reviews IS 'Human expert review decisions for flagged images';
COMMENT ON TABLE verified_stages IS 'Only blockchain-ready verified records';

COMMENT ON COLUMN ai_validations."deepfakeScore" IS 'AI deepfake detection score: 0.0 = real, 1.0 = fake';
COMMENT ON COLUMN ai_validations."aiAction" IS 'AUTO_APPROVE, AUTO_REJECT, or FLAG_FOR_HUMAN';
COMMENT ON COLUMN verified_stages."verifiedMethod" IS 'AUTO_APPROVE (by AI) or EXPERT_APPROVED (by human)';

-- =============================================
-- VERIFICATION & SUCCESS MESSAGE
-- =============================================

SELECT 'SUCCESS! AI Validation System tables created!' as status;

-- Show all tables
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('raw_uploads', 'ai_validations', 'expert_reviews', 'verified_stages')
ORDER BY table_name;

-- Show enums
SELECT 
  typname as enum_name,
  array_agg(enumlabel ORDER BY enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname IN ('AIAction', 'ExpertDecision', 'VerificationMethod')
GROUP BY typname;
