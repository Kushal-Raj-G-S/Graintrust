import { PrismaClient } from '@prisma/client';
import { supabase, STORAGE_BUCKET, generateFileName, getPublicUrl } from '../src/lib/supabase-config';

const prisma = new PrismaClient();

interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errorCount: number;
  errors: string[];
}

// Convert base64 to buffer and extract mime type
function parseBase64Image(base64String: string): { buffer: Buffer; mimeType: string; extension: string } | null {
  try {
    // Handle data URL format (data:image/png;base64,...)
    const matches = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (matches) {
      const mimeType = `image/${matches[1]}`;
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      return { buffer, mimeType, extension: matches[1] };
    }

    // Handle plain base64 (assume jpeg if no header)
    const buffer = Buffer.from(base64String, 'base64');
    return { buffer, mimeType: 'image/jpeg', extension: 'jpg' };
  } catch (error) {
    console.error('Error parsing base64:', error);
    return null;
  }
}

// Upload image to Supabase Storage
async function uploadToSupabase(buffer: Buffer, mimeType: string, extension: string): Promise<string> {
  const fileName = generateFileName(`migrated.${extension}`);
  
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  return getPublicUrl(data.path);
}

// Migrate images for batches
async function migrateBatchImages(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errorCount: 0,
    errors: []
  };

  try {
    const batches = await prisma.batch.findMany({
      where: {
        images: {
          isEmpty: false
        }
      }
    });

    console.log(`Found ${batches.length} batches with images to migrate`);

    for (const batch of batches) {
      const imageUrls: string[] = [];
      
      for (const base64Image of batch.images) {
        try {
          const parsed = parseBase64Image(base64Image);
          if (!parsed) {
            result.errors.push(`Failed to parse base64 image for batch ${batch.id}`);
            result.errorCount++;
            continue;
          }

          const url = await uploadToSupabase(parsed.buffer, parsed.mimeType, parsed.extension);
          imageUrls.push(url);
          result.migratedCount++;
          
          console.log(`Migrated image for batch ${batch.id}: ${url}`);
        } catch (error) {
          result.errors.push(`Failed to upload image for batch ${batch.id}: ${error}`);
          result.errorCount++;
        }
      }

      if (imageUrls.length > 0) {
        await prisma.batch.update({
          where: { id: batch.id },
          data: { imageUrls }
        });
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push(`Batch migration failed: ${error}`);
  }

  return result;
}

// Migrate images for stages
async function migrateStageImages(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errorCount: 0,
    errors: []
  };

  try {
    const stages = await prisma.stage.findMany({
      where: {
        images: {
          isEmpty: false
        }
      }
    });

    console.log(`Found ${stages.length} stages with images to migrate`);

    for (const stage of stages) {
      const imageUrls: string[] = [];
      
      for (const base64Image of stage.images) {
        try {
          const parsed = parseBase64Image(base64Image);
          if (!parsed) {
            result.errors.push(`Failed to parse base64 image for stage ${stage.id}`);
            result.errorCount++;
            continue;
          }

          const url = await uploadToSupabase(parsed.buffer, parsed.mimeType, parsed.extension);
          imageUrls.push(url);
          result.migratedCount++;
          
          console.log(`Migrated image for stage ${stage.id}: ${url}`);
        } catch (error) {
          result.errors.push(`Failed to upload image for stage ${stage.id}: ${error}`);
          result.errorCount++;
        }
      }

      if (imageUrls.length > 0) {
        await prisma.stage.update({
          where: { id: stage.id },
          data: { imageUrls }
        });
      }
    }
  } catch (error) {
    result.success = false;
    result.errors.push(`Stage migration failed: ${error}`);
  }

  return result;
}

// Main migration function
async function migrateImages() {
  console.log('Starting image migration to Supabase Storage...');
  console.log('This will convert base64 images to Supabase Storage URLs');
  console.log('================================\n');

  try {
    // Migrate batch images
    console.log('Migrating batch images...');
    const batchResult = await migrateBatchImages();
    
    console.log(`\nBatch migration results:`);
    console.log(`✅ Success: ${batchResult.success}`);
    console.log(`📊 Migrated: ${batchResult.migratedCount} images`);
    console.log(`❌ Errors: ${batchResult.errorCount}`);
    
    if (batchResult.errors.length > 0) {
      console.log('\nBatch errors:');
      batchResult.errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }

    // Migrate stage images
    console.log('\n\nMigrating stage images...');
    const stageResult = await migrateStageImages();
    
    console.log(`\nStage migration results:`);
    console.log(`✅ Success: ${stageResult.success}`);
    console.log(`📊 Migrated: ${stageResult.migratedCount} images`);
    console.log(`❌ Errors: ${stageResult.errorCount}`);
    
    if (stageResult.errors.length > 0) {
      console.log('\nStage errors:');
      stageResult.errors.forEach((error, i) => console.log(`${i + 1}. ${error}`));
    }

    // Summary
    console.log('\n================================');
    console.log('MIGRATION SUMMARY');
    console.log('================================');
    console.log(`Total images migrated: ${batchResult.migratedCount + stageResult.migratedCount}`);
    console.log(`Total errors: ${batchResult.errorCount + stageResult.errorCount}`);
    console.log(`Overall success: ${batchResult.success && stageResult.success}`);

    if (batchResult.success && stageResult.success) {
      console.log('\n✅ Migration completed successfully!');
      console.log('Next steps:');
      console.log('1. Test the application with new image URLs');
      console.log('2. Update frontend to use imageUrls instead of images');
      console.log('3. Remove base64 images field after verification');
    } else {
      console.log('\n❌ Migration completed with errors. Please review and fix issues.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  migrateImages();
}

export { migrateImages };
