# Azure Functions Deployment - Päivitetyt ohjeet (Node.js 20)

## ✅ **Päivitetyt parametrit:**

### **Function App:n luonti:**

**Azure Portal:**
- **Function App name:** `reminderapp-functions`
- **Runtime stack:** `Node.js`
- **Version:** `20 LTS` (ei 18!)
- **Operating System:** `Linux`
- **Region:** `Sweden Central`
- **Storage account:** `reminderappstorage123`

**CLI-komento (päivitetty):**
```powershell
az functionapp create --resource-group ReminderApp_RG --consumption-plan-location "Sweden Central" --runtime node --runtime-version 20 --functions-version 4 --name reminderapp-functions --storage-account reminderappstorage123 --os-type Linux
```

---

## 📦 **Projektin päivitys:**

**package.json päivitys:**
```json
{
  "name": "reminderapp-functions",
  "version": "1.0.0",
  "description": "Azure Functions for ReminderApp",
  "main": "src/functions/*.js",
  "scripts": {
    "start": "func start",
    "test": "echo \"No tests yet\""
  },
  "dependencies": {
    "@azure/functions": "^4.0.0",
    "@azure/cosmos": "^4.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

---

## 🔧 **Konfigurointi komennot:**

```powershell
# Function App asetukset
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting FUNCTIONS_WORKER_RUNTIME="node"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting WEBSITE_NODE_DEFAULT_VERSION="~20"

# Cosmos DB asetukset
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_ENDPOINT="$cosmosEndpoint"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_KEY="$cosmosKey"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_DATABASE="ReminderAppDB"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_CONTAINER="Configurations"
```

---

## 🎯 **Node.js 20 vs 22:**

### **Suositus: Node.js 20 LTS**
- ✅ **LTS (Long Term Support)** - vakaa ja turvallinen
- ✅ **Parempi yhteensopivuus** olemassaolevan koodin kanssa
- ✅ **Laajemmin testattu** Azuressa
- ✅ **Pidempi tuki** (joulukuu 2026 asti)

### **Node.js 22:**
- ⚠️ **Current** - uusin mutta ei LTS
- ⚠️ **Lyhyempi tuki** (huhtikuu 2025 asti)
- ⚠️ **Voi sisältää bugeja** - vähemmän testattu

---

## 🚀 **Jatka seuraavasti:**

1. **Luo Function App Node.js 20:lla**
2. **Tarkista resurssit:**
   ```powershell
   az resource list --resource-group ReminderApp_RG --output table
   ```
3. **Konfiguroi Cosmos DB yhteydet**
4. **Deployaa koodi**

**Käytä Node.js 20 LTS - se on turvallisin valinta!** 🛡️

Kun Function App on luotu, kerro minulle niin jatkan seuraaviin vaiheisiin! 🎯
