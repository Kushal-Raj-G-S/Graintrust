-- Migration: Add rejectionReason column to image_verifications table
-- Run this in Supabase SQL Editor if table already exists

-- Add the rejectionReason column
ALTER TABLE image_verifications 
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN image_verifications."rejectionReason" IS 'Admin explanation when marking image as FAKE (e.g., "Not from actual farm", "AI generated", "Stock photo detected")';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'image_verifications'
AND column_name = 'rejectionReason';

SELECT 'Migration completed: rejectionReason column added!' as status;
