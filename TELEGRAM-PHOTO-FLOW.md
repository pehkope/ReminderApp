# 📸 Telegram Photo Flow - Sukulaiset → ReminderApp

## 🎯 **Ideasi toteutus:**
**Sukulaiset lähettävät kuvia ja tervehdyksiä Telegram Bot:ille → Kuvat tallennetaan → Näkyvät PWA:ssa**

---

## 🔄 **Kuvien käsittely Flow:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TELEGRAM PHOTO FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. 📱 SUKULAINEN LÄHETTÄÄ                                                  │
│     ├── Telegram Bot: @YourReminderBot                                     │
│     ├── Kuva + kuvateksti: "Terveisiä mummille! #client:mom"               │
│     └── Tunnistautuminen: Sallittu Chat ID                                 │
│                                                                             │
│  2. 🤖 TELEGRAM BOT VASTAANOTTAA                                            │
│     ├── Webhook: /api/telegram/webhook                                     │
│     ├── Tarkistaa: Chat ID sallittu?                                       │
│     ├── Parsii: Client ID (#client:mom)                                    │
│     └── Estää: Duplikaatti kuvat                                           │
│                                                                             │
│  3. ⬇️ KUVAN LATAUS                                                         │
│     ├── Telegram API: getFile + downloadFile                               │
│     ├── Valitsee: Suurin kuva (best quality)                               │
│     └── Muistissa: MemoryStream                                            │
│                                                                             │
│  4. ☁️ AZURE BLOB STORAGE                                                   │
│     ├── Upload: {clientId}/telegram_photo_{uniqueId}.jpg                   │
│     ├── Container: photos                                                  │
│     ├── URL: https://storage.blob.core.windows.net/photos/mom/...          │
│     └── Metadata: Sender, timestamp, caption                               │
│                                                                             │
│  5. 🗄️ COSMOS DB TALLETUS                                                  │
│     ├── Container: Photos                                                  │
│     ├── Document: Photo model                                              │
│     ├── Fields: id, clientId, blobUrl, caption, senderName                 │
│     └── Source: "telegram"                                                 │
│                                                                             │
│  6. ✅ VAHVISTUS LÄHETTÄJÄLLE                                               │
│     ├── Telegram: "✅ Kiitos kuvasta! Se näkyy nyt mom:n sovelluksessa"    │
│     └── Emoji: 📱❤️                                                        │
│                                                                             │
│  7. 📱 PWA NÄYTTÄÄ KUVAN                                                   │
│     ├── API: GET /api/ReminderAPI?clientID=mom                             │
│     ├── Hakee: Uusimmat Telegram kuvat                                     │
│     ├── Näyttää: DailyPhoto komponentissa                                  │
│     └── Rotaatio: Päivittäin vaihtuva kuva                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Tekniset yksityiskohdat:**

### **1. Telegram Bot Setup**
```bash
# Environment Variables
TELEGRAM_BOT_TOKEN=1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_ALLOWED_CHAT_IDS=123456789,987654321,555666777

# Webhook URL
https://reminderapp-functions.azurewebsites.net/api/telegram/webhook
```

### **2. Client ID Tunnistus**
```
Kuvateksti: "Terveisiä mummille! #client:mom"
           ↓
Regex: /#client:([a-zA-Z0-9_-]+)/
           ↓
Result: clientId = "mom"

Jos ei #client tagia → default: "mom"
```

### **3. Kuvan käsittely**
```csharp
// 1. Lataa Telegram API:sta
var fileInfo = await botClient.GetFileAsync(photo.FileId);
using var stream = new MemoryStream();
await botClient.DownloadFileAsync(fileInfo.FilePath, stream);

// 2. Generoi filename
var fileName = blobService.GenerateFileName(clientId, 
    $"telegram_photo_{photo.FileUniqueId}.jpg");

// 3. Upload Blob Storage
var blobUrl = await blobService.UploadPhotoAsync(stream, fileName);

// 4. Tallenna Cosmos DB
var photo = new Photo {
    Id = $"telegram_{photo.FileUniqueId}_{timestamp}",
    ClientId = clientId,
    BlobUrl = blobUrl,
    Source = "telegram",
    SenderName = senderName,
    Caption = caption
};
```

### **4. PWA Integraatio**
```csharp
// ReminderApi.cs - GetDailyPhoto metodissa
private async Task<Photo?> GetDailyPhoto(string clientId)
{
    // Hae Telegram kuvat
    var telegramPhotos = await cosmosDbService.QueryItemsAsync<Photo>(
        "Photos", 
        "SELECT * FROM c WHERE c.clientId = @clientId AND c.source = 'telegram' AND c.isActive = true ORDER BY c.createdAt DESC"
    );
    
    // Rotaatio: päivä % kuvien määrä
    if (telegramPhotos.Any()) {
        var dayIndex = DateTime.Now.Day % telegramPhotos.Count;
        return telegramPhotos[dayIndex];
    }
    
    // Fallback: Google Sheets kuvat
    return await googleSheetsService.GetFallbackPhotoAsync(clientId);
}
```

---

## 📱 **Käyttökokemus:**

### **👨‍👩‍👧‍👦 Sukulaisten näkökulma:**
1. **Helppo lähettää:** Vain kuva + viesti Telegram Bot:ille
2. **Selkeä vahvistus:** "✅ Kiitos kuvasta! Se näkyy nyt äidin sovelluksessa"
3. **Tunnistautuminen:** Chat ID lisätään sallittuihin (kertaluontoinen)
4. **Yksityisyys:** Vain sallitut ihmiset voivat lähettää

### **👵 Asiakkaan (mom) näkökulma:**
1. **Yllätys kuvat:** Päivittäin vaihtuvia kuvia sukulaisilta
2. **Henkilökohtaista:** "Kuva sukulaiselta: Liisa"
3. **Viestit mukana:** Kuvatekstit näkyvät
4. **Ei teknistä säätöä:** Kuvat vain ilmestyvät automaattisesti

---

## 🔐 **Turvallisuus:**

### **Chat ID Whitelist**
```bash
# Vain sallitut chat ID:t voivat lähettää
TELEGRAM_ALLOWED_CHAT_IDS=123456789,987654321

# Jos ei sallittu → lähetetään ohje:
"Hei! Tunnisteesi (chat ID) on 123456789. 
Pyydä ylläpitoa lisäämään se sallittuihin lähettäjiin. 🔐"
```

### **Duplikaattien esto**
```csharp
// File unique ID pohjainen deduplication
var duplicateKey = $"telegram_msg_{update.Id}_{messageId}";
if (await IsDuplicateMessage(duplicateKey)) {
    return new TelegramWebhookResponse { Success = true, Message = "Duplicate ignored" };
}
```

### **Client ID Validation**
```csharp
// Vain sallitut client ID:t
var allowedClients = ["mom", "dad", "test"];
if (!allowedClients.Contains(clientId)) {
    clientId = "mom"; // Default fallback
}
```

---

## 🚀 **Deployment & Setup:**

### **1. Telegram Bot luonti**
```bash
# 1. Keskustele @BotFather kanssa Telegramissa
/newbot
Bot Name: ReminderApp Family Bot
Bot Username: YourReminderBot

# 2. Saat bot tokenin
Token: 1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11

# 3. Aseta webhook
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url":"https://reminderapp-functions.azurewebsites.net/api/telegram/webhook"}'
```

### **2. Azure Functions Configuration**
```bash
# Azure Portal → Function App → Configuration
TELEGRAM_BOT_TOKEN = "1234567890:ABC-DEF..."
TELEGRAM_ALLOWED_CHAT_IDS = "123456789,987654321"
```

### **3. Testaus**
```bash
# 1. Lähetä kuva bot:ille
# 2. Tarkista Cosmos DB: Photos container
# 3. Tarkista Blob Storage: photos container
# 4. Testaa PWA: Näkyykö kuva?
```

---

## 📊 **API Endpointit:**

### **Telegram Webhook**
- **POST** `/api/telegram/webhook` - Vastaanottaa Telegram updates
- **GET** `/api/telegram/status` - Bot status ja konfiguraatio

### **Greetings Management**
- **GET** `/api/telegram/greetings/{clientId}` - Hae tekstiviestit
- **POST** `/api/telegram/greetings/{greetingId}/read` - Merkitse luetuksi

### **Photos Management**  
- **GET** `/api/telegram/photos/{clientId}` - Hae Telegram kuvat
- **POST** `/api/telegram/send` - Lähetä viesti (admin)

---

## 🎯 **Edut verrattuna nykyiseen:**

### **✅ Nykyinen (GAS):**
- ✅ Toimii perustoiminnot
- ✅ Google Drive integraatio
- ❌ Monimutkainen setup
- ❌ Ei skaalaudu hyvin
- ❌ Rajallinen kuvavarasto

### **🚀 Uusi (.NET + Azure):**
- ✅ Skaalautuva arkkitehtuuri
- ✅ Nopea kuvalataus (Blob Storage)
- ✅ Parempi deduplication
- ✅ Kattava admin API
- ✅ Cosmos DB hakuominaisuudet
- ✅ Automaattinen backup ja versiointi

---

## 📈 **Seuraavat parannukset:**

### **Lyhyellä aikavälillä:**
1. **Thumbnail generation** - Pikkukuvat nopeampaan lataukseen
2. **Image compression** - Optimointi tallennuskokoa varten
3. **Batch processing** - Useampi kuva kerralla
4. **Read receipts** - "Mom katsoi kuvaasi" -ilmoitukset

### **Pitkällä aikavälillä:**
1. **AI image tagging** - Automaattinen kuvien luokittelu
2. **Face recognition** - "Kuva Liisasta ja lapsista"
3. **Video support** - Lyhyet videot sukulaisilta
4. **Voice messages** - Äänitervehdykset

---

*Tämä flow mahdollistaa helpon ja turvallisen tavan sukulaisille jakaa kuvia ja viestejä, jotka ilmestyvät automaattisesti PWA:han päivittäin vaihtuvina kuvina.* 📸❤️
