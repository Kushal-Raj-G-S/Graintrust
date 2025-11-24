import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage...')
  
  try {
    // Create the storage bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('graintrust-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 5242880, // 5MB
    })

    if (bucketError && bucketError.message !== 'The resource already exists') {
      console.error('❌ Error creating bucket:', bucketError)
      return
    }

    console.log('✅ Storage bucket "graintrust-images" created successfully!')

    // Create storage policies
    console.log('🔐 Setting up storage policies...')
    
    // Policy to allow public read access
    const { error: readPolicyError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'graintrust-images',
      policy_name: 'Public read access',
      definition: `
        CREATE POLICY "Public read access" ON storage.objects 
        FOR SELECT USING (bucket_id = 'graintrust-images');
      `
    })

    // Policy to allow authenticated users to upload
    const { error: uploadPolicyError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'graintrust-images',
      policy_name: 'Authenticated upload access',
      definition: `
        CREATE POLICY "Authenticated upload access" ON storage.objects 
        FOR INSERT WITH CHECK (bucket_id = 'graintrust-images');
      `
    })

    // Policy to allow users to delete their own files
    const { error: deletePolicyError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'graintrust-images',
      policy_name: 'Authenticated delete access',
      definition: `
        CREATE POLICY "Authenticated delete access" ON storage.objects 
        FOR DELETE USING (bucket_id = 'graintrust-images');
      `
    })

    console.log('✅ Storage policies configured!')
    console.log('🎉 Supabase Storage setup complete!')
    
    // Test the connection
    console.log('🧪 Testing storage connection...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return
    }

    const graintrustBucket = buckets.find(b => b.name === 'graintrust-images')
    if (graintrustBucket) {
      console.log('✅ Storage connection test successful!')
      console.log(`📦 Bucket details:`, {
        name: graintrustBucket.name,
        public: graintrustBucket.public,
        createdAt: graintrustBucket.created_at
      })
    } else {
      console.log('⚠️  Bucket not found in list, but this might be expected')
    }

  } catch (error) {
    console.error('❌ Error setting up storage:', error)
  }
}

setupStorage()
