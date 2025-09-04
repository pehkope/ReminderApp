# Erilliset Azure Functions - Deployment

## ✅ **Luotu erilliset function tiedostot:**

### **1. `azure-functions-reminder.js`**
- **Toiminto:** Reminder API
- **Route:** `/api/ReminderAPI`
- **Methods:** GET, POST
- **Container:** `Reminders`

### **2. `azure-functions-config.js`**
- **Toiminto:** Configuration API
- **Route:** `/api/ConfigAPI`
- **Methods:** GET, POST, PUT
- **Container:** `Configurations`

---

## 📦 **Deployment vaiheet:**

### **Vaihe 1: Luo Cosmos DB containerit**

Ennen deploymentia tarvitset kaksi containeria:

```powershell
# Luodaan Reminders container
az cosmosdb sql container create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --database-name ReminderAppDB --name Reminders --partition-key-path "/clientID"

# Luodaan Configurations container
az cosmosdb sql container create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --database-name ReminderAppDB --name Configurations --partition-key-path "/clientID"
```

### **Vaihe 2: Päivitä Function App konfiguraatio**

Lisää nämä ympäristömuuttujat Function App:iin:

```
COSMOS_ENDPOINT = [cosmos-endpoint]
COSMOS_KEY = [cosmos-key]
COSMOS_DATABASE = ReminderAppDB
COSMOS_CONTAINER = Configurations  # Config API:lle
REMINDERS_CONTAINER = Reminders    # Reminder API:lle
FUNCTIONS_WORKER_RUNTIME = node
WEBSITE_NODE_DEFAULT_VERSION = ~20
```

### **Vaihe 3: Luo deployment ZIP**

```powershell
# Uudet tiedostot deploymentiin
Compress-Archive -Path "azure-functions-reminder.js","azure-functions-config.js","host.json","package.json","package-lock.json",".funcignore" -DestinationPath "deploy-separate.zip" -Force

# Tarkista sisältö
Get-ChildItem deploy-separate.zip
```

### **Vaihe 4: Deployaa Azureen**

**Azure Portaalista:**
1. Mene `reminderapp-functions` Function App:iin
2. **Deployment Center** → **Upload**
3. Valitse `deploy-separate.zip`
4. Klikkaa **Deploy**

**Tai CLI:llä:**
```powershell
az functionapp deployment source config-zip --resource-group ReminderApp_RG --name reminderapp-functions --src deploy-separate.zip
```

---

## 🔍 **Testaus:**

Kun deployment on valmis:

```powershell
# Testaa Reminder API
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"

# Testaa Config API
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ConfigAPI?clientID=test"
```

---

## 📊 **Function vertailu:**

| **Vanha (yksi tiedosto)** | **Uusi (erilliset tiedostot)** |
|---------------------------|-------------------------------|
| ❌ `azure-functions-cosmos-config.js` | ✅ `azure-functions-reminder.js` |
| ❌ Kaikki API:t samassa | ✅ `azure-functions-config.js` |
| ❌ 400+ riviä | ✅ ~100 riviä per function |
| ❌ Vaikea debugata | ✅ Helppo debugata |
| ❌ Ei skaalautuva | ✅ Skaalautuva |

---

## 🎯 **Edut erillisistä functioneista:**

### ✅ **Helpottaa ylläpitoa:**
- Jokainen function tekee yhden asian
- Helppo debugata ja testata
- Pienemmät tiedostot

### ✅ **Parempi skaalautuvuus:**
- Voidaan deployata functioneita erikseen
- Eri suorituskyky vaatimukset
- Riippumaton skaalaus

### ✅ **Parempi development:**
- Selkeämpi koodi rakenne
- Helppo lisätä uusia ominaisuuksia
- Parempi testattavuus

---

## 🚀 **Seuraavat vaiheet:**

1. ✅ Luo Cosmos DB containerit
2. ✅ Päivitä Function App konfiguraatio
3. ✅ Luo uusi deployment ZIP
4. ✅ Deployaa Azureen
5. ✅ Testaa molemmat API:t

**Aloita containerien luomisesta!** 🎯

**Kun deployment on valmis, sinulla on kaksi erillistä, hyvin organisoitua Azure Functionia!** 🚀

**Mitä seuraavaksi haluat tehdä näillä erillisillä functioneilla?** 🤔
