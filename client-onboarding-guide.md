# 🎯 Asiakkaan käyttöönotto - Google Drive + Sheets

## 📋 Vaiheet uudelle asiakkaalle:

### 1. **Perustiedot**
```
Asiakas: Maija Meikäläinen
ClientID: mom
Sähköpostit: maija@gmail.com, poika@gmail.com, tytär@gmail.com
Puhelin: +358501234567
```

### 2. **Google Apps Script setup**
- Kopioi `google-drive-integration.js` uuteen Apps Script projektiin
- Aja: `createCompleteClientSetup({clientId: "mom", displayName: "Maija Meikäläinen", familyEmails: ["maija@gmail.com", "poika@gmail.com"]})`
- Tallenna tuloksena saadut ID:t

### 3. **Perheelle ohjeet**

#### **Google Drive käyttö:**
1. **Kirjaudu** Google Drive:en (drive.google.com)
2. **Etsi kansio**: "ReminderApp_Maija_mom_2024"
3. **Lataa kuvia**:
   - `Photos/weekly_photos/` → Viikottaiset perhevalokuvat
   - `Photos/profile/` → Profiilikuva
   - `Photos/videos/` → Lyhyet videoterveiset

#### **Kuvatiedostojen nimeäminen:**
```
📸 Hyvät esimerkit:
✅ 2024-01-15_family_dinner.jpg
✅ 2024-01-22_grandchildren_visit.jpg
✅ 2024-01-29_garden_spring.jpg

❌ Vältä:
❌ IMG_001.jpg
❌ WhatsApp Image.jpg
❌ Screenshot.png
```

### 4. **Google Sheets käyttö**
1. **Avaa Sheet**: "ReminderApp_Maija_mom_2024"
2. **Välilehdet**:
   - `DailyTasks` → Päivittäiset tehtävät
   - `Contacts` → Yhteystiedot
   - `Config` → Asetukset
   - `Photos` → Kuva-asetukset

### 5. **Tablet setup**
```
Azure URL: https://lively-forest-0b274f703.1.azurestaticapps.net?clientID=mom
Bookmark nimellä: "Maijan muistuttaja"
Koko näyttö tilaan
```

## 🔐 Tietoturva checklist:

- ✅ Google Sheet: Vain perhe + palveluntarjoaja
- ✅ Google Drive: Vain perhe + palveluntarjoaja  
- ✅ Apps Script: Uniikki per asiakas
- ✅ API Key: Asiakaskohtainen
- ✅ Tablet: Vain oma data näkyy

## 📱 Jatkokehitys:

### **Mobile upload app** perheelle:
- QR-koodi → suora lataus Drive:en
- Kategorisointi (perhe/luonto/tapahtumat)
- Automaattinen geotagging
- Voice-to-text kuvaukset

### **Telegram bot integraatio**:
- Kuvien lähetys suoraan chatista
- Automaattiset kuvamuistutukset
- Perheenjäsenten välinen koordinointi