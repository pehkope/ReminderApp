# AnneliPBot Telegram Setup - Muistisovellus 📱

## 🎯 Tavoite
- Perheenjäsenet voivat lähettää kuvia ja viestejä äidille
- **VAIN sallitut henkilöt** voivat lähettää (whitelist)
- Viestit ja kuvat näkyvät PWA:ssa

---

## 1️⃣ Telegram Bot Token (AnneliPBot)

### A. Hanki Bot Token BotFather:ilta

Jos sinulla on jo AnneliPBot, hanki token:

```
1. Avaa Telegram ja etsi: @BotFather
2. Lähetä komento: /token
3. Valitse: @AnneliPBot
4. Kopioi Bot Token (esim: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz)
```

### B. Lisää Token Azure Function App:iin

#### Azure Portal:

1. **Avaa Function App**: `reminderapp-functions`
2. **Settings → Environment variables**
3. **+ Add** → Lisää seuraavat:

```
Name: TELEGRAM_BOT_TOKEN
Value: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

```
Name: TELEGRAM_ALLOWED_CHAT_IDS
Value: (jätä tyhjäksi toistaiseksi - täytetään vaiheessa 3)
```

4. **Apply** → **Confirm**
5. **Restart Function App**

---

## 2️⃣ Telegram Webhook Setup

### A. Aseta Webhook URL

Webhook URL = `https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/telegram/webhook`

#### PowerShell:

```powershell
# Korvaa <YOUR_BOT_TOKEN> oikealla tokenilla
$botToken = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
$webhookUrl = "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/telegram/webhook"

# Aseta webhook
Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/setWebhook?url=$webhookUrl"
```

#### Tai selaimessa:

```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/telegram/webhook
```

✅ **Onnistunut vastaus:**
```json
{
  "ok": true,
  "result": true,
  "description": "Webhook was set"
}
```

---

## 3️⃣ Hae Chat ID:t (Whitelisting)

### A. Jokainen perheenjäsen lähettää botin:

1. **Avaa Telegram**
2. **Etsi**: `@AnneliPBot`
3. **Lähetä komento**: `/start` tai `/id`
4. **Botti vastaa**: 
   ```
   Terve [nimi]! 👋
   
   Chat ID: 123456789
   Voit lähettää kuvia ja viestejä mom:lle.
   ```

### B. Kerää kaikki Chat ID:t

Esim:
- **Petri**: `123456789`
- **Liisa**: `987654321`
- **Matti**: `555444333`

### C. Lisää Chat ID:t Azure Function App:iin

#### Azure Portal:

1. **Function App** → **Environment variables**
2. **Muokkaa**: `TELEGRAM_ALLOWED_CHAT_IDS`
3. **Arvo** (pilkuilla erotettu lista):

```
123456789,987654321,555444333
```

4. **Apply** → **Confirm**
5. **Restart Function App**

---

## 4️⃣ Testaa Toiminta

### A. Lähetä kuva AnneliPBot:lle

```
1. Avaa Telegram
2. Etsi: @AnneliPBot
3. Lähetä kuva (voi lisätä kuvatekstin)
4. Botti vastaa: "✅ Kuva tallennettu! Näkyy seuraavassa päivityksessä."
```

### B. Lähetä viesti

```
1. Lähetä tekstiviesti botin (ilman kuvaa)
2. Botti vastaa: "✅ Viesti tallennettu! Näkyy äidin tabletilla."
```

### C. Tarkista PWA:ssa

- **Kuva**: Näkyy "Päivän kuva" -osiossa (päivittyy 15 min välein)
- **Viesti**: Näkyy "Viestit perheeltä" -osiossa

---

## 5️⃣ Mitä tapahtuu taustalla?

### Kun perheenjäsen lähettää kuvan:

1. ✅ Telegram lähettää webhook:in Azure Functions:iin
2. ✅ Tarkistetaan että Chat ID on whitelist:lla
3. ✅ Ladataan kuva Telegramista
4. ✅ Tallennetaan Azure Blob Storage:en (SAS-suojattu)
5. ✅ Lisätään metadata Cosmos DB:hen (`Photos` container):
   ```json
   {
     "id": "photo_telegram_xxx",
     "clientId": "mom",
     "blobUrl": "https://...",
     "caption": "Terveisiä mummolle!",
     "source": "telegram",
     "senderName": "Petri",
     "senderChatId": "123456789",
     "uploadedAt": "2025-10-01T14:30:00Z",
     "isActive": true
   }
   ```
6. ✅ PWA näyttää kuvan seuraavassa päivityksessä

### Kun perheenjäsen lähettää viestin:

1. ✅ Webhook → Azure Functions
2. ✅ Chat ID tarkistus
3. ✅ Tallennetaan Cosmos DB:hen (`Greetings` container):
   ```json
   {
     "id": "greeting_xxx",
     "clientId": "mom",
     "message": "Hei äiti! Miten päivä sujuu?",
     "senderName": "Liisa",
     "senderChatId": "987654321",
     "createdAt": "2025-10-01T14:35:00Z",
     "isRead": false
   }
   ```
4. ✅ PWA näyttää viestin "Viestit perheeltä" -osiossa

---

## 6️⃣ Turvallisuus 🔒

### ✅ Toteutetut suojaukset:

1. **Whitelist**: Vain sallitut Chat ID:t voivat lähettää
2. **SAS Tokens**: Blob Storage -kuvat suojattu 1h SAS-tokenilla
3. **Duplicate detection**: Sama viesti ei käsitellä kahteen kertaan
4. **Client ID extraction**: Voi lähettää eri asiakkaille tagilla `#client:john`
5. **CORS**: PWA:lla rajoitettu pääsy API:hin

