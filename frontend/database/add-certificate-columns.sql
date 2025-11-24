-- Add certificate columns to batches table for QR code support

ALTER TABLE batches 
ADD COLUMN IF NOT EXISTS certificate_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS qrCode TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_batches_certificate_id ON batches(certificate_id);

-- Update existing batches with certificate_id (use batch id as certificate id)
UPDATE batches 
SET certificate_id = id 
WHERE certificate_id IS NULL AND status = 'CERTIFIED';
