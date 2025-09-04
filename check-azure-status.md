# Tarkista Azure Functions tilanne

## 🚨 **404 Virhe - Function App ei löydy**

### 🔍 **Tarkistusvaihtoehdot:**

#### **Vaihtoehto 1: Azure Portal (Helpoin)**
1. Mene **[Azure Portal](https://portal.azure.com)**
2. Etsi `ReminderApp_RG` resource group
3. Katso onko `reminderapp-functions` Function App olemassa
4. Jos ei ole olemassa → luo uudelleen

#### **Vaihtoehto 2: Azure Cloud Shell**
1. Mene Azure Portal
2. Klikkaa **Cloud Shell** (oikea yläkulma)
3. Valitse **PowerShell**
4. Suorita:

```powershell
# Tarkista resurssit
az resource list --resource-group ReminderApp_RG --output table

# Tarkista Function App:t
az functionapp list --resource-group ReminderApp_RG --output table
```

#### **Vaihtoehto 3: Browser test**
Testaa nämä URL:t selaimella:

```
# Pääsivu (pitäisi olla 404 jos function ei ole)
https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/

# API test (pitäisi olla 404 jos function ei ole)
https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test
```

---

## ✅ **Jos Function App löytyy:**

### **Tarkista tila:**
- **State:** pitäisi olla `Running`
- **Status:** pitäisi olla terve

### **Jos tila on Stopped:**
```powershell
az functionapp start --name reminderapp-functions --resource-group ReminderApp_RG
```

---

## ❌ **Jos Function App EI löydy:**

### **Luo uudelleen:**

```powershell
# Luo Function App uudelleen
az functionapp create --resource-group ReminderApp_RG --consumption-plan-location "Sweden Central" --runtime node --runtime-version 20 --functions-version 4 --name reminderapp-functions --storage-account reminderappstorage123 --os-type Linux

# Konfiguroi Cosmos DB
$cosmosEndpoint = az cosmosdb show --name reminderapp-cosmos --resource-group ReminderApp_RG --query documentEndpoint --output tsv
$cosmosKey = az cosmosdb keys list --name reminderapp-cosmos --resource-group ReminderApp_RG --query primaryMasterKey --output tsv

az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_ENDPOINT="$cosmosEndpoint"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_KEY="$cosmosKey"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_DATABASE="ReminderAppDB"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_CONTAINER="Configurations"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting FUNCTIONS_WORKER_RUNTIME="node"
```

### **Deployaa koodi:**

```powershell
# Asenna dependencies
npm ci --only=production

# Luo deployment paketti
Compress-Archive -Path "azure-functions-cosmos-config.js","host.json","package.json","package-lock.json",".funcignore" -DestinationPath "deploy.zip" -Force

# Deployaa
az functionapp deployment source config-zip --resource-group ReminderApp_RG --name reminderapp-functions --src deploy.zip
```

---

## 🔍 **Todennäköiset syyt 404 virheelle:**

1. ✅ **Function App poistettu** - yleisin syy
2. ✅ **Resource group poistettu** - kaikki resurssit mukana
3. ✅ **Deployment epäonnistui** - function ei aktivoitunut
4. ✅ **Function App pysäytetty** - voidaan käynnistää uudelleen

---

## 🎯 **Seuraavat vaiheet:**

1. **Tarkista Azure Portal** - onko Function App olemassa?
2. **Jos löytyy:** tarkista onko `Running` tila
3. **Jos ei löydy:** luo uudelleen yllä olevilla komennoilla
4. **Testaa uudelleen** deployment jälkeen

**Aloita Azure Portal tarkistuksella - se on nopein tapa nähdä tilanne!** 🎯

**Onko Function App näkyvissä Azure Portaalissa?** 🤔
