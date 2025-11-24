/**
 * AI VALIDATION API ENDPOINT
 * POST /api/ai/validate-image
 * Validates uploaded images using AI agent and stores results
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { imageValidationAgent } from '@/lib/ai-validation-agent';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const batchId = formData.get('batchId') as string;
    const stageId = formData.get('stageId') as string;
    const farmerId = formData.get('farmerId') as string;
    const imageUrl = formData.get('imageUrl') as string;

    console.log('🤖 AI Validation Request:', {
      batchId,
      stageId,
      farmerId,
      imageUrl: imageUrl?.substring(0, 50) + '...',
      imageSize: image?.size
    });

    // Validate required fields
    if (!image || !batchId || !farmerId || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: image, batchId, farmerId, imageUrl' },
        { status: 400 }
      );
    }

    // Convert image to buffer
    const arrayBuffer = await image.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Step 1: Log to raw_uploads (audit trail)
    console.log('📝 Logging to raw_uploads...');
    const { data: rawUpload, error: rawUploadError } = await supabase
      .from('raw_uploads')
      .insert({
        batchId,
        stageId,
        farmerId,
        imageUrl,
        imageHash: '', // Will be filled by AI agent
        fileSize: imageBuffer.length
      })
      .select()
      .single();

    if (rawUploadError) {
      console.error('❌ Failed to log raw upload:', rawUploadError);
      return NextResponse.json(
        { error: 'Failed to log upload', details: rawUploadError.message },
        { status: 500 }
      );
    }

    console.log('✅ Raw upload logged:', rawUpload.id);

    // Step 2: Run AI validation agent
    console.log('🤖 Running AI validation agent...');
    const aiValidation = await imageValidationAgent(imageBuffer, image.type);

    // Update raw_uploads with imageHash
    await supabase
      .from('raw_uploads')
      .update({ imageHash: aiValidation.imageHash })
      .eq('id', rawUpload.id);

    // Step 3: Store AI validation results
    console.log('💾 Storing AI validation results...');
    const { data: aiRecord, error: aiRecordError } = await supabase
      .from('ai_validations')
      .insert({
        rawUploadId: rawUpload.id,
        batchId,
        stageId,
        imageUrl,
        imageHash: aiValidation.imageHash,
        formatValid: aiValidation.formatValid,
        integrityValid: aiValidation.integrityValid,
        deepfakeScore: aiValidation.deepfakeScore,
        visualSenseScore: aiValidation.visualSenseScore,
        aiAction: aiValidation.aiAction,
        aiReason: aiValidation.aiReason,
        aiRequiresHumanReview: aiValidation.aiRequiresHumanReview,
        aiModel: aiValidation.aiModel
      })
      .select()
      .single();

    if (aiRecordError) {
      console.error('❌ Failed to store AI validation:', aiRecordError);
      return NextResponse.json(
        { error: 'Failed to store AI validation', details: aiRecordError.message },
        { status: 500 }
      );
    }

    console.log('✅ AI validation stored:', aiRecord.id);

    // Step 4: Route based on AI action
    if (aiValidation.aiAction === 'AUTO_REJECT') {
      // AUTO-REJECT: Send notification to farmer
      console.log('❌ AUTO-REJECTED:', aiValidation.aiReason);
      
      // Create notification for farmer
      await supabase.from('notifications').insert({
        userId: farmerId,
        type: 'IMAGE_FLAGGED',
        title: 'Image rejected by AI',
        message: `Your image was automatically rejected: ${aiValidation.aiReason}`,
        actionUrl: `/farmer/batch/${batchId}`,
        actionText: 'Re-upload Image',
        metadata: {
          batchId,
          stageId,
          imageUrl,
          aiReason: aiValidation.aiReason,
          deepfakeScore: aiValidation.deepfakeScore
        },
        read: false
      });

      return NextResponse.json({
        status: 'rejected',
        aiAction: aiValidation.aiAction,
        reason: aiValidation.aiReason,
        validation: aiValidation,
        aiValidationId: aiRecord.id
      }, { status: 200 });
    }

    if (aiValidation.aiAction === 'AUTO_APPROVE') {
      // AUTO-APPROVE: Record to verified_stages
      console.log('✅ AUTO-APPROVED:', aiValidation.aiReason);
      
      const { data: verifiedStage, error: verifiedError } = await supabase
        .from('verified_stages')
        .insert({
          batchId,
          stageId,
          imageUrl,
          imageHash: aiValidation.imageHash,
          aiValidationId: aiRecord.id,
          expertReviewId: null, // No expert review needed
          verifiedMethod: 'AUTO_APPROVE'
        })
        .select()
        .single();

      if (verifiedError) {
        console.error('❌ Failed to create verified stage:', verifiedError);
      } else {
        console.log('✅ Verified stage created:', verifiedStage.id);
      }

      // Notify farmer of success
      await supabase.from('notifications').insert({
        userId: farmerId,
        type: 'IMAGE_VERIFIED',
        title: 'Image verified by AI',
        message: `Your image passed all AI validation checks and was automatically verified!`,
        actionUrl: `/farmer/batch/${batchId}`,
        actionText: 'View Batch',
        metadata: {
          batchId,
          stageId,
          imageUrl,
          aiReason: aiValidation.aiReason
        },
        read: false
      });

      return NextResponse.json({
        status: 'verified',
        aiAction: aiValidation.aiAction,
        reason: aiValidation.aiReason,
        validation: aiValidation,
        aiValidationId: aiRecord.id,
        verifiedStageId: verifiedStage?.id
      }, { status: 200 });
    }

    if (aiValidation.aiAction === 'FLAG_FOR_HUMAN') {
      // FLAG_FOR_HUMAN: Create expert review task
      console.log('⚠️ FLAGGED FOR HUMAN REVIEW:', aiValidation.aiReason);
      
      // Find an available admin/expert
      const { data: admins } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'ADMIN')
        .limit(1);

      const expertId = admins && admins.length > 0 ? admins[0].id : null;

      if (expertId) {
        // Create expert review record
        const { data: expertReview, error: expertReviewError } = await supabase
          .from('expert_reviews')
          .insert({
            aiValidationId: aiRecord.id,
            batchId,
            stageId,
            imageUrl,
            expertId,
            decision: 'PENDING'
          })
          .select()
          .single();

        if (expertReviewError) {
          console.error('❌ Failed to create expert review:', expertReviewError);
        } else {
          console.log('✅ Expert review created:', expertReview.id);

          // Notify admin/expert
          await supabase.from('notifications').insert({
            userId: expertId,
            type: 'IMAGE_FLAGGED',
            title: 'Image needs expert review',
            message: `AI flagged an image for review: ${aiValidation.aiReason}`,
            actionUrl: `/admin/image-verification`,
            actionText: 'Review Image',
            metadata: {
              batchId,
              stageId,
              imageUrl,
              farmerId,
              aiReason: aiValidation.aiReason,
              deepfakeScore: aiValidation.deepfakeScore,
              visualSenseScore: aiValidation.visualSenseScore,
              expertReviewId: expertReview.id
            },
            read: false
          });
        }
      }

      // Notify farmer
      await supabase.from('notifications').insert({
        userId: farmerId,
        type: 'SYSTEM_ALERT',
        title: 'Image under review',
        message: `Your image is being reviewed by an expert. You'll be notified once the review is complete.`,
        actionUrl: `/farmer/batch/${batchId}`,
        actionText: 'View Batch',
        metadata: {
          batchId,
          stageId,
          imageUrl
        },
        read: false
      });

      return NextResponse.json({
        status: 'pending_review',
        aiAction: aiValidation.aiAction,
        reason: aiValidation.aiReason,
        validation: aiValidation,
        aiValidationId: aiRecord.id,
        expertId
      }, { status: 200 });
    }

    return NextResponse.json({
      status: 'unknown',
      validation: aiValidation
    }, { status: 500 });

  } catch (error) {
    console.error('❌ AI Validation API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
