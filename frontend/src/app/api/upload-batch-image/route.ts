import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { imageValidationAgent, type ImageValidationResult } from '@/lib/ai-validation-agent';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST endpoint - Upload image to Supabase Storage + AI Validation
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userName = formData.get('userName') as string; // User's name for folder
    const stageName = formData.get('stageName') as string; // Stage name (1-7)
    const batchId = formData.get('batchId') as string; // Batch ID for AI validation
    const stageId = formData.get('stageId') as string; // Stage ID for AI validation
    const farmerId = formData.get('farmerId') as string; // Farmer ID for AI validation

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!userName || !stageName) {
      return NextResponse.json(
        { error: 'userName and stageName are required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create folder structure: {userName}/{stageName}/{timestamp}-{filename}
    const timestamp = Date.now();
    const sanitizedUserName = userName.replace(/[^a-zA-Z0-9-_]/g, '_'); // Remove special chars
    const sanitizedStageName = stageName.replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${sanitizedUserName}/${sanitizedStageName}/${timestamp}-${file.name}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('batch-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Error uploading to Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('batch-images')
      .getPublicUrl(fileName);

    const imageUrl = publicUrlData.publicUrl;

    // 🤖 AI VALIDATION - Automatically validate uploaded image
    let aiValidationResult: ImageValidationResult | null = null;
    if (batchId && stageId && farmerId) {
      try {
        console.log('🤖 Running AI validation for uploaded image...');
        
        // Run AI validation agent (pass buffer instead of File)
        aiValidationResult = await imageValidationAgent(buffer, imageUrl);
        
        console.log('✅ AI Validation completed:', {
          deepfakeScore: aiValidationResult.deepfakeScore,
          aiAction: aiValidationResult.aiAction,
          formatValid: aiValidationResult.formatValid,
          integrityValid: aiValidationResult.integrityValid
        });

        // Log to raw_uploads table
        const { data: rawUpload, error: rawUploadError } = await supabase
          .from('raw_uploads')
          .insert({
            batchId,
            stageId,
            farmerId,
            imageUrl,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
            uploadedAt: new Date().toISOString()
          })
          .select()
          .single();

        if (rawUploadError) {
          console.error('Error logging raw upload:', rawUploadError);
        }

        // Store AI validation results
        const { data: aiValidation, error: aiValidationError } = await supabase
          .from('ai_validations')
          .insert({
            rawUploadId: rawUpload?.id,
            batchId,
            stageId,
            imageUrl,
            imageHash: aiValidationResult.imageHash,
            formatValid: aiValidationResult.formatValid,
            integrityValid: aiValidationResult.integrityValid,
            deepfakeScore: aiValidationResult.deepfakeScore,
            visualSenseScore: aiValidationResult.visualSenseScore,
            aiAction: aiValidationResult.aiAction,
            aiReason: aiValidationResult.aiReason,
            aiRequiresHumanReview: aiValidationResult.aiRequiresHumanReview,
            aiModel: 'prithivMLmods/Deep-Fake-Detector-v2-Model',
            validatedAt: new Date().toISOString()
          })
          .select()
          .single();

        if (aiValidationError) {
          console.error('Error storing AI validation:', aiValidationError);
        }

        // Handle AI decision
        if (aiValidationResult.aiAction === 'AUTO_REJECT') {
          // Notify farmer about rejection
          await supabase.from('notifications').insert({
            userId: farmerId,
            type: 'IMAGE_FLAGGED',
            message: `AI detected potential deepfake/fake image. Reason: ${aiValidationResult.aiReason}`,
            metadata: {
              batchId,
              stageId,
              imageUrl,
              deepfakeScore: aiValidationResult.deepfakeScore,
              aiAction: 'AUTO_REJECT'
            },
            read: false,
            createdAt: new Date().toISOString()
          });

          console.log('🚫 Image AUTO-REJECTED by AI - Deepfake detected');

        } else if (aiValidationResult.aiAction === 'AUTO_APPROVE') {
          // Create verified stage record
          await supabase.from('verified_stages').insert({
            batchId,
            stageId,
            imageUrl,
            aiValidationId: aiValidation?.id,
            verifiedMethod: 'AUTO_APPROVE',
            verifiedAt: new Date().toISOString()
          });

          // 🔗 BLOCKCHAIN RECORDING - Record auto-approved image to blockchain
          try {
            console.log('🔗 Recording auto-approved image to blockchain...');
            
            // Get batch details for blockchain
            const { data: batch } = await supabase
              .from('batches')
              .select('name, category, farmerId, farmers(name)')
              .eq('id', batchId)
              .single();

            // Get farmer name
            const farmerName = (batch?.farmers as any)?.[0]?.name || (batch?.farmers as any)?.name || userName;

            // Check if this is the first image in the batch
            const { data: existingImages } = await supabase
              .from('verified_stages')
              .select('id')
              .eq('batchId', batchId);

            const isFirstImage = !existingImages || existingImages.length === 0;

            // Call blockchain recording API
            const blockchainResponse = await fetch('http://172.29.54.144:9000/record-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                batchId,
                farmerName,
                grainType: batch?.category || 'Unknown',
                quantity: '100', // You can add actual quantity field
                imageHash: aiValidationResult.imageHash,
                location: 'Farm Location', // You can add actual location
                stageName,
                isFirstImage
              })
            });

            const blockchainResult = await blockchainResponse.json();

            if (blockchainResult.success) {
              console.log('✅ Blockchain recorded:', blockchainResult.transactionId);
              
              // Update verified_stages with blockchain details
              await supabase
                .from('verified_stages')
                .update({
                  blockchainTxId: blockchainResult.transactionId,
                  blockchainHash: blockchainResult.imageHash,
                  blockNumber: blockchainResult.blockNumber,
                  blockchainRecordedAt: new Date().toISOString()
                })
                .eq('batchId', batchId)
                .eq('imageUrl', imageUrl);

              // 🎉 CHECK IF QR WAS AUTO-GENERATED BY BLOCKCHAIN
              if (blockchainResult.qrGenerated && blockchainResult.qrCode) {
                console.log('\n╔════════════════════════════════════════════════════════╗');
                console.log('║  🎉 QR AUTO-GENERATED BY BLOCKCHAIN!                  ║');
                console.log('╚════════════════════════════════════════════════════════╝');
                console.log('   QR URL:', blockchainResult.qrCode.qrUrl);
                console.log('   Certificate ID:', blockchainResult.qrCode.batchId);
                console.log('   Stages:', blockchainResult.qrCode.stages);
                console.log('   Images:', blockchainResult.qrCode.images);
                console.log('   Batch ID to update:', batchId);
                console.log('');
                
        // Save QR code to batches table
        console.log('💾 Saving QR to database...');
        const { data: updatedBatch, error: qrUpdateError } = await supabase
          .from('batches')
          .update({
            qrCode: blockchainResult.qrCode.qrUrl,
            certificate_id: blockchainResult.qrCode.batchId,
            status: 'CERTIFIED'
          })
          .eq('id', batchId)
          .select()
          .single();                if (qrUpdateError) {
                  console.error('❌ Failed to save QR code:', qrUpdateError);
                  console.error('   Error details:', JSON.stringify(qrUpdateError, null, 2));
                } else {
                  console.log('✅ QR code saved to database!');
                  console.log('   Updated batch:', JSON.stringify(updatedBatch, null, 2));
                  console.log('');
                  
                  // Notify farmer about certificate generation
                  await supabase.from('notifications').insert({
                    userId: farmerId,
                    type: 'CERTIFICATE_GENERATED',
                    message: `🎉 Congratulations! Your batch certificate has been generated. All 7 farming stages completed!`,
                    metadata: {
                      batchId,
                      certificateId: blockchainResult.qrCode.batchId,
                      qrUrl: blockchainResult.qrCode.qrUrl,
                      stages: blockchainResult.qrCode.stages,
                      totalImages: blockchainResult.qrCode.images
                    },
                    read: false,
                    createdAt: new Date().toISOString()
                  });
                }
              } else if (blockchainResult.progress) {
                // Show progress in console
                console.log('📊 Progress:', blockchainResult.progress.message);
                console.log('   Stages:', blockchainResult.progress.uniqueStages, '/', blockchainResult.progress.requiredStages);
                console.log('   Per Stage:', blockchainResult.progress.stageImageCount);
              }
            }

          } catch (blockchainError) {
            console.error('⚠️ Blockchain recording failed (non-fatal):', blockchainError);
            // Continue even if blockchain fails
          }

          // Notify farmer about approval
          await supabase.from('notifications').insert({
            userId: farmerId,
            type: 'IMAGE_VERIFIED',
            message: `Your image has been automatically verified by AI as authentic.`,
            metadata: {
              batchId,
              stageId,
              imageUrl,
              deepfakeScore: aiValidationResult.deepfakeScore,
              aiAction: 'AUTO_APPROVE'
            },
            read: false,
            createdAt: new Date().toISOString()
          });

          console.log('✅ Image AUTO-APPROVED by AI - Real image');

        } else if (aiValidationResult.aiAction === 'FLAG_FOR_HUMAN') {
          // Create expert review request
          await supabase.from('expert_reviews').insert({
            aiValidationId: aiValidation?.id,
            batchId,
            stageId,
            imageUrl,
            decision: 'PENDING',
            assignedAt: new Date().toISOString()
          });

          // Notify admins for review
          const { data: admins } = await supabase
            .from('users')
            .select('id')
            .eq('role', 'ADMIN');

          if (admins && aiValidationResult) {
            const adminNotifications = admins.map(admin => ({
              userId: admin.id,
              type: 'IMAGE_FLAGGED',
              message: `Image requires expert review. AI confidence: ${(aiValidationResult!.deepfakeScore * 100).toFixed(1)}%`,
              metadata: {
                batchId,
                stageId,
                farmerId,
                imageUrl,
                deepfakeScore: aiValidationResult!.deepfakeScore,
                aiAction: 'FLAG_FOR_HUMAN',
                requiresReview: true
              },
              read: false,
              createdAt: new Date().toISOString()
            }));

            await supabase.from('notifications').insert(adminNotifications);
          }

          console.log('⚠️ Image FLAGGED for human review - Uncertain AI confidence');
        }

      } catch (aiError) {
        console.error('❌ AI validation error (non-fatal):', aiError);
        // Continue with upload even if AI fails
      }
    }

    return NextResponse.json({
      success: true,
      url: imageUrl,
      path: data.path,
      folder: `${sanitizedUserName}/${sanitizedStageName}`,
      aiValidation: aiValidationResult ? {
        deepfakeScore: aiValidationResult.deepfakeScore,
        aiAction: aiValidationResult.aiAction,
        visualSenseScore: aiValidationResult.visualSenseScore,
        aiReason: aiValidationResult.aiReason
      } : null
    });

  } catch (error) {
    console.error('Error in image upload:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}
