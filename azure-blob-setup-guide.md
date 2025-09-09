# Azure Blob Storage Setup - ReminderApp Photos

## 🎯 Tavoite: Yhtenäinen valokuva-tallennusratkaisu

### 1. Luo Storage Account

#### Azure Portal:
1. **Create a resource** → **Storage account**
2. **Täytä tiedot:**
   - **Subscription**: (sama kuin Function App)
   - **Resource Group**: `reminderapp-rg`
   - **Storage account name**: `reminderapphotos` (uniikki nimi)
   - **Region**: `Sweden Central` (sama kuin muut)
   - **Performance**: Standard
   - **Redundancy**: LRS (Locally-redundant storage)

3. **Advanced tab:**
   - **Secure transfer required**: Enabled
   - **Blob public access**: Enabled (tarvitaan PWA:lle)
   - **Minimum TLS version**: Version 1.2

4. **Review + Create**

### 2. Luo Containers

#### Photos Container:
1. **Storage Account** → **Containers** → **+ Container**
2. **Name**: `photos`
3. **Public access level**: `Blob (anonymous read access for blobs only)`
4. **Create**

#### Thumbnails Container (valinnainen):
1. **+ Container**
2. **Name**: `thumbnails`  
3. **Public access level**: `Blob`
4. **Create**

### 3. Konfiguroi CORS (Web UI upload varten)

#### Storage Account → Settings → Resource sharing (CORS):
```
Allowed origins: *
Allowed methods: GET, PUT, POST, DELETE, OPTIONS
Allowed headers: *
Exposed headers: *
Max age: 86400
```

### 4. Hanki Connection String

1. **Storage Account** → **Access keys**
2. **Kopioi "Connection string"** (key1)
3. **Tallenna muistiin** - tarvitaan Function App:ssa

### 5. Konfiguroi Function App

#### Application Settings:
1. **Function App** → **Configuration** → **Application settings**
2. **Lisää uudet asetukset:**

   - **Name**: `AZURE_STORAGE_CONNECTION_STRING`
   - **Value**: `[kopioimasi connection string]`
   
   - **Name**: `PHOTOS_CONTAINER_NAME`
   - **Value**: `photos`
   
   - **Name**: `THUMBNAILS_CONTAINER_NAME`  
   - **Value**: `thumbnails`

3. **Save** + **Restart Function App**

## 🧪 Testaa Storage

### Browser-testi (kun container luotu):
```
https://reminderapphotos.blob.core.windows.net/photos/
```

**Odotettu vastaus:** XML-lista (tyhjä jos ei tiedostoja)

### Storage Explorer (suositus):
1. Lataa **Azure Storage Explorer**
2. Connect → Storage account
3. Selaa containers ja tiedostot

## 📸 Folder Structure

```
photos/
├── mom/
│   ├── photo_001.jpg
│   ├── photo_002.jpg  
│   └── ...
├── client2/
│   ├── photo_001.jpg
│   └── ...
└── shared/
    ├── placeholder.jpg
    └── default/
```

## 🔧 Next Steps

1. **PhotoUpload Function** - multipart file upload
2. **Image resizing** - thumbnails
3. **Migration script** - Google Drive → Blob Storage
4. **Telegram bot** - photo upload
5. **Family UI** - web-based upload

## 💡 Tips

- **Naming**: `{clientId}/photo_{timestamp}.jpg`
- **Thumbnails**: `thumbnails/{clientId}/photo_{timestamp}_thumb.jpg`  
- **CDN**: Voidaan lisätä myöhemmin nopeutta varten
- **Backup**: Geo-redundant storage tuotannossa
