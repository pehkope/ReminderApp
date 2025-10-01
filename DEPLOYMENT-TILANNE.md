# Azure Functions Deployment - Tilanne 2025-10-01

## 🎯 Tavoite
PWA näyttää datan Azure Functions API:sta CORS:n kanssa.

## ✅ Valmista

1. **CORS-koodi korjattu** (`ReminderApp.Functions/ReminderApi.cs`)
   - Ei aseteta `Access-Control-Allow-Origin: "null"` vaan jätetään pois jos origin ei sallittu
   - Allowlist: PWA production URL + localhost

2. **Azure Platform-level CORS** lisätty
   - Portal → Functions App → CORS
   - Lisätty: `https://lively-forest-0b274f703.1.azurestaticapps.net`
   
3. **.NET 9 päivitys**
   - Projekti päivitetty `net8.0` → `net9.0`
   - Vastaa Azure Portal runtime stackia

4. **Cosmos DB**
   - Toimii, sisältää mom-clientin datan
   - 26 kuvaa lisätty

5. **PWA**
   - Deployattu Azure Static Web Apps:iin
   - URL: `https://lively-forest-0b274f703.1.azurestaticapps.net`

## ❌ Ongelma: GitHub Actions deployment ei toimi

**Tilanne:**
- GitHub Actions buildaa koodin ✅
- GitHub Actions deployment "onnistuu" (ei virheitä) ✅
- **MUTTA:** Koodi ei päädy Function App:iin ❌

**Seuraus:**
- API palauttaa `404 Not Found`
- Log Stream näyttää vain "Ping Status: Running"
- Ei "Host started" viestiä
- Ei "Found the following functions" listaa
- Funktiot eivät lataudu

**Todiste CORS toimii:**
```
Log Stream:
CORS policy execution successful
The request has an origin header: 'https://lively-forest-0b274f703.1.azurestaticapps.net'
```

## 🔍 Mitä kokeiltiin

1. ✅ Anonymous authorization level
2. ✅ Platform CORS asetukset
3. ❌ `WEBSITE_RUN_FROM_PACKAGE=1` (ei auttanut, poistettu)
4. ❌ Manuaalinen ZIP deploy (ei toiminut)
5. ❌ Function App restart (useita kertoja)
6. ✅ .NET version match (8→9)

## 🛠️ Seuraavat vaihtoehdot

### Vaihtoehto A: Luo uusi Function App
**Työmäärä:** Keskisuuri  
**Onnistuminen:** Todennäköinen

1. Luo uusi Function App Portalissa
2. .NET 9 runtime
3. Konfiguroi GitHub Actions (uusi workflow tai päivitä nykyinen)
4. Deploy testaa toimiiko

### Vaihtoehto B: Debuggaa nykyinen deployment
**Työmäärä:** Korkea  
**Onnistuminen:** Epävarma

1. Tarkista GitHub Actions lokit tarkemmin
2. Kokeile Kudu Console → Deployment history
3. Kokeile `az functionapp deployment source config-zip` manuaalisesti
4. Tarkista App Settings (puuttuuko jotain?)

### Vaihtoehto C: Käytä vanhaa API:a väliaikaisesti
**Työmäärä:** Matala  
**Onnistuminen:** Jos vanha API toimii

Päivitä PWA:n `appsettings.Production.json` käyttämään vanhaa API-URL:ia.

## 📝 Tärkeät URL:t

- **Function App:** https://portal.azure.com/.../reminderapp-functions
- **PWA:** https://lively-forest-0b274f703.1.azurestaticapps.net
- **API URL (ei toimi):** https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI
- **GitHub Actions:** https://github.com/pehkope/ReminderApp/actions

## 🧪 Testaus

```powershell
# Testaa CORS
.\test-cors-final.ps1

# Testaa API suoraan
Invoke-WebRequest -Uri "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom"
```

---

**Viimeisin commit:** `f783b50` - "Update to .NET 9 to match Azure runtime"  
**Päivämäärä:** 2025-10-01  
**Status:** Deployment ei toimi, odottaa korjausta

