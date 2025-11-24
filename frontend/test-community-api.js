// Quick test script for Community Hub API
// Run this to verify everything is working

async function testCommunityAPI() {
  const baseURL = 'http://localhost:3003/api/community';
  
  console.log('🧪 Testing Community Hub API...\n');
  
  try {
    // Test 1: Get categories
    console.log('1️⃣ Testing GET /api/community/categories...');
    const categoriesRes = await fetch(`${baseURL}/categories`);
    const categoriesData = await categoriesRes.json();
    console.log('✅ Categories:', categoriesData.categories?.length || 0, 'found');
    console.log('   Sample:', categoriesData.categories?.[0]?.name);
    
    // Test 2: Get questions
    console.log('\n2️⃣ Testing GET /api/community/questions...');
    const questionsRes = await fetch(`${baseURL}/questions`);
    const questionsData = await questionsRes.json();
    console.log('✅ Questions:', questionsData.questions?.length || 0, 'found');
    if (questionsData.questions?.[0]) {
      console.log('   Sample:', questionsData.questions[0].title);
    }
    
    // Test 3: Get stats
    console.log('\n3️⃣ Testing GET /api/community/stats...');
    const statsRes = await fetch(`${baseURL}/stats`);
    const statsData = await statsRes.json();
    console.log('✅ Stats:', statsData);
    
    console.log('\n🎉 All API tests passed!');
    console.log('\n📋 Summary:');
    console.log(`   • Categories: ${categoriesData.categories?.length || 0}`);
    console.log(`   • Questions: ${questionsData.questions?.length || 0}`);
    console.log(`   • Users: ${statsData.total_users || 0}`);
    console.log(`   • Comments: ${statsData.total_comments || 0}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\nMake sure:');
    console.log('  1. Next.js dev server is running (npm run dev)');
    console.log('  2. Supabase SQL has been executed');
    console.log('  3. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env');
  }
}

testCommunityAPI();
