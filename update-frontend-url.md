# 🔄 Frontend URL Päivitys

## Kun saat uuden Google Apps Script URL:n:

1. **Kopioi** uusi URL
2. **Päivitä** `ReminderPWA/wwwroot/appsettings.Production.json`:
   ```json
   "BaseUrl": "UUSI_URL_TÄHÄN"
   ```
3. **Päivitä** `ReminderPWA/wwwroot/index.html` title:
   ```html
   <title>🆕 REMINDERAPP v2.10 - FINAL CORS FIX 🆕</title>
   ```
4. **Commit & Push:**
   ```bash
   git add .
   git commit -m "v2.10: Päivitetty uuteen Google Apps Script URL:iin CORS korjauksineen"
   git push
   ```

## Tarkista että uudessa GAS:ssa on:
- ✅ CORS headers (`createCorsResponse_`)
- ✅ `doOptions` funktio
- ✅ `doPost` funktio 
- ✅ API key validation
- ✅ Kaikki uusimmat korjaukset

## Script Properties tarkistus:
**Google Apps Script Project Settings:**
- `VALID_API_KEYS` = `reminder-tablet-2024`
- `SHEET_ID_mom` = Google Sheets ID
- Muut tarvittavat avaimet...