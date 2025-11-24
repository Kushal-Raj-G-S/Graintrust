import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get all stages with images
    const stages = await prisma.stage.findMany({
      where: {
        images: {
          isEmpty: false
        }
      },
      select: {
        id: true,
        name: true,
        images: true,
        createdAt: true
      },
      take: 5
    });

    if (stages.length === 0) {
      return NextResponse.json({ 
        message: 'No stages with images found',
        recommendation: 'Run the seed script: npx tsx prisma/seed.ts'
      });
    }

    const analysis = stages.map(stage => ({
      stage: {
        id: stage.id,
        name: stage.name,
        createdAt: stage.createdAt
      },
      images: stage.images.map((image, index) => {
        const analysis = {
          index: index + 1,
          length: image.length,
          preview: image.substring(0, 100),
          isDataURL: image.startsWith('data:'),
          isBase64: image.includes('base64'),
          isSVG: image.includes('svg'),
          isHTTP: image.startsWith('http'),
          hasPrefix: image.startsWith('data:image/'),
          isEmpty: !image.trim(),
          hasInvalidChars: image.includes('undefined') || image.includes('null'),
          validFormat: false,
          decodingTest: null as any
        };

        // Test if it's a valid data URL
        const validDataUrlRegex = /^data:image\/(png|jpeg|jpg|gif|svg\+xml|webp);base64,/;
        analysis.validFormat = validDataUrlRegex.test(image);

        // Test decoding for SVG
        if (image.startsWith('data:image/svg+xml;base64,')) {
          try {
            const base64Data = image.replace('data:image/svg+xml;base64,', '');
            const decoded = Buffer.from(base64Data, 'base64').toString('utf8');
            analysis.decodingTest = {
              success: true,
              decodedPreview: decoded.substring(0, 100),
              isSVG: decoded.includes('<svg')
            };
          } catch (error: any) {
            analysis.decodingTest = {
              success: false,
              error: error?.message || 'Unknown error'
            };
          }
        }

        return analysis;
      })
    }));

    return NextResponse.json({
      totalStages: stages.length,
      analysis,
      summary: {
        totalImages: analysis.reduce((sum, stage) => sum + stage.images.length, 0),
        validDataUrls: analysis.reduce((sum, stage) => 
          sum + stage.images.filter(img => img.validFormat).length, 0),
        svgImages: analysis.reduce((sum, stage) => 
          sum + stage.images.filter(img => img.isSVG).length, 0),
        httpImages: analysis.reduce((sum, stage) => 
          sum + stage.images.filter(img => img.isHTTP).length, 0)
      }
    });

  } catch (error: any) {
    console.error('Image validation error:', error);
    return NextResponse.json({ 
      error: 'Validation failed',
      details: error?.message || 'Unknown error'
    }, { status: 500 });
  }
}
