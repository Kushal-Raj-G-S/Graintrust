import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage for GrainTrust...')
  console.log(`📍 Supabase URL: ${supabaseUrl}`)
  
  try {
    // Step 1: Create the storage bucket
    console.log('\n📦 Creating storage bucket...')
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('graintrust-images', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 5242880, // 5MB
    })

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Storage bucket "graintrust-images" already exists!')
      } else {
        console.error('❌ Error creating bucket:', bucketError)
        throw bucketError
      }
    } else {
      console.log('✅ Storage bucket "graintrust-images" created successfully!')
    }

    // Step 2: Test listing buckets
    console.log('\n🧪 Testing bucket access...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      throw listError
    }

    const graintrustBucket = buckets.find(b => b.name === 'graintrust-images')
    if (graintrustBucket) {
      console.log('✅ Bucket found successfully!')
      console.log(`📋 Bucket info:`, {
        name: graintrustBucket.name,
        public: graintrustBucket.public,
        createdAt: graintrustBucket.created_at
      })
    } else {
      console.log('⚠️  Bucket not found in list')
    }

    // Step 3: Test upload functionality
    console.log('\n🧪 Testing upload functionality...')
    const testImageData = Buffer.from('test-image-data', 'utf8')
    const fileName = `test-${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('graintrust-images')
      .upload(fileName, testImageData, {
        contentType: 'text/plain'
      })

    if (uploadError) {
      console.error('❌ Error uploading test file:', uploadError)
    } else {
      console.log('✅ Test upload successful!')
      console.log(`📁 File path: ${uploadData.path}`)
      
      // Clean up test file
      const { error: deleteError } = await supabase.storage
        .from('graintrust-images')
        .remove([fileName])
      
      if (!deleteError) {
        console.log('🧹 Test file cleaned up successfully')
      }
    }

    // Step 4: Test public URL generation
    console.log('\n🔗 Testing public URL generation...')
    const { data: urlData } = supabase.storage
      .from('graintrust-images')
      .getPublicUrl('test-file.jpg')
    
    console.log('✅ Public URL format:', urlData.publicUrl)

    console.log('\n🎉 Supabase Storage setup complete!')
    console.log('\n📝 Next steps:')
    console.log('1. Go to your Supabase dashboard > Storage')
    console.log('2. Click on the "graintrust-images" bucket')
    console.log('3. Set up RLS policies if needed')
    console.log('4. Your app is ready to upload images!')

  } catch (error) {
    console.error('\n❌ Setup failed:', error)
    console.log('\n🔧 Manual setup instructions:')
    console.log('1. Go to https://supabase.com/dashboard')
    console.log('2. Select your project')
    console.log('3. Go to Storage > Create bucket')
    console.log('4. Name: graintrust-images')
    console.log('5. Make it public')
    console.log('6. Set file size limit to 5MB')
    console.log('7. Allow MIME types: image/jpeg, image/png, image/webp, image/gif')
  }
}

setupStorage()
