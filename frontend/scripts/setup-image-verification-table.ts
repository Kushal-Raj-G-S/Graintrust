import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupImageVerificationTable() {
  console.log('🔧 Setting up image_verifications table...\n');

  const createTableSQL = `
-- Create image_verifications table
CREATE TABLE IF NOT EXISTS image_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "imageUrl" TEXT NOT NULL,
  "verificationStatus" TEXT NOT NULL CHECK ("verificationStatus" IN ('REAL', 'FAKE')),
  "verifiedBy" UUID NOT NULL,
  "verifiedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "stageId" TEXT NOT NULL,
  "batchId" UUID NOT NULL,
  "farmerId" UUID NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_image_stage UNIQUE ("imageUrl", "stageId")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_image_verifications_batch_id ON image_verifications("batchId");
CREATE INDEX IF NOT EXISTS idx_image_verifications_stage_id ON image_verifications("stageId");
CREATE INDEX IF NOT EXISTS idx_image_verifications_farmer_id ON image_verifications("farmerId");

-- Enable RLS
ALTER TABLE image_verifications ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
DROP POLICY IF EXISTS "Anyone can view verifications" ON image_verifications;
CREATE POLICY "Anyone can view verifications" ON image_verifications
  FOR SELECT
  USING (true);

-- Allow service role to manage (for API calls)
DROP POLICY IF EXISTS "Service role can manage verifications" ON image_verifications;
CREATE POLICY "Service role can manage verifications" ON image_verifications
  FOR ALL
  USING (true);
`;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Error creating table:', error);
      console.log('\n📋 Please run this SQL manually in Supabase Dashboard → SQL Editor:\n');
      console.log(createTableSQL);
      process.exit(1);
    }

    console.log('✅ Table created successfully!');
    console.log('\n📊 Testing table access...');

    // Test if we can query the table
    const { data: testData, error: testError } = await supabase
      .from('image_verifications')
      .select('count');

    if (testError) {
      console.error('❌ Error accessing table:', testError);
    } else {
      console.log('✅ Table is accessible!');
    }

    console.log('\n🎉 Setup complete! You can now use the image verification feature.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n📋 Please run the SQL manually in Supabase Dashboard → SQL Editor');
    console.log('File: supabase-image-verification-setup.sql');
  }
}

setupImageVerificationTable();
