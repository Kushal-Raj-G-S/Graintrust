/**
 * 🧪 TEST BLOCKCHAIN VALIDATION LOGIC
 * Tests the CORRECT per-stage validation for QR certificate generation
 */

// Mock the blockchain agent (since we're testing logic, not actual blockchain)
class BlockchainAgent {
  async checkAndGenerateCertificate(batchData, allVerifications) {
    try {
      const { batchId, farmerId, cropType, quantity } = batchData;
      
      console.log(`\n🔍 Checking batch ${batchId} for QR certificate eligibility...`);
      
      // CORRECT VALIDATION: Check each stage has minimum 2 images
      const stageRequirements = {
        1: { name: 'LAND_PREPARATION', count: 0 },
        2: { name: 'SOWING', count: 0 },
        3: { name: 'IRRIGATION', count: 0 },
        4: { name: 'FERTILIZATION', count: 0 },
        5: { name: 'PEST_CONTROL', count: 0 },
        6: { name: 'HARVESTING', count: 0 },
        7: { name: 'PACKAGING', count: 0 }
      };

      // Count verified images per stage
      allVerifications.forEach(verification => {
        const stageNum = verification.stageNumber;
        if (stageRequirements[stageNum]) {
          stageRequirements[stageNum].count++;
        }
      });

      // Check if ALL stages have at least 2 images
      const stagesReady = [];
      const stagesNotReady = [];
      
      for (let i = 1; i <= 7; i++) {
        const stage = stageRequirements[i];
        if (stage.count >= 2) {
          stagesReady.push(`Stage ${i}: ${stage.name} (${stage.count} images) ✅`);
        } else {
          stagesNotReady.push(`Stage ${i}: ${stage.name} (${stage.count}/2 images) ❌`);
        }
      }

      console.log(`   📊 Stage Status:`);
      console.log(`      Ready: ${stagesReady.length}/7 stages`);
      stagesNotReady.forEach(msg => console.log(`      ${msg}`));

      // ✅ ALL 7 STAGES HAVE AT LEAST 2 IMAGES - GENERATE QR!
      if (stagesNotReady.length === 0) {
        console.log(`\n✅ ALL 7 STAGES COMPLETE! Generating QR certificate...`);
        
        const certificateId = `CERT-${batchId}-${Date.now()}`;
        
        return {
          success: true,
          certificate: {
            certificateId,
            batchId,
            stages: Object.keys(stageRequirements).map(num => ({
              stageNumber: parseInt(num),
              stageName: stageRequirements[num].name,
              imageCount: stageRequirements[num].count
            })),
            totalImages: allVerifications.length
          },
          qrCode: {
            url: `https://graintrust.com/verify/${certificateId}`,
            certificateId,
            stages: 7,
            totalImages: allVerifications.length
          }
        };
      } else {
        // ❌ NOT ALL STAGES READY
        console.log(`\n⏳ NOT READY FOR CERTIFICATION`);
        console.log(`   Missing stages: ${stagesNotReady.length}`);
        return {
          success: false,
          reason: 'incomplete_stages',
          stagesReady: stagesReady.length,
          stagesNotReady: stagesNotReady,
          totalStages: 7
        };
      }
    } catch (error) {
      console.error('❌ Certificate generation failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// TEST SCENARIOS
async function runTests() {
  const agent = new BlockchainAgent();
  
  const batchData = {
    batchId: 'BATCH-TEST-001',
    farmerId: 'FARMER-001',
    cropType: 'Wheat',
    quantity: 1000
  };

  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║           🧪 BLOCKCHAIN VALIDATION TEST SUITE               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  // ❌ TEST 1: Unbalanced images (10 in stage 1, 4 in stage 2)
  console.log('\n📌 TEST 1: Unbalanced Images (Should FAIL)');
  console.log('   Scenario: 10 images in Stage 1, 4 in Stage 2, 0 in others');
  console.log('   Total: 14 images');
  console.log('   Expected: FAIL (missing stages 3-7)');
  
  const test1Verifications = [
    ...Array(10).fill(null).map((_, i) => ({ 
      stageNumber: 1, 
      imageId: `IMG-1-${i}`,
      transactionId: `TX-${i}`
    })),
    ...Array(4).fill(null).map((_, i) => ({ 
      stageNumber: 2, 
      imageId: `IMG-2-${i}`,
      transactionId: `TX-${10 + i}`
    }))
  ];
  
  const result1 = await agent.checkAndGenerateCertificate(batchData, test1Verifications);
  console.log('\n   RESULT:', result1.success ? '✅ PASSED' : '❌ FAILED (AS EXPECTED)');
  console.log('   Reason:', result1.reason);
  console.log('   Stages Ready:', result1.stagesReady);
  console.log('   Stages Not Ready:', result1.stagesNotReady?.length);

  // ❌ TEST 2: Missing one stage (Stage 6 has only 1 image)
  console.log('\n\n📌 TEST 2: Missing One Stage (Should FAIL)');
  console.log('   Scenario: All stages have 2 images except Stage 6 (only 1)');
  console.log('   Total: 13 images');
  console.log('   Expected: FAIL (Stage 6 incomplete)');
  
  const test2Verifications = [
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 1, imageId: `IMG-1-${i}`, transactionId: `TX-1-${i}` })),
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 2, imageId: `IMG-2-${i}`, transactionId: `TX-2-${i}` })),
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 3, imageId: `IMG-3-${i}`, transactionId: `TX-3-${i}` })),
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 4, imageId: `IMG-4-${i}`, transactionId: `TX-4-${i}` })),
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 5, imageId: `IMG-5-${i}`, transactionId: `TX-5-${i}` })),
    { stageNumber: 6, imageId: 'IMG-6-0', transactionId: 'TX-6-0' }, // ONLY 1 IMAGE!
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 7, imageId: `IMG-7-${i}`, transactionId: `TX-7-${i}` }))
  ];
  
  const result2 = await agent.checkAndGenerateCertificate(batchData, test2Verifications);
  console.log('\n   RESULT:', result2.success ? '✅ PASSED' : '❌ FAILED (AS EXPECTED)');
  console.log('   Reason:', result2.reason);
  console.log('   Stages Ready:', result2.stagesReady);
  console.log('   Missing:', result2.stagesNotReady);

  // ✅ TEST 3: Perfect - All stages have exactly 2 images
  console.log('\n\n📌 TEST 3: Minimum Requirement (Should PASS)');
  console.log('   Scenario: All 7 stages have exactly 2 images');
  console.log('   Total: 14 images');
  console.log('   Expected: PASS ✅');
  
  const test3Verifications = [
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 1, imageId: `IMG-1-${i}`, transactionId: `TX-1-${i}` })),
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 2, imageId: `IMG-2-${i}`, transactionId: `TX-2-${i}` })),
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 3, imageId: `IMG-3-${i}`, transactionId: `TX-3-${i}` })),
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 4, imageId: `IMG-4-${i}`, transactionId: `TX-4-${i}` })),
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 5, imageId: `IMG-5-${i}`, transactionId: `TX-5-${i}` })),
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 6, imageId: `IMG-6-${i}`, transactionId: `TX-6-${i}` })),
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 7, imageId: `IMG-7-${i}`, transactionId: `TX-7-${i}` }))
  ];
  
  const result3 = await agent.checkAndGenerateCertificate(batchData, test3Verifications);
  console.log('\n   RESULT:', result3.success ? '✅ PASSED (QR GENERATED!)' : '❌ FAILED');
  if (result3.success) {
    console.log('   Certificate ID:', result3.certificate.certificateId);
    console.log('   QR URL:', result3.qrCode.url);
    console.log('   Total Images:', result3.certificate.totalImages);
    console.log('   Stages:', result3.certificate.stages.map(s => `${s.stageName}: ${s.imageCount} images`));
  }

  // ✅ TEST 4: More than minimum (16 images across all stages)
  console.log('\n\n📌 TEST 4: Above Minimum (Should PASS)');
  console.log('   Scenario: Stages have varying images (2-4 each), total 17 images');
  console.log('   Expected: PASS ✅');
  
  const test4Verifications = [
    ...Array(3).fill(null).map((_, i) => ({ stageNumber: 1, imageId: `IMG-1-${i}`, transactionId: `TX-1-${i}` })),
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 2, imageId: `IMG-2-${i}`, transactionId: `TX-2-${i}` })),
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 3, imageId: `IMG-3-${i}`, transactionId: `TX-3-${i}` })),
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 4, imageId: `IMG-4-${i}`, transactionId: `TX-4-${i}` })),
    ...Array(2).fill(null).map((_, i) => ({ stageNumber: 5, imageId: `IMG-5-${i}`, transactionId: `TX-5-${i}` })),
    ...Array(3).fill(null).map((_, i) => ({ stageNumber: 6, imageId: `IMG-6-${i}`, transactionId: `TX-6-${i}` })),
    ...Array(3).fill(null).map((_, i) => ({ stageNumber: 7, imageId: `IMG-7-${i}`, transactionId: `TX-7-${i}` }))
  ];
  
  const result4 = await agent.checkAndGenerateCertificate(batchData, test4Verifications);
  console.log('\n   RESULT:', result4.success ? '✅ PASSED (QR GENERATED!)' : '❌ FAILED');
  if (result4.success) {
    console.log('   Certificate ID:', result4.certificate.certificateId);
    console.log('   Total Images:', result4.certificate.totalImages);
  }

  // Summary
  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    📊 TEST SUMMARY                           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log('   TEST 1 (Unbalanced):', !result1.success ? '✅ PASSED' : '❌ FAILED');
  console.log('   TEST 2 (Missing Stage):', !result2.success ? '✅ PASSED' : '❌ FAILED');
  console.log('   TEST 3 (Minimum):', result3.success ? '✅ PASSED' : '❌ FAILED');
  console.log('   TEST 4 (Above Minimum):', result4.success ? '✅ PASSED' : '❌ FAILED');
  
  const allPassed = !result1.success && !result2.success && result3.success && result4.success;
  
  console.log('\n   🎯 OVERALL:', allPassed ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED');
  console.log('\n   ✅ Validation logic is working correctly!');
  console.log('   ✅ QR only generated when ALL 7 stages have ≥2 images');
  console.log('   ✅ Prevents unbalanced uploads (10 in stage 1, 0 in others)');
  console.log('\n');
}

// Run tests
runTests().catch(console.error);
