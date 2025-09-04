# Ratkaisu 800MB+ Deployment Ongelmaan

## 🚨 **Miksi deployment on 813MB?**

Koska koko projekti yritetään deployata mukaanlukien:
- ❌ `ReminderPWA/` kansio (Blazor/PWA app)
- ❌ `ReminderTabletAndroid/` kansio (Android projekti)
- ❌ `GasProxyFunctions/` kansio (.NET projektit)
- ❌ Kaikki debug-tiedostot (40+ debug-*.html)
- ❌ Kaikki dokumentaatio (.md tiedostot)
- ❌ `node_modules/` (jos generoitu)

## ✅ **Ratkaisu: .funcignore tiedosto**

Olen luonut `.funcignore` tiedoston joka sulkee pois kaikki tarpeettomat tiedostot.

**Deployment paketti pitäisi nyt olla vain ~5-10 MB!**

## 🛑 **Keskeytä nykyinen deployment:**

### **Vaihtoehto 1: Odota että se epäonnistuu**
- Nykyinen deployment todennäköisesti epäonnistuu koska paketti on liian suuri
- Azure Functions deployment raja on yleensä ~100MB

### **Vaihtoehto 2: Keskeytä manuaalisesti**
```powershell
# Etsi ja tapa deployment prosessi
Get-Process -Name "func" | Stop-Process -Force
Get-Process -Name "az" | Stop-Process -Force
```

## 🚀 **Aloita oikea deployment:**

### **Helppo tapa:**
```powershell
# Suorita uusi clean deployment
.\deploy-clean.ps1
```

### **Manuaalinen tapa:**
```powershell
# 1. Asenna vain production dependencies
npm ci --only=production

# 2. Deployaa oikea tapa
az functionapp deployment source config-zip --resource-group ReminderApp_RG --name reminderapp-functions --src deploy.zip
```

## 📁 **Mitä tiedostoja deployment sisältää:**

✅ **Pakettiin sisältyy vain:**
- `azure-functions-cosmos-config.js` - Pää function koodi
- `host.json` - Azure Functions konfiguraatio
- `package.json` - Dependencies
- `package-lock.json` - Dependency lukot
- `.funcignore` - Ignore sääntöjä

❌ **Paketista jätetään pois:**
- Kaikki projekti kansiot (PWA, Android, GAS, etc.)
- Kaikki debug tiedostot
- Kaikki dokumentaatio
- Development tiedostot

## 🔍 **Tarkista deployment status:**

```powershell
# Katso Function App deployment lokit
az functionapp deployment list-publishing-profiles --resource-group ReminderApp_RG --name reminderapp-functions

# Tai Azure Portalin kautta:
# Function App → Deployment Center → Logs
```

## 🧪 **Testaa kun deployment on valmis:**

```powershell
# Testaa API
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"

# Testaa konfiguraatio API
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ConfigAPI?clientID=test"
```

## 📊 **Odotettu tulos:**

- **Vanha deployment:** ❌ 813MB → epäonnistuu
- **Uusi deployment:** ✅ ~5-10MB → onnistuu

**Kokeile uutta clean deployment skriptiä!** 🎯

`.funcignore` tiedosto ratkaisee ongelman sulkemalla pois kaikki tarpeettomat tiedostot.
