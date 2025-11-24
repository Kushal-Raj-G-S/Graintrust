/**
 * TEST SCRIPT: AI Validation Agent
 * Run this to test the AI validation system
 * 
 * Usage: node scripts/test-ai-validation.js
 */

const fs = require('fs');
const path = require('path');

async function testAIValidation() {
  console.log('🧪 Testing AI Validation System...\n');

  // You need to provide a test image
  const testImagePath = path.join(__dirname, '../public/test-image.jpg');
  
  if (!fs.existsSync(testImagePath)) {
    console.error('❌ Test image not found!');
    console.log('📝 Please add a test image at: public/test-image.jpg');
    console.log('   You can use any JPEG/PNG image from a farm\n');
    return;
  }

  const imageBuffer = fs.readFileSync(testImagePath);
  const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });
  const imageFile = new File([imageBlob], 'test-image.jpg', { type: 'image/jpeg' });

  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('batchId', 'test-batch-001');
  formData.append('stageId', 'test-stage-001');
  formData.append('farmerId', 'test-farmer-001');
  formData.append('imageUrl', 'https://test.com/test-image.jpg');

  console.log('📤 Uploading test image to AI validation endpoint...');
  console.log('   Image size:', imageBuffer.length, 'bytes');
  console.log('   Endpoint: http://localhost:3005/api/ai/validate-image\n');

  try {
    const response = await fetch('http://localhost:3005/api/ai/validate-image', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    console.log('✅ Response received!\n');
    console.log('📊 AI Validation Result:');
    console.log('   Status:', result.status);
    console.log('   AI Action:', result.aiAction);
    console.log('   Reason:', result.aiReason);
    
    if (result.validation) {
      console.log('\n📈 Detailed Scores:');
      console.log('   Deepfake Score:', (result.validation.deepfakeScore * 100).toFixed(2) + '%');
      console.log('   Visual Quality:', result.validation.visualSenseScore + '/100');
      console.log('   Format Valid:', result.validation.formatValid ? '✅' : '❌');
      console.log('   Integrity Valid:', result.validation.integrityValid ? '✅' : '❌');
      console.log('   Image Hash:', result.validation.imageHash.substring(0, 16) + '...');
      
      if (result.validation.detectedIssues && result.validation.detectedIssues.length > 0) {
        console.log('\n⚠️ Detected Issues:');
        result.validation.detectedIssues.forEach(issue => {
          console.log('   -', issue);
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    
    if (result.status === 'verified') {
      console.log('✅ IMAGE AUTO-APPROVED!');
      console.log('   This image passed all AI checks and is ready for blockchain.');
    } else if (result.status === 'rejected') {
      console.log('❌ IMAGE AUTO-REJECTED!');
      console.log('   Farmer will be notified to re-upload.');
    } else if (result.status === 'pending_review') {
      console.log('⏳ IMAGE FLAGGED FOR HUMAN REVIEW!');
      console.log('   An expert will review this image.');
    }

    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Server is running (npm run dev)');
    console.log('   2. Database tables are created');
    console.log('   3. HUGGINGFACE_API_TOKEN is set in .env');
  }
}

// Run test
testAIValidation();
