# Lisää kuvat äidille (mom) - Azure Blob Storage

## 📸 **Ratkaisu: Azure Blob Storage + Cosmos DB**

Kuvat tallennetaan **Azure Blob Storageen** ja niiden metadata **Cosmos DB:hen**.

---

## 🚀 **Vaihe 1: Setup Azure Blob Storage**

### Azure Cloud Shell tai paikallinen PowerShell:

```powershell
./setup-blob-storage.ps1
```

Tämä:
- ✅ Luo Storage Account `reminderappph`
- ✅ Luo containerit `photos` ja `thumbnails`
- ✅ Lisää connection string Function App:iin
- ✅ Restartaa Function App:in

---

## 📤 **Vaihe 2: Lataa kuvat Azure Blob Storageen**

### Vaihtoehto A: Azure Portal (Helpoin)

1. **Azure Portal:** https://portal.azure.com
2. **Storage Account:** `reminderappph`
3. **Containers** → **photos**
4. **Upload**-nappi
5. Valitse kuvat (esim. `mom-photo-001.jpg`, `mom-photo-002.jpg`)
6. **Upload**

### Vaihtoehto B: Azure CLI

```bash
# Lataa yksittäinen kuva
az storage blob upload \
  --account-name reminderappph \
  --container-name photos \
  --name "mom/photo_001.jpg" \
  --file "./mom-photo-001.jpg" \
  --content-type "image/jpeg"
```

---

## 💾 **Vaihe 3: Lisää kuva-metadata Cosmos DB:hen**

Kun kuvat on Blob Storagessa, lisää niiden metadata Cosmos DB:hen:

### Azure Portal:

1. **Cosmos DB Account:** `reminderappdb`
2. **Database:** `ReminderAppDB`
3. **Container:** `Photos`
4. **New Item**

### Esimerkki JSON (kopioi ja muokkaa):

```json
{
  "id": "photo_mom_001",
  "clientId": "mom",
  "type": "photo",
  "fileName": "mom/photo_001.jpg",
  "blobUrl": "https://reminderappph.blob.core.windows.net/photos/mom/photo_001.jpg",
  "thumbnailUrl": "",
  "caption": "Äiti, Petri ja Tiitta Euroopan kiertueella",
  "uploadedAt": "2025-09-30T12:00:00Z",
  "uploadedBy": "manual",
  "uploadSource": "azure_portal",
  "fileSize": 245760,
  "mimeType": "image/jpeg",
  "isActive": true,
  "tags": ["family", "memories", "travel"]
}
```

**Muuta:**
- `id` → uniikki tunniste (esim. `photo_mom_002`)
- `blobUrl` → Blob Storage:sta saatu URL (oikea klikkaus kuvalla → Copy URL)
- `caption` → Kuvaus
- `uploadedAt` → Nykyinen päivämäärä ISO 8601 -muodossa

---

## 🧪 **Vaihe 4: Testaa että kuvat näkyvät API:ssa**

```powershell
Invoke-RestMethod -Uri "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?client=mom" | Select-Object clientID, dailyPhotoUrl, weeklyPhotos
```

Pitäisi näyttää:
```json
{
  "clientID": "mom",
  "dailyPhotoUrl": "https://reminderappph.blob.core.windows.net/photos/mom/photo_001.jpg",
  "weeklyPhotos": [...]
}
```

---

## 📱 **Tulevaisuudessa (kun kaikki toimii):**

- **Web UI:** Omaiset voivat ladata kuvia selaimesta
- **Telegram Bot:** Kuvat Telegramista suoraan Blob Storageen
- **Automaattinen thumbnail:** Pienennökset automaattisesti

---

## 🎯 **Quick Start (koko prosessi):**

```powershell
# 1. Setup Storage
./setup-blob-storage.ps1

# 2. Lataa kuvia Azure Portalissa (Storage Account → photos → Upload)

# 3. Lisää metadata Cosmos DB:hen (kopioi yllä oleva JSON, muokkaa, Save)

# 4. Testaa
Invoke-RestMethod -Uri "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?client=mom" | Select-Object dailyPhotoUrl
```

Valmis! 📸
