import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Fetch all batches that have:
    // 1. All 7 stages completed
    // 2. QR code generated
    // 3. Verified status
    
    const products = await prisma.batch.findMany({
      where: {
        AND: [
          { qrCode: { not: null } }, // Has QR code
          { verificationStatus: 'VERIFIED' }, // Is verified
          {
            stages: {
              some: {} // Has stages - we'll count them
            }
          }
        ]
      },
      include: {
        farmer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        stages: {
          select: {
            id: true,
            name: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filter products that have exactly 7 completed stages
    const readyProducts = products.filter(batch => {
      const completedStages = batch.stages?.filter(stage => stage.status === 'COMPLETED') || [];
      return completedStages.length === 7;
    });

    // Transform to marketplace format
    const marketplaceProducts = readyProducts.map(batch => ({
      id: batch.id,
      batchId: batch.id,
      batchCode: batch.batchCode || `BATCH-${batch.id.slice(0, 8)}`,
      productName: batch.name,
      category: batch.category,
      farmerName: batch.farmer?.name || 'Unknown Farmer',
      farmerId: batch.farmerId,
      price: batch.price || 0, // You'll need to add price field to Batch model
      quantity: batch.quantity || 0,
      unit: batch.unit || 'kg',
      location: typeof batch.location === 'string' 
        ? batch.location 
        : (batch.location as any)?.address || 'Unknown Location',
      imageUrl: batch.imageUrls?.[0] || null,
      qrCode: batch.qrCode,
      verified: batch.verificationStatus === 'VERIFIED',
      rating: 4.5, // You can add rating system later
      description: batch.description || '',
      harvestDate: batch.actualHarvestDate?.toISOString() || batch.expectedHarvestDate?.toISOString() || '',
      stagesCompleted: batch.stages?.filter(s => s.status === 'COMPLETED').length || 0,
      totalStages: 7
    }));

    return NextResponse.json({
      success: true,
      products: marketplaceProducts,
      count: marketplaceProducts.length
    });

  } catch (error) {
    console.error('Error fetching marketplace products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace products' },
      { status: 500 }
    );
  }
}
