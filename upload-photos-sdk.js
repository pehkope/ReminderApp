// Upload photos using Cosmos DB SDK (simpler)
const { CosmosClient } = require('@azure/cosmos');

// Configuration - SET THESE FIRST!
const COSMOS_CONNECTION_STRING = process.env.COSMOS_CONNECTION_STRING || 'YOUR_CONNECTION_STRING_HERE';
const DATABASE_ID = 'ReminderAppDB';
const CONTAINER_ID = 'Photos';

// Mom's photos (first 10 of 26)
const momPhotos = [
  {
    "id": "photo_mom_001",
    "clientId": "mom", 
    "type": "photo",
    "url": "https://drive.google.com/thumbnail?id=1-C_GAzA6QP7UDIfDU2VgYxyd3ZcWwELw",
    "caption": "Äiti, Petri ja Tiitta euroopan kiertueella",
    "source": "google_sheets",
    "isActive": true,
    "uploadedAt": new Date().toISOString(),
    "uploadedBy": "sdk_import",
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
    "uploadedAt": new Date().toISOString(),
    "uploadedBy": "sdk_import",
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
    "uploadedAt": new Date().toISOString(),
    "uploadedBy": "sdk_import",
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
    "uploadedAt": new Date().toISOString(),
    "uploadedBy": "sdk_import",
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
    "uploadedAt": new Date().toISOString(),
    "uploadedBy": "sdk_import",
    "tags": ["family", "son", "memories"]
  }
];

async function uploadPhotosSDK() {
  try {
    console.log('🚀 Uploading photos using Cosmos DB SDK...');
    
    if (!COSMOS_CONNECTION_STRING || COSMOS_CONNECTION_STRING === 'YOUR_CONNECTION_STRING_HERE') {
      console.error('❌ Please set COSMOS_CONNECTION_STRING first!');
      console.log('💡 Get from: Azure Portal → Cosmos DB → Keys → Primary Connection String');
      console.log('💡 Or set environment variable: set COSMOS_CONNECTION_STRING="AccountEndpoint=..."');
      return;
    }
    
    const client = new CosmosClient(COSMOS_CONNECTION_STRING);
    const database = client.database(DATABASE_ID);
    const container = database.container(CONTAINER_ID);
    
    console.log(`📊 Uploading ${momPhotos.length} photos to ${DATABASE_ID}/${CONTAINER_ID}`);
    
    let successCount = 0;
    
    for (let i = 0; i < momPhotos.length; i++) {
      const photo = momPhotos[i];
      try {
        console.log(`\n📸 ${i + 1}/${momPhotos.length}: ${photo.caption}`);
        
        const { resource } = await container.items.create(photo);
        console.log(`✅ Created with id: ${resource.id}`);
        successCount++;
        
      } catch (error) {
        if (error.code === 409) {
          console.log(`⚠️  Photo already exists: ${photo.id}`);
        } else {
          console.error(`❌ Error: ${error.message}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`🎉 Upload complete! Successfully uploaded: ${successCount} photos`);
    console.log('');
    console.log('🔍 Test now:');
    console.log('GET https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom');
    console.log('');
    console.log('📸 Expected result:');
    console.log('- "storage": "cosmos"');
    console.log('- "dailyPhotoUrl": "https://drive.google.com/thumbnail?id=..."');
    console.log('- "dailyPhotoCaption": "Family photo description"');
    
  } catch (error) {
    console.error('💥 SDK upload failed:', error.message);
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Check your internet connection and Cosmos DB endpoint');
    } else if (error.message.includes('Unauthorized')) {
      console.log('💡 Check your Cosmos DB connection string and keys');
    } else if (error.message.includes('NotFound')) {
      console.log('💡 Make sure database "ReminderAppDB" and container "Photos" exist');
    }
  }
}

// Run
uploadPhotosSDK();
