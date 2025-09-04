# Varmista Azure Functions deployment

## ✅ **Vaihtoehtoiset tavat varmistaa deployment:**

### **Tapa 1: Azure Portal (Helpoin)**

1. **Mene Azure Portal:** [portal.azure.com](https://portal.azure.com)
2. **Etsi:** `reminderapp-functions`
3. **Klikkaa Function App:iin**
4. **Vasemmalla valikko:** `Functions`

**Sinun pitäisi nähdä:**
- ✅ `ReminderAPI` function
- ✅ `ConfigAPI` function
- ✅ Status: Enabled

### **Tapa 2: Testaa selaimella**

Avaa selain ja mene suoraan URL:iin:

```
https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test
```

**Odotetut tulokset:**
- ✅ **HTTP 200** + JSON response = Toimii!
- ⚠️ **HTTP 404** = Function ei löydy
- ❌ **HTTP 500** = Virhe functionissa

### **Tapa 3: Azure Cloud Shell**

**Jos Windows Terminal ei toimi:**

1. **Azure Portal** → **Cloud Shell** (oikea yläkulma)
2. **Valitse PowerShell**
3. **Suorita:**

```powershell
# Tarkista functionit
az functionapp function list --resource-group ReminderApp_RG --name reminderapp-functions --output table

# Testaa API
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"
```

### **Tapa 4: Command Prompt**

**Vaihtoehtoisesti Command Prompt:**

```cmd
# Testaa API
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"
```

---

## 🔍 **Jos functionit eivät näy:**

### **Uudelleen-deployment:**

```powershell
# Windows Terminalissa
cd "C:\Users\ppehkonen\source\repos\ReminderApp"

# Asenna dependencies
npm ci --only=production

# Luo uusi deployment zip
Compress-Archive -Path "azure-functions-cosmos-config.js","host.json","package.json","package-lock.json",".funcignore" -DestinationPath "deploy-new.zip" -Force

# Deployaa uudelleen
az functionapp deployment source config-zip --resource-group ReminderApp_RG --name reminderapp-functions --src deploy-new.zip
```

### **Tarkista deployment status:**

```powershell
az functionapp show --resource-group ReminderApp_RG --name reminderapp-functions --query "{name:name, state:state, lastModified:lastModifiedTime}" -o table
```

---

## 📊 **Deployment status tarkistus:**

| Tila | Merkitys | Toimenpide |
|------|----------|------------|
| ✅ Running | Function App toimii | Testaa API |
| ⚠️ Starting | Käynnistymässä | Odota 2-3 min |
| ❌ Failed | Deployment epäonnistui | Katso lokit |

---

## 🎯 **Seuraavat vaiheet:**

1. **Tarkista Azure Portal** - näetkö functionit?
2. **Testaa selaimella** - saatko HTTP 200?
3. **Jos ei toimi:** Uudelleen-deployment

**Aloita Azure Portal tarkistuksella!** 🎯

Siellä näet varmasti onko deployment onnistunut. 🤞
