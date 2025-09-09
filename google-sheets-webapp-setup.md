# Google Sheets Web App Setup - Valokuvien haku ilman API keytä

## Ratkaisu: Google Apps Script Web App

Tämä mahdollistaa valokuvien hakemisen Google Sheetsistä ilman API keytä tai autentikointia.

## Vaihe 1: Luo Google Apps Script Web App

### 1.1 Luo uusi projekti
1. Mene osoitteeseen: https://script.new/
2. Kirjaudu Google-tilillesi
3. Uusi Google Apps Script projekti avautuu

### 1.2 Lisää koodi
Korvaa `Code.gs` tiedoston sisältö tällä:

```javascript
function doGet(e) {
  try {
    const id = e.parameter.spreadsheetId;
    const sheetName = e.parameter.sheetName || 'Kuvat';
    
    // Avaa spreadsheet ja hae data
    const sheet = SpreadsheetApp.openById(id).getSheetByName(sheetName);
    const values = sheet.getDataRange().getValues();
    
    // Palauta JSON-muodossa
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        values: values,
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        timestamp: new Date().toISOString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 1.3 Deploy Web App
1. **Deploy** → **New deployment**
2. **Type**: Web app
3. **Execute as**: Me (your email)
4. **Who has access**: Anyone (ei vaadi kirjautumista)
5. **Deploy**
6. **Authorize access** (salli käyttöoikeudet)
7. **Kopioi Web App URL** (esim. `https://script.google.com/macros/s/ABC123.../exec`)

## Vaihe 2: Testaa Web App

### Browser-testi:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?spreadsheetId=14i3QPYquqSqyE7fTp_pa2LNBq2Jb_re2rwsuUpRRSHo&sheetName=Kuvat
```

### Odotettu vastaus:
```json
{
  "success": true,
  "values": [
    ["ClientID", "URL", "Caption"],
    ["mom", "https://drive.google.com/...", "Petri nuorena"],
    ["mom", "https://photos.app.goo.gl/...", "Kesämökki"]
  ],
  "timestamp": "2025-09-09T15:00:00.000Z"
}
```

## Vaihe 3: Päivitä ReminderAPI

### Muuta ReminderAPI/index.js:
```javascript
// Google Sheets Web App configuration
const SHEETS_WEBAPP_URL = process.env.SHEETS_WEBAPP_URL || 'https://script.google.com/macros/s/YOUR_ID/exec';
const SHEETS_ID = '14i3QPYquqSqyE7fTp_pa2LNBq2Jb_re2rwsuUpRRSHo';
const PHOTOS_SHEET_NAME = 'Kuvat';

// Get daily photo - Web App version (no API key needed)
async function getDailyPhotoWebApp(clientID, context) {
  try {
    if (!SHEETS_WEBAPP_URL) {
      context.log('No Google Sheets Web App URL configured');
      return { url: '', caption: '' };
    }

    const url = `${SHEETS_WEBAPP_URL}?spreadsheetId=${SHEETS_ID}&sheetName=${PHOTOS_SHEET_NAME}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success || !data.values || data.values.length <= 1) {
      context.log('No photo data found in sheets');
      return { url: '', caption: '' };
    }

    // Find photos for this client (skip header row)
    const clientPhotos = data.values.slice(1).filter(row => 
      row[0] && row[0].toLowerCase() === clientID.toLowerCase()
    );

    if (clientPhotos.length === 0) {
      context.log(`No photos found for client: ${clientID}`);
      return { url: '', caption: '' };
    }

    // Select photo based on date
    const today = new Date();
    const photoIndex = today.getDate() % clientPhotos.length;
    const selectedPhoto = clientPhotos[photoIndex];

    const photoUrl = selectedPhoto[1] || '';
    const caption = selectedPhoto[2] || '';

    context.log(`Selected photo from Web App for ${clientID}: ${caption}`);
    return { url: photoUrl, caption: caption };

  } catch (error) {
    context.log.error('Error fetching photo from Web App:', error);
    return { url: '', caption: '' };
  }
}
```

## Vaihe 4: Konfiguroi Azure Function App

### Application Settings:
1. **Function App** → **Configuration** → **Application settings**
2. **Lisää uusi setting:**
   - **Name**: `SHEETS_WEBAPP_URL`
   - **Value**: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`
3. **Save** + **Restart Function App**

## Edut vs. API Key:

### Web App (suositus):
- ✅ Ei API keytä tarvita
- ✅ Ei CORS-ongelmia
- ✅ Ilmainen
- ✅ Yksinkertainen setup

### API Key:
- ❌ API key pitää hankkia Google Cloud Consolesta  
- ❌ Quota-rajoitukset
- ❌ Mahdolliset CORS-ongelmat
- ✅ Suorempi yhteys

## Troubleshooting:

### Jos Web App ei toimi:
1. Varmista että Google Sheet on jaettu "Anyone with link can view"
2. Tarkista että Web App on deployattu "Anyone" käyttöoikeuksilla
3. Kokeile Web App URL:ia suoraan browserissa
4. Katso Google Apps Script lokeja: **Executions** tab
