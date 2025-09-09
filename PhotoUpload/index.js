const { BlobServiceClient } = require('@azure/storage-blob');
const { CosmosClient } = require('@azure/cosmos');
const multipart = require('parse-multipart-data');
const sharp = require('sharp'); // For image resizing (add to package.json)

// Configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const PHOTOS_CONTAINER_NAME = process.env.PHOTOS_CONTAINER_NAME || 'photos';
const THUMBNAILS_CONTAINER_NAME = process.env.THUMBNAILS_CONTAINER_NAME || 'thumbnails';
const COSMOS_CONNECTION_STRING = process.env.COSMOS_CONNECTION_STRING || '';
const DATABASE_ID = process.env.COSMOS_DATABASE || 'ReminderAppDB';

// Lazy clients
let blobServiceClient = null;
let cosmosClient = null;

function ensureBlobServiceClient() {
  if (blobServiceClient) return blobServiceClient;
  if (!AZURE_STORAGE_CONNECTION_STRING) return null;
  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    return blobServiceClient;
  } catch (e) {
    return null;
  }
}

function ensureCosmosClient() {
  if (cosmosClient) return cosmosClient;
  if (!COSMOS_CONNECTION_STRING) return null;
  try {
    cosmosClient = new CosmosClient(COSMOS_CONNECTION_STRING);
    return cosmosClient;
  } catch (e) {
    return null;
  }
}

// Generate unique filename
function generateFileName(clientId, originalName) {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop().toLowerCase();
  return `${clientId}/photo_${timestamp}.${extension}`;
}

// Upload image to blob storage
async function uploadToBlob(buffer, fileName, mimeType) {
  const blobService = ensureBlobServiceClient();
  if (!blobService) {
    throw new Error('Azure Storage not configured');
  }

  const containerClient = blobService.getContainerClient(PHOTOS_CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);

  const uploadOptions = {
    blobHTTPHeaders: {
      blobContentType: mimeType
    }
  };

  await blockBlobClient.upload(buffer, buffer.length, uploadOptions);
  return blockBlobClient.url;
}

// Create thumbnail
async function createThumbnail(buffer, fileName) {
  try {
    const thumbnailBuffer = await sharp(buffer)
      .resize(300, 300, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    const blobService = ensureBlobServiceClient();
    const containerClient = blobService.getContainerClient(THUMBNAILS_CONTAINER_NAME);
    const thumbFileName = fileName.replace(/\.[^/.]+$/, '_thumb.jpg');
    const blockBlobClient = containerClient.getBlockBlobClient(thumbFileName);

    await blockBlobClient.upload(thumbnailBuffer, thumbnailBuffer.length, {
      blobHTTPHeaders: { blobContentType: 'image/jpeg' }
    });

    return blockBlobClient.url;
  } catch (error) {
    console.warn('Thumbnail creation failed:', error.message);
    return null;
  }
}

// Save photo metadata to Cosmos DB
async function savePhotoMetadata(photoData) {
  const cosmos = ensureCosmosClient();
  if (!cosmos) return null;

  const database = cosmos.database(DATABASE_ID);
  const container = database.container('Photos');

  const { resource } = await container.items.create(photoData);
  return resource;
}

module.exports = async function (context, req) {
  try {
    context.log('PhotoUpload API called');

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      context.res = {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      };
      return;
    }

    // Validate storage configuration
    if (!AZURE_STORAGE_CONNECTION_STRING) {
      context.res = {
        status: 500,
        body: { 
          success: false, 
          error: 'Azure Storage not configured',
          timestamp: new Date().toISOString()
        }
      };
      return;
    }

    // Parse multipart form data
    const boundary = req.headers['content-type'].split('boundary=')[1];
    if (!boundary) {
      context.res = {
        status: 400,
        body: { 
          success: false, 
          error: 'Invalid multipart data',
          timestamp: new Date().toISOString()
        }
      };
      return;
    }

    const parts = multipart.parse(Buffer.from(req.body), boundary);
    
    // Extract form fields
    let clientId = null;
    let caption = '';
    let uploadSource = 'web_ui';
    let imageFile = null;

    for (const part of parts) {
      if (part.name === 'clientId') {
        clientId = part.data.toString();
      } else if (part.name === 'caption') {
        caption = part.data.toString();
      } else if (part.name === 'uploadSource') {
        uploadSource = part.data.toString();
      } else if (part.name === 'photo' && part.filename) {
        imageFile = {
          buffer: part.data,
          filename: part.filename,
          mimeType: part.type || 'image/jpeg'
        };
      }
    }

    // Validate required fields
    if (!clientId || !imageFile) {
      context.res = {
        status: 400,
        body: { 
          success: false, 
          error: 'Missing clientId or photo file',
          timestamp: new Date().toISOString()
        }
      };
      return;
    }

    // Validate image type
    if (!imageFile.mimeType.startsWith('image/')) {
      context.res = {
        status: 400,
        body: { 
          success: false, 
          error: 'File must be an image',
          timestamp: new Date().toISOString()
        }
      };
      return;
    }

    context.log(`Uploading photo for client: ${clientId}, size: ${imageFile.buffer.length} bytes`);

    // Generate filename
    const fileName = generateFileName(clientId, imageFile.filename);
    
    // Upload to blob storage
    const blobUrl = await uploadToBlob(imageFile.buffer, fileName, imageFile.mimeType);
    context.log(`Photo uploaded to: ${blobUrl}`);

    // Create thumbnail (optional, don't fail if it doesn't work)
    let thumbnailUrl = null;
    try {
      thumbnailUrl = await createThumbnail(imageFile.buffer, fileName);
      if (thumbnailUrl) {
        context.log(`Thumbnail created: ${thumbnailUrl}`);
      }
    } catch (thumbError) {
      context.log.warn('Thumbnail creation failed:', thumbError.message);
    }

    // Save metadata to Cosmos DB
    const photoMetadata = {
      id: `photo_${clientId}_${Date.now()}`,
      clientId: clientId,
      type: 'photo',
      fileName: fileName,
      blobUrl: blobUrl,
      thumbnailUrl: thumbnailUrl,
      caption: caption || `Uploaded photo`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'photo_upload_api',
      uploadSource: uploadSource,
      fileSize: imageFile.buffer.length,
      mimeType: imageFile.mimeType,
      isActive: true,
      tags: ['uploaded']
    };

    let savedMetadata = null;
    try {
      savedMetadata = await savePhotoMetadata(photoMetadata);
      context.log('Photo metadata saved to Cosmos DB');
    } catch (cosmosError) {
      context.log.warn('Failed to save metadata to Cosmos DB:', cosmosError.message);
    }

    // Success response
    context.res = {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: {
        success: true,
        message: 'Photo uploaded successfully',
        photo: {
          id: photoMetadata.id,
          clientId: clientId,
          blobUrl: blobUrl,
          thumbnailUrl: thumbnailUrl,
          caption: caption,
          fileName: fileName,
          fileSize: imageFile.buffer.length
        },
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    context.log.error('PhotoUpload error:', error);

    context.res = {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: {
        success: false,
        error: 'Photo upload failed',
        message: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
};
