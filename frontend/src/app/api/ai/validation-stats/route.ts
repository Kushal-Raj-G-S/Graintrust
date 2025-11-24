/**
 * AI VALIDATION DASHBOARD API
 * GET /api/ai/validation-stats
 * Returns AI validation statistics and recent validations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');

    // 1. Get overall statistics (exclude fallback scores from API failures)
    const { data: allValidations, error: statsError } = await supabase
      .from('ai_validations')
      .select('aiAction, deepfakeScore, validatedAt')
      .neq('deepfakeScore', 0.5); // Exclude API failure fallbacks

    if (statsError) {
      console.error('Error fetching validation stats:', statsError);
      return NextResponse.json({ error: statsError.message }, { status: 500 });
    }

    // Calculate statistics
    const stats = {
      totalValidations: allValidations?.length || 0,
      autoApproved: allValidations?.filter(v => v.aiAction === 'AUTO_APPROVE').length || 0,
      autoRejected: allValidations?.filter(v => v.aiAction === 'AUTO_REJECT').length || 0,
      flaggedForHuman: allValidations?.filter(v => v.aiAction === 'FLAG_FOR_HUMAN').length || 0,
      averageDeepfakeScore: allValidations && allValidations.length > 0
        ? (allValidations.reduce((sum, v) => sum + (v.deepfakeScore || 0), 0) / allValidations.length)
        : 0,
      deepfakesDetected: allValidations?.filter(v => v.deepfakeScore > 0.7).length || 0,
    };

    // 2. Get recent validations with details (no joins - just basic data)
    const { data: recentValidations, error: recentError } = await supabase
      .from('ai_validations')
      .select(`
        id,
        batchId,
        stageId,
        imageUrl,
        imageHash,
        formatValid,
        integrityValid,
        deepfakeScore,
        visualSenseScore,
        aiAction,
        aiReason,
        aiRequiresHumanReview,
        aiModel,
        validatedAt
      `)
      .order('validatedAt', { ascending: false })
      .limit(limit);

    if (recentError) {
      console.error('Error fetching recent validations:', recentError);
    }

    // 3. Get pending expert reviews (no joins - just basic data)
    const { data: pendingReviews, error: pendingError } = await supabase
      .from('expert_reviews')
      .select(`
        id,
        batchId,
        imageUrl,
        decision,
        assignedAt
      `)
      .eq('decision', 'PENDING')
      .order('assignedAt', { ascending: false });

    if (pendingError) {
      console.error('Error fetching pending reviews:', pendingError);
    }

    // 4. Get verified stages count
    const { data: verifiedStages, error: verifiedError } = await supabase
      .from('verified_stages')
      .select('id, verifiedMethod')
      .limit(1000);

    const verifiedStats = {
      totalVerified: verifiedStages?.length || 0,
      aiAutoApproved: verifiedStages?.filter(v => v.verifiedMethod === 'AUTO_APPROVE').length || 0,
      expertApproved: verifiedStages?.filter(v => v.verifiedMethod === 'EXPERT_APPROVED').length || 0,
    };

    // 5. Get farmer-batch grouped data for flagged/suspicious images
    // Filter out fallback uncertain scores (exactly 0.5 = 50% means API failed, not real analysis)
    const { data: flaggedValidations, error: flaggedError } = await supabase
      .from('ai_validations')
      .select(`
        id,
        batchId,
        stageId,
        imageUrl,
        deepfakeScore,
        visualSenseScore,
        aiAction,
        aiReason,
        validatedAt,
        rawUploadId
      `)
      .in('aiAction', ['AUTO_REJECT', 'FLAG_FOR_HUMAN'])
      .neq('deepfakeScore', 0.5) // Exclude fallback uncertain scores (API failures)
      .order('validatedAt', { ascending: false });

    // Get unique batch IDs and farmer IDs
    const batchIds = [...new Set(flaggedValidations?.map(v => v.batchId) || [])];
    
    // Fetch batch and farmer details
    const { data: batches } = await supabase
      .from('batches')
      .select('id, name, farmerId')
      .in('id', batchIds);

    const farmerIds = [...new Set(batches?.map(b => b.farmerId) || [])];
    
    const { data: farmers } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', farmerIds);

    // Group flagged validations by farmer -> batch
    const farmerBatchData = farmers?.map(farmer => {
      const farmerBatches = batches?.filter(b => b.farmerId === farmer.id) || [];
      
      return {
        farmerId: farmer.id,
        farmerName: farmer.name,
        farmerEmail: farmer.email,
        batches: farmerBatches.map(batch => {
          const batchValidations = flaggedValidations?.filter(v => v.batchId === batch.id) || [];
          
          return {
            batchId: batch.id,
            batchName: batch.name,
            flaggedImages: batchValidations.length,
            autoRejected: batchValidations.filter(v => v.aiAction === 'AUTO_REJECT').length,
            flaggedForReview: batchValidations.filter(v => v.aiAction === 'FLAG_FOR_HUMAN').length,
            validations: batchValidations
          };
        }).filter(batch => batch.flaggedImages > 0) // Only show batches with flagged images
      };
    }).filter(farmer => farmer.batches.length > 0); // Only show farmers with flagged batches

    return NextResponse.json({
      stats,
      verifiedStats,
      recentValidations: recentValidations || [],
      pendingReviews: pendingReviews || [],
      farmerBatchData: farmerBatchData || [], // NEW: Grouped by farmer
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error) {
    console.error('Error in AI validation stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
