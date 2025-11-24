import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Diagnosing image data...');
    
    // Get sample stage with images
    const stage = await prisma.stage.findFirst({
      where: {
        images: {
          isEmpty: false
        }
      },
      select: {
        id: true,
        name: true,
        images: true
      }
    });
    
    if (!stage) {
      return NextResponse.json({ error: 'No stages with images found' }, { status: 404 });
    }
    
    const imageAnalysis = stage.images.map((image, index) => ({
      index: index + 1,
      length: image.length,
      prefix: image.substring(0, 50),
      isDataURL: image.startsWith('data:'),
      isBase64: image.includes('base64'),
      isSVG: image.includes('svg'),
      hasUndefined: image.includes('undefined') || image.includes('null'),
      decodable: (() => {
        try {
          if (image.startsWith('data:image/svg+xml;base64,')) {
            const base64Data = image.replace('data:image/svg+xml;base64,', '');
            const decoded = Buffer.from(base64Data, 'base64').toString('utf8');
            return { success: true, preview: decoded.substring(0, 100) };
          }
          return { success: false, error: 'Not SVG base64' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    }));
    
    return NextResponse.json({
      stage: {
        id: stage.id,
        name: stage.name,
        imageCount: stage.images.length
      },
      analysis: imageAnalysis
    });
    
  } catch (error) {
    console.error('Diagnostic error:', error);
    return NextResponse.json({ error: 'Diagnostic failed' }, { status: 500 });
  }
}
