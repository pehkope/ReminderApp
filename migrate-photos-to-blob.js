// Migrate mom's photos from Google Drive to Azure Blob Storage
const { BlobServiceClient } = require('@azure/storage-blob');
const { CosmosClient } = require('@azure/cosmos');
const https = require('https');

// Configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || 'YOUR_STORAGE_CONNECTION_STRING';
const COSMOS_CONNECTION_STRING = process.env.COSMOS_CONNECTION_STRING || 'YOUR_COSMOS_CONNECTION_STRING';
const PHOTOS_CONTAINER_NAME = 'photos';
const DATABASE_ID = 'ReminderAppDB';

// Mom's Google Drive photos (from Web App response)
const googleDrivePhotos = [
  {
    clientId: 'mom',
    url: 'https://drive.google.com/thumbnail?id=1-C_GAzA6QP7UDIfDU2VgYxyd3ZcWwELw',
    caption: 'Äiti, Petri ja Tiitta euroopan kiertueella',
    tags: ['family', 'travel', 'memories']
  },
  {
    clientId: 'mom',
    url: 'https://drive.google.com/thumbnail?id=13bnl5gdYaUzj591PulJJsORr28RK6AHu',
    caption: 'Joensuun mummi, Petri ja Tiitta',
    tags: ['family', 'grandmother', 'memories']
  },
  {
    clientId: 'mom',
    url: 'https://drive.google.com/thumbnail?id=1Dp2KrOUMGr1tR8zWBAUODDlY1uZ-bymL',
    caption: 'Äiti ja Asta Kostamo Kilpisjärvellä',
    tags: ['family', 'kilpisjarvi', 'friends']
  },
  {
    clientId: 'mom',
    url: 'https://drive.google.com/thumbnail?id=1uiP0mA3WTJmEdQKu6Aor7ex0TUKhI4yN',
    caption: 'Pehkoset ja Kostamot Kilpisjärvellä',
    tags: ['family', 'kilpisjarvi', 'friends']
  },
  {
    clientId: 'mom',
    url: 'https://drive.google.com/thumbnail?id=13yTXPhaFwsQhZAb7IvPG4msh7Us4B73W',
    caption: 'Petri',
    tags: ['family', 'son', 'memories']
  }
  // Add more photos as needed...
];

// Download image from Google Drive
async function downloadFromGoogleDrive(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer);
      });
    }).on('error', reject);
  });
}

// Upload to Azure Blob Storage
async function uploadToBlob(buffer, fileName) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(PHOTOS_CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);

  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: {
      blobContentType: 'image/jpeg'
    }
  });

  return blockBlobClient.url;
}

// Save metadata to Cosmos DB
async function savePhotoMetadata(photoData) {
  const cosmosClient = new CosmosClient(COSMOS_CONNECTION_STRING);
  const database = cosmosClient.database(DATABASE_ID);
  const container = database.container('Photos');

  const { resource } = await container.items.create(photoData);
  return resource;
}

// Generate filename
function generateFileName(clientId, index, originalUrl) {
  const driveId = originalUrl.match(/id=([^&]+)/)?.[1] || `unknown_${index}`;
  return `${clientId}/migrated_${driveId}.jpg`;
}

// Migrate single photo
async function migratePhoto(photo, index) {
  try {
    console.log(`\n📸 Migrating ${index + 1}/${googleDrivePhotos.length}: ${photo.caption}`);
    console.log(`🔗 Source: ${photo.url}`);

    // Download from Google Drive
    console.log('⬇️  Downloading from Google Drive...');
    const imageBuffer = await downloadFromGoogleDrive(photo.url);
    console.log(`✅ Downloaded ${imageBuffer.length} bytes`);

    // Generate filename
    const fileName = generateFileName(photo.clientId, index, photo.url);
    console.log(`📁 Target filename: ${fileName}`);

    // Upload to Azure Blob
    console.log('⬆️  Uploading to Azure Blob Storage...');
    const blobUrl = await uploadToBlob(imageBuffer, fileName);
    console.log(`✅ Uploaded to: ${blobUrl}`);

    // Save metadata to Cosmos DB
    const photoMetadata = {
      id: `photo_${photo.clientId}_migrated_${Date.now()}_${index}`,
      clientId: photo.clientId,
      type: 'photo',
      fileName: fileName,
      blobUrl: blobUrl,
      originalGoogleDriveUrl: photo.url,
      caption: photo.caption,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'migration_script',
      uploadSource: 'google_drive_migration',
      fileSize: imageBuffer.length,
      mimeType: 'image/jpeg',
      isActive: true,
      tags: photo.tags || ['migrated']
    };

    console.log('💾 Saving metadata to Cosmos DB...');
    const savedMetadata = await savePhotoMetadata(photoMetadata);
    console.log(`✅ Metadata saved with ID: ${savedMetadata.id}`);

    return {
      success: true,
      originalUrl: photo.url,
      blobUrl: blobUrl,
      fileName: fileName,
      caption: photo.caption
    };

  } catch (error) {
    console.error(`❌ Migration failed for photo ${index + 1}:`, error.message);
    return {
      success: false,
      originalUrl: photo.url,
      error: error.message,
      caption: photo.caption
    };
  }
}

// Migrate all photos
async function migrateAllPhotos() {
  console.log('🚀 Starting Google Drive → Azure Blob Storage migration');
  console.log(`📊 Total photos to migrate: ${googleDrivePhotos.length}`);

  // Validate configuration
  if (AZURE_STORAGE_CONNECTION_STRING === 'YOUR_STORAGE_CONNECTION_STRING') {
    console.error('❌ Please set AZURE_STORAGE_CONNECTION_STRING');
    return;
  }
  if (COSMOS_CONNECTION_STRING === 'YOUR_COSMOS_CONNECTION_STRING') {
    console.error('❌ Please set COSMOS_CONNECTION_STRING');
    return;
  }

  const results = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < googleDrivePhotos.length; i++) {
    const result = await migratePhoto(googleDrivePhotos[i], i);
    results.push(result);
    
    if (result.success) {
      successCount++;
    } else {
      errorCount++;
    }

    // Small delay to avoid overwhelming services
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Migration completed!');
  console.log(`✅ Successful: ${successCount} photos`);
  console.log(`❌ Failed: ${errorCount} photos`);
  console.log('');

  if (successCount > 0) {
    console.log('🔍 Next steps:');
    console.log('1. Update ReminderAPI to use Azure Blob Storage URLs');
    console.log('2. Test: GET /api/ReminderAPI?clientID=mom');
    console.log('3. PWA should show photos from Azure Blob Storage');
  }

  // Show results
  console.log('\n📋 Migration Results:');
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`✅ ${index + 1}. ${result.caption} → ${result.fileName}`);
    } else {
      console.log(`❌ ${index + 1}. ${result.caption} → Error: ${result.error}`);
    }
  });

  return results;
}

// Run migration
if (require.main === module) {
  migrateAllPhotos()
    .then(() => console.log('\n✨ Migration script completed'))
    .catch(error => console.error('💥 Migration script failed:', error));
}

module.exports = { migrateAllPhotos, migratePhoto };
