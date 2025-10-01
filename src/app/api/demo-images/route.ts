import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageName = searchParams.get('image');
    
    if (!imageName) {
      return NextResponse.json({ error: 'Image name required' }, { status: 400 });
    }

    // Security: Only allow specific image names
    const allowedImages = [
      'tomato_early_blight.JPG',
      'tomato_late_blight.JPG', 
      'tomato_healthy.JPG',
      'Apple_scab.JPG',
      'tomato_bacterial_spot.JPG',
      'tomato_leaf_mold.JPG',
      'tomato_mosaic_virus.JPG',
      'tomato_septoria_leaf_spot.JPG',
      'tomato_spider_mites_two_spotted_spider_mites.JPG',
      'tomato_target_spot.JPG',
      'potato_early_blight.JPG',
      'potato_late_blight.JPG',
      'potato_healthy.JPG',
      'corn_common_rust.JPG',
      'corn_northen_leaf_blight.JPG',
      'apple_healthy.JPG',
      'apple_black_rot.JPG'
    ];

    if (!allowedImages.includes(imageName)) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Read the image file
    const imagePath = join(process.cwd(), 'test_images', imageName);
    const imageBuffer = await readFile(imagePath);
    
    // Determine content type
    const contentType = imageName.toLowerCase().endsWith('.jpg') || imageName.toLowerCase().endsWith('.jpeg') 
      ? 'image/jpeg' 
      : 'image/png';

    // NextResponse in the edge/runtime expects web types (Blob/ArrayBuffer), not Node Buffer
    const blob = new Blob([imageBuffer], { type: contentType });
    return new NextResponse(blob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error serving demo image:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}