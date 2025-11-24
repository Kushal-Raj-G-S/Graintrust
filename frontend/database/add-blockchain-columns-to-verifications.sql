-- Add blockchain tracking columns to image_verifications table
-- These columns store the blockchain transaction details when verified images are recorded

ALTER TABLE image_verifications 
ADD COLUMN IF NOT EXISTS "blockchainTxId" TEXT,
ADD COLUMN IF NOT EXISTS "blockchainHash" TEXT,
ADD COLUMN IF NOT EXISTS "blockchainRecordedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "blockNumber" INTEGER,
ADD COLUMN IF NOT EXISTS "isFirstImageInBatch" BOOLEAN DEFAULT false;

-- Create index for blockchain transaction lookup
CREATE INDEX IF NOT EXISTS idx_image_verifications_blockchain_tx_id 
  ON image_verifications("blockchainTxId");

-- Comments for documentation
COMMENT ON COLUMN image_verifications."blockchainTxId" IS 'Blockchain transaction ID from Hyperledger Fabric';
COMMENT ON COLUMN image_verifications."blockchainHash" IS 'SHA256 hash of the blockchain transaction';
COMMENT ON COLUMN image_verifications."blockchainRecordedAt" IS 'Timestamp when image was recorded to blockchain';
COMMENT ON COLUMN image_verifications."blockNumber" IS 'Block number in Hyperledger Fabric ledger';
COMMENT ON COLUMN image_verifications."isFirstImageInBatch" IS 'True if this was the first image recorded for the batch (includes farmer+batch details)';
