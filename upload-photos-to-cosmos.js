// Upload all mom's photos to Cosmos DB via API calls
const https = require('https');

// Configuration
const COSMOS_ENDPOINT = 'https://reminderapp-cosmos.documents.azure.com:443/';
const COSMOS_KEY = 'YOUR_COSMOS_PRIMARY_KEY'; // Get from Azure Portal
const DATABASE_ID = 'ReminderAppDB';
const CONTAINER_ID = 'Photos';

// Real mom photos from Google Sheets
const momPhotos = [
  {
    "id": "photo_mom_001",
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=1-C_GAzA6QP7UDIfDU2VgYxyd3ZcWwELw",
    "caption": "Äiti, Petri ja Tiitta euroopan kiertueella",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "automated_import",
    "tags": ["family", "travel", "memories"]
  },
  {
    "id": "photo_mom_002",
    "clientId": "mom",
    "type": "photo", 
    "url": "https://drive.google.com/thumbnail?id=13bnl5gdYaUzj591PulJJsORr28RK6AHu",
    "caption": "Joensuun mummi, Petri ja Tiitta",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "automated_import",
    "tags": ["family", "grandmother", "memories"]
  },
  {
    "id": "photo_mom_003",
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=1Dp2KrOUMGr1tR8zWBAUODDlY1uZ-bymL", 
    "caption": "Äiti ja Asta Kostamo Kilpisjärvellä",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "automated_import",
    "tags": ["family", "kilpisjarvi", "friends"]
  },
  {
    "id": "photo_mom_004",
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=1uiP0mA3WTJmEdQKu6Aor7ex0TUKhI4yN",
    "caption": "Pehkoset ja Kostamot Kilpisjärvellä",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "automated_import", 
    "tags": ["family", "kilpisjarvi", "friends"]
  },
  {
    "id": "photo_mom_005",
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=13yTXPhaFwsQhZAb7IvPG4msh7Us4B73W",
    "caption": "Petri",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "automated_import",
    "tags": ["family", "son", "memories"]
  },
  {
    "id": "photo_mom_006",
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=14zyxO39JwagjzsUDnEk4psrEfdtAIwTG",
    "caption": "Äiti, Petri ja Tiitta",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "automated_import",
    "tags": ["family", "children", "memories"]
  },
  {
    "id": "photo_mom_007",
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=1LFp6yUXtCrEbP2sGFUBSBbRrfJEujYxY",
    "caption": "Äiti, Petri ja Tiitta",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "automated_import",
    "tags": ["family", "children", "memories"]
  },
  {
    "id": "photo_mom_008",
    "clientId": "mom", 
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=1khLG2HcfgcUrJPkDdGSuu2i_6OTpcPiO",
    "caption": "Airi ja Petri",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "automated_import",
    "tags": ["family", "mother", "son"]
  },
  {
    "id": "photo_mom_009",
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=1dGWsX6Jn8oBdRGfVorY2B-hiGF4dZyM2",
    "caption": "Äiti, Petri, Tiitta ja Raili (lastenhoitaja / sukulainen)",
    "source": "google_sheets", 
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "automated_import",
    "tags": ["family", "caregiver", "memories"]
  },
  {
    "id": "photo_mom_010",
    "clientId": "mom",
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=1f61SLOOH7dxax7tiGq1iiXI9otOMP4mq",
    "caption": "Isä ja Tiitta",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": "2025-09-09T13:00:00Z",
    "uploadedBy": "automated_import",
    "tags": ["family", "father", "daughter"]
  }
];

// Generate auth header for Cosmos DB
function getAuthHeader(verb, resourceType, resourceId, date) {
  const crypto = require('crypto');
  
  const key = Buffer.from(COSMOS_KEY, 'base64');
  const text = `${verb.toLowerCase()}\n${resourceType.toLowerCase()}\n${resourceId}\n${date.toLowerCase()}\n\n`;
  
  const signature = crypto.createHmac('sha256', key).update(text).digest('base64');
  return `type=master&ver=1.0&sig=${signature}`;
}

// Upload single photo to Cosmos DB
async function uploadPhoto(photo) {
  return new Promise((resolve, reject) => {
    const date = new Date().toUTCString();
    const resourceId = `dbs/${DATABASE_ID}/colls/${CONTAINER_ID}`;
    const authHeader = getAuthHeader('POST', 'docs', resourceId, date);
    
    const options = {
      hostname: 'reminderapp-cosmos.documents.azure.com',
      port: 443,
      path: `/dbs/${DATABASE_ID}/colls/${CONTAINER_ID}/docs`,
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'x-ms-date': date,
        'x-ms-version': '2020-07-15',
        'Content-Type': 'application/json',
        'x-ms-documentdb-partitionkey': `["${photo.clientId}"]`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          console.log(`✅ Uploaded: ${photo.caption}`);
          resolve(JSON.parse(data));
        } else {
          console.error(`❌ Failed to upload ${photo.caption}: ${res.statusCode} ${data}`);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(photo));
    req.end();
  });
}

// Upload all photos
async function uploadAllPhotos() {
  console.log('🚀 Starting photo upload to Cosmos DB...');
  console.log(`📊 Total photos to upload: ${momPhotos.length}`);
  
  if (COSMOS_KEY === 'YOUR_COSMOS_PRIMARY_KEY') {
    console.error('❌ Please set COSMOS_KEY first!');
    console.log('💡 Get it from: Azure Portal → Cosmos DB → Keys → Primary Key');
    return;
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < momPhotos.length; i++) {
    const photo = momPhotos[i];
    try {
      console.log(`\n📸 Uploading ${i + 1}/${momPhotos.length}: ${photo.caption}`);
      await uploadPhoto(photo);
      successCount++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error uploading photo ${i + 1}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`🎉 Upload complete!`);
  console.log(`✅ Success: ${successCount} photos`);
  console.log(`❌ Errors: ${errorCount} photos`);
  console.log('');
  console.log('🔍 Next steps:');
  console.log('1. Test ReminderAPI: GET /api/ReminderAPI?clientID=mom');
  console.log('2. Should return: dailyPhotoUrl with Google Drive image');
  console.log('3. PWA should show mom\'s real family photos! 📷');
}

// Manual mode - print instructions
function printManualInstructions() {
  console.log('📋 MANUAL UPLOAD INSTRUCTIONS');
  console.log('='.repeat(60));
  console.log('If automated upload fails, copy-paste these to Azure Portal:');
  console.log('');
  console.log('Azure Portal → Cosmos DB → Data Explorer → Photos → New Item');
  console.log('');
  
  momPhotos.forEach((photo, index) => {
    console.log(`// Photo ${index + 1}: ${photo.caption}`);
    console.log(JSON.stringify(photo, null, 2));
    console.log('');
  });
}

// Run
if (process.argv.includes('--manual')) {
  printManualInstructions();
} else {
  uploadAllPhotos()
    .then(() => console.log('✨ All done!'))
    .catch(error => {
      console.error('💥 Upload failed:', error.message);
      console.log('\n💡 Try manual mode: node upload-photos-to-cosmos.js --manual');
    });
}
