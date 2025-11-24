-- Create certificates table for storing QR code certificate data
CREATE TABLE IF NOT EXISTS certificates (
  id BIGSERIAL PRIMARY KEY,
  certificate_id TEXT UNIQUE NOT NULL,
  batch_id TEXT NOT NULL,
  certificate_hash TEXT NOT NULL,
  certificate_data JSONB NOT NULL,
  qr_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on certificate_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_id ON certificates(certificate_id);

-- Create index on batch_id for batch lookups
CREATE INDEX IF NOT EXISTS idx_certificates_batch_id ON certificates(batch_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Allow public read access for certificate verification
CREATE POLICY "Certificates are publicly readable" 
  ON certificates FOR SELECT 
  USING (true);

-- Allow authenticated users to insert certificates
CREATE POLICY "Authenticated users can insert certificates" 
  ON certificates FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE certificates IS 'Stores blockchain-verified grain batch certificates with QR codes';
