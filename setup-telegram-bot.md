# 🤖 Telegram Bot Setup - ReminderApp

## 📋 **Vaiheet Telegram Bot:in käyttöönottoon:**

### **1. 🆕 Luo Telegram Bot**

#### **Keskustele @BotFather:n kanssa:**
```
1. Avaa Telegram
2. Etsi: @BotFather
3. Lähetä: /newbot
4. Anna bot nimi: "ReminderApp Family Bot"
5. Anna käyttäjänimi: "YourReminderBot" (tai mikä tahansa vapaa)
6. Tallenna TOKEN: 1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

#### **Aseta bot asetukset:**
```
/setdescription - "Lähettää kuvia ja viestejä ReminderApp:iin"
/setabouttext - "ReminderApp Family Bot - Jaa kuvia läheisillesi"
/setuserpic - (Lataa bot:in profiilikuva)
```

---

### **2. 🔐 Kerää Chat ID:t (Sallitut lähettäjät)**

#### **Jokainen sukulainen tekee:**
```
1. Etsi bot: @YourReminderBot
2. Lähetä: /start
3. Bot vastaa: "Terve! Chat ID: 123456789"
4. Tallenna Chat ID
```

#### **Tai käytä tätä linkkiä:**
`https://t.me/YourReminderBot?start=getchatid`

---

### **3. ⚙️ Konfiguroi Azure Functions**

#### **Azure Portal → Function App → Configuration:**
```bash
# Telegram Bot Token
TELEGRAM_BOT_TOKEN = "1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"

# Sallitut Chat ID:t (pilkulla erotettu)
TELEGRAM_ALLOWED_CHAT_IDS = "123456789,987654321,555666777"

# Azure Storage (jos ei jo asetettu)
AZURE_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=..."

# Cosmos DB (jos ei jo asetettu)  
COSMOS_CONNECTION_STRING = "AccountEndpoint=https://...;AccountKey=..."
```

---

### **4. 🔗 Aseta Webhook**

#### **Automaattinen tapa (suositeltu):**
```bash
# Kun Azure Functions on deployattu, webhook asetetaan automaattisesti
# URL: https://reminderapp-functions.azurewebsites.net/api/telegram/webhook
```

#### **Manuaalinen tapa:**
```bash
# Korvaa {TOKEN} oikealla bot tokenilla
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://reminderapp-functions.azurewebsites.net/api/telegram/webhook",
       "allowed_updates": ["message", "edited_message"],
       "drop_pending_updates": true
     }'
```

#### **Tarkista webhook status:**
```bash
curl "https://api.telegram.org/bot{TOKEN}/getWebhookInfo"
```

---

### **5. 🧪 Testaa järjestelmä**

#### **Vaihe 1: Lähetä testiviesti**
```
1. Avaa bot: @YourReminderBot
2. Lähetä: /start
3. Odota vastaus: "Terve [Nimi]! Chat ID: 123456789..."
```

#### **Vaihe 2: Lähetä testikuva**
```
1. Lähetä kuva bot:ille
2. Lisää kuvateksti: "Testikuva äidille! #client:mom"
3. Odota vastaus: "✅ Kiitos kuvasta! Se näkyy nyt mom:n sovelluksessa. 📱❤️"
```

#### **Vaihe 3: Tarkista PWA**
```
1. Avaa ReminderApp PWA
2. Tarkista näkyykö kuva päivän kuvana
3. Tarkista kuvateksti: "Kuva sukulaiselta: [Lähettäjän nimi]"
```

---

### **6. 📊 Seuranta ja hallinta**

#### **Telegram Bot status:**
```bash
# Tarkista bot status
GET https://reminderapp-functions.azurewebsites.net/api/telegram/status
```

#### **Hae asiakkaan kuvat:**
```bash
# Hae mom:n Telegram kuvat
GET https://reminderapp-functions.azurewebsites.net/api/telegram/photos/mom
```

#### **Hae asiakkaan viestit:**
```bash
# Hae mom:n tekstiviestit
GET https://reminderapp-functions.azurewebsites.net/api/telegram/greetings/mom
```

---

## 🚨 **Troubleshooting**

### **Bot ei vastaa:**
```bash
# 1. Tarkista token
curl "https://api.telegram.org/bot{TOKEN}/getMe"

# 2. Tarkista webhook
curl "https://api.telegram.org/bot{TOKEN}/getWebhookInfo"

# 3. Tarkista Azure Functions lokit
# Azure Portal → Function App → Functions → TelegramWebhook → Monitor
```

### **Chat ID ei ole sallittu:**
```
1. Bot lähettää: "Hei! Tunnisteesi (chat ID) on 123456789..."
2. Lisää Chat ID TELEGRAM_ALLOWED_CHAT_IDS ympäristömuuttujaan
3. Restart Azure Function App
```

### **Kuvat eivät näy PWA:ssa:**
```bash
# 1. Tarkista Cosmos DB Photos container
# 2. Tarkista Azure Blob Storage photos container  
# 3. Tarkista ReminderAPI palauttaako telegram kuvia
GET https://reminderapp-functions.azurewebsites.net/api/ReminderAPI?clientID=mom
```

### **Webhook virheet:**
```bash
# Nollaa webhook
curl -X POST "https://api.telegram.org/bot{TOKEN}/deleteWebhook?drop_pending_updates=true"

# Aseta uudelleen
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{"url":"https://reminderapp-functions.azurewebsites.net/api/telegram/webhook"}'
```

---

## 👥 **Käyttöohjeet sukulaisille**

### **Lähetä kuva:**
```
1. Etsi bot: @YourReminderBot
2. Lähetä kuva
3. Lisää kuvateksti: "Terveisiä äidille!"
4. Jos haluat lähettää toiselle: "Terveisiä isälle! #client:dad"
5. Odota vahvistus: "✅ Kiitos kuvasta!"
```

### **Lähetä tekstiviesti:**
```
1. Etsi bot: @YourReminderBot  
2. Kirjoita viesti: "Hei äiti! Toivottavasti voit hyvin. Rakkaudella, Liisa"
3. Jos toiselle asiakkaalle: "Hei isä! #client:dad Mukavaa päivää!"
4. Odota vahvistus: "✅ Viesti lähetetty mom:lle! 💌"
```

### **Komennot:**
```
/start - Aloita keskustelu ja hae Chat ID
/id - Hae Chat ID
/help - Näytä ohjeet
```

---

## 🔐 **Turvallisuus**

### **Chat ID Whitelist:**
- Vain sallitut Chat ID:t voivat lähettää kuvia/viestejä
- Uudet lähettäjät saavat ohjeen miten pyytää pääsyä
- Chat ID:t tallennetaan turvallisesti Azure Key Vault:iin (suositus)

### **Sisällön suodatus:**
- Vain kuvat ja tekstiviestit sallittu
- Tiedostot ja muut mediatyypit hylätään
- Duplikaattikuvat estetään automaattisesti

### **Client ID Validation:**
- Vain ennalta määritellyt client ID:t sallittu
- Tuntematon client ID → fallback "mom"
- Admin voi lisätä uusia client ID:itä

---

## 📈 **Käytön seuranta**

### **Metrics:**
- Vastaanotetut kuvat/päivä
- Aktiiviset lähettäjät  
- Virheet ja hylätyt viestit
- Tallennustilan käyttö

### **Loggaus:**
- Kaikki webhook kutsut lokitetaan
- Onnistuneet/epäonnistuneet kuvien tallennukset
- Chat ID yritykset (sallittu/hylätty)

---

**✅ Telegram Bot on nyt valmis vastaanottamaan kuvia ja viestejä sukulaisilta!** 📸❤️
