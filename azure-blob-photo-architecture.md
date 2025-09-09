# ReminderApp - Yhtenäinen valokuva-arkkitehtuuri Azure Blob Storage

## 🎯 Tavoite: Skaalautuva ratkaisu kaikille asiakkaille

### Ongelma nykyisessä ratkaisussa:
- Äidin kuvat Google Drive:ssa
- Uusien asiakkaiden kuvat eri paikoissa  
- Ei yhtenäistä upload-mekanismia
- Telegram-integraatio puuttuu

## 🏗️ Uusi arkkitehtuuri: Azure Blob Storage

### 1. Storage Account rakenne:
```
reminderapp-photos (Storage Account)
├── photos (Container)
│   ├── mom/
│   │   ├── photo_001.jpg
│   │   ├── photo_002.jpg
│   │   └── ...
│   ├── client2/
│   │   ├── photo_001.jpg
│   │   └── ...
│   └── shared/
│       ├── placeholder.jpg
│       └── default-photos/
```

### 2. Cosmos DB Photos schema (päivitetty):
```json
{
  "id": "photo_mom_001",
  "clientId": "mom",
  "type": "photo",
  "fileName": "photo_001.jpg",
  "blobUrl": "https://reminderapp-photos.blob.core.windows.net/photos/mom/photo_001.jpg",
  "thumbnailUrl": "https://reminderapp-photos.blob.core.windows.net/photos/mom/thumbs/photo_001_thumb.jpg",
  "caption": "Äiti, Petri ja Tiitta euroopan kiertueella",
  "uploadedAt": "2025-09-09T13:00:00Z",
  "uploadedBy": "telegram_bot", // or "family_admin" or "manual"
  "uploadSource": "telegram", // or "web_ui" or "migration"
  "fileSize": 245760,
  "mimeType": "image/jpeg",
  "isActive": true,
  "tags": ["family", "travel", "memories"]
}
```

## 🚀 Upload-mekanismit:

### 1. Omaisten Web UI:
```javascript
// Family Admin App - Photo Upload
const uploadPhoto = async (file, clientId, caption) => {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('clientId', clientId);
  formData.append('caption', caption);
  
  const response = await fetch('/api/photos/upload', {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};
```

### 2. Telegram Bot:
```javascript
// Telegram Bot - Photo Handler
bot.on('photo', async (ctx) => {
  const clientId = getUserClientId(ctx.from.id); // Map Telegram user to client
  const photo = ctx.message.photo[ctx.message.photo.length - 1]; // Largest size
  const caption = ctx.message.caption || 'Telegram-kuva';
  
  // Download from Telegram
  const file = await ctx.telegram.getFile(photo.file_id);
  const photoBuffer = await downloadTelegramFile(file);
  
  // Upload to Azure Blob
  const blobUrl = await uploadToAzureBlob(photoBuffer, clientId, photo.file_id);
  
  // Save to Cosmos DB
  await savePhotoMetadata({
    clientId,
    blobUrl,
    caption,
    uploadSource: 'telegram'
  });
  
  ctx.reply(`✅ Kuva tallennettu! "${caption}"`);
});
```

### 3. Migration API (äidin Google Drive kuvat):
```javascript
// Migration endpoint - Move existing photos to Blob Storage
app.post('/api/photos/migrate', async (req, res) => {
  const { clientId, googleDriveUrls } = req.body;
  
  for (const gdUrl of googleDriveUrls) {
    // Download from Google Drive
    const imageBuffer = await downloadFromGoogleDrive(gdUrl);
    
    // Upload to Azure Blob
    const blobUrl = await uploadToAzureBlob(imageBuffer, clientId);
    
    // Update Cosmos DB
    await migratePhotoRecord(gdUrl, blobUrl);
  }
  
  res.json({ success: true, migrated: googleDriveUrls.length });
});
```

## 📸 ReminderAPI päivitettynä:

### Get daily photo (Blob Storage):
```javascript
async function getDailyPhoto(clientID, context) {
  try {
    // 1. Try Cosmos DB (Blob Storage URLs)
    const client = ensureCosmosClient();
    if (client) {
      const database = client.database(DATABASE_ID);
      const container = database.container('Photos');
      
      const querySpec = {
        query: "SELECT * FROM c WHERE c.clientId = @clientId AND c.isActive = true",
        parameters: [{ name: "@clientId", value: clientID }]
      };
      
      const { resources: photos } = await container.items.query(querySpec).fetchAll();
      
      if (photos && photos.length > 0) {
        const today = new Date();
        const photoIndex = today.getDate() % photos.length;
        const selectedPhoto = photos[photoIndex];
        
        context.log(`Selected photo from Blob Storage: ${selectedPhoto.caption}`);
        return { 
          url: selectedPhoto.blobUrl, // Azure Blob URL
          caption: selectedPhoto.caption 
        };
      }
    }
    
    // 2. Fallback to Google Sheets Web App (legacy)
    // ... existing fallback code ...
    
  } catch (error) {
    context.log.error('Error fetching photo:', error);
    return { url: '', caption: '' };
  }
}
```

## 💰 Kustannukset:

### Azure Blob Storage:
- **Hot tier**: ~€0.018/GB/kuukausi
- **Transaktiot**: ~€0.004/10,000 pyyntöä
- **Esimerkki**: 1GB kuvia = ~€0.25/kuukausi

### Edut vs. Google Drive:
- ✅ Yhtenäinen ratkaisu kaikille
- ✅ CDN-integraatio (nopeus)
- ✅ Telegram-tuki
- ✅ Omaisten upload-UI
- ✅ Skaalautuvuus
- ✅ Backup ja versioning

## 🛠️ Toteutussuunnitelma:

### Vaihe 1: Azure Blob Setup
1. Luo Storage Account: `reminderapphotos`
2. Luo Container: `photos`
3. Konfiguroi CORS web UI:lle
4. Setup CDN (valinnainen)

### Vaihe 2: Upload API
1. Azure Function: `PhotoUploadAPI`
2. Multipart file upload
3. Image resizing (thumbnails)
4. Cosmos DB metadata

### Vaihe 3: Telegram Bot
1. Bot registration
2. Photo handler
3. User → Client mapping
4. Auto-upload Blob Storageen

### Vaihe 4: Migration
1. Äidin Google Drive kuvat → Blob Storage
2. Päivitä Cosmos DB URL:it
3. Testaa PWA toimii

### Vaihe 5: Family Admin UI
1. Photo gallery
2. Upload interface  
3. Caption editing
4. Photo management

## 🎯 Lopputulos:

**Kaikilla asiakkailla sama järjestelmä:**
- Valokuvat Azure Blob Storagessa
- Metadata Cosmos DB:ssä  
- Upload Telegram botilla tai web UI:lla
- PWA näyttää kuvat Azure CDN:stä
- Skaalautuu helposti uusille asiakkaille