### ⚠️ Jos joku muu yrittää lähettää:

```
Bot lähettää:
"⚠️ Sinulla ei ole oikeutta lähettää viestejä tähän bottiin.
Ota yhteyttä järjestelmänvalvojaan.

Sinun Chat ID: 111222333"
```

→ **Admin voi sitten lisätä Chat ID:n whitelist:iin**

---

## 7️⃣ Tarkista asetukset

### PowerShell:

```powershell
# Tarkista webhook status
$botToken = "YOUR_TOKEN_HERE"
Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/getWebhookInfo"
```

### Azure Function Logs:

```
Azure Portal → Function App → Log Stream

Etsi:
📨 Telegram webhook received
✅ Webhook processed successfully
📸 Processing photo from [nimi]
💬 Processing text message from [nimi]
```

---

## 8️⃣ Yleisimmät ongelmat

### ❌ "Telegram Bot not configured"

**Ratkaisu:**
- Tarkista että `TELEGRAM_BOT_TOKEN` on asetettu Function App:ssa
- Restart Function App

### ❌ "Unauthorized chat"

**Ratkaisu:**
- Lisää Chat ID `TELEGRAM_ALLOWED_CHAT_IDS`:iin
- Restart Function App
- Lähetä `/id` botille nähdäksesi Chat ID:n

### ❌ Webhook ei toimi

**Ratkaisu:**
1. Tarkista webhook URL:
   ```powershell
   Invoke-RestMethod -Uri "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```
2. Jos `pending_update_count` > 0, poista webhook ja aseta uudelleen:
   ```powershell
   # Poista webhook
   Invoke-RestMethod -Uri "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
   
   # Aseta uudelleen
   Invoke-RestMethod -Uri "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<WEBHOOK_URL>"
   ```

### ❌ Kuva ei näy PWA:ssa

**Ratkaisu:**
- Odota 15 min (PWA päivittyy automaattisesti)
- Tai päivitä selain
- Tarkista Cosmos DB (`Photos` container) että kuva on tallennettu

---

## 9️⃣ Käyttöohjeet perheelle

### 📱 Kuinka lähettää kuva äidille:

```
1. Avaa Telegram
2. Etsi: @AnneliPBot
3. Lähetä kuva
4. Voit lisätä kuvatekstin: "Terveisiä mökilta! ❤️"
5. Botti vahvistaa: "✅ Kuva tallennettu!"
6. Kuva näkyy äidin tabletilla 15 min sisällä
```

### 💬 Kuinka lähettää viesti:

```
1. Avaa Telegram
2. Etsi: @AnneliPBot
3. Lähetä tekstiviesti: "Hei äiti! Toivotamme ihanaa päivää! 💕"
4. Botti vahvistaa: "✅ Viesti tallennettu!"
5. Viesti näkyy äidin tabletilla heti
```

---

## 🎉 Valmista!

**AnneliPBot on nyt käytössä!** 

Perheenjäsenet voivat nyt lähettää:
- ✅ Kuvia muistoista
- ✅ Tervehdyksiä
- ✅ Kannustavia viestejä

→ **Kaikki näkyvät äidin PWA:ssa!** 💖

---

## 📝 Tiedostot

- **Koodi**: `ReminderApp.Functions/TelegramBotApi.cs`
- **Service**: `ReminderApp.Functions/Services/TelegramBotService.cs`
- **Webhook URL**: `/api/telegram/webhook`
- **Cosmos DB Containers**:
  - `Photos` (kuvat)
  - `Greetings` (viestit)

---

**Tarvitsetko apua?** 
1. Tarkista Function App lokit
2. Testaa webhook: `/api/telegram/webhook` (POST)
3. Tarkista Cosmos DB että data tallentuu


<!-- Deploy trigger: 2025-10-06 11.53.06 -->

<!-- Updated: 2025-10-06 12.39.55 -->
