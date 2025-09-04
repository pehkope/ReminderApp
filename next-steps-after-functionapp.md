# Seuraavat vaiheet Function App:n luomisen jälkeen

## ✅ **Kun Function App on luotu:**

### 1. **Tarkista resurssit**

Suorita tämä PowerShellissä:
```powershell
az resource list --resource-group ReminderApp_RG --output table
```

Sinun pitäisi nähdä:
- ✅ `reminderapp-cosmos` (Cosmos DB)
- ✅ `reminderappstorage123` (Storage Account)
- ✅ `reminderapp-functions-hrhddjfeb0bpa0ee` (Function App)

### 2. **Hae Cosmos DB yhteydet**

```powershell
# Hae endpoint ja avain
$cosmosEndpoint = az cosmosdb show --name reminderapp-cosmos --resource-group ReminderApp_RG --query documentEndpoint --output tsv
$cosmosKey = az cosmosdb keys list --name reminderapp-cosmos --resource-group ReminderApp_RG --query primaryMasterKey --output tsv

# Näytä arvot
Write-Host "Cosmos Endpoint: $cosmosEndpoint"
Write-Host "Cosmos Key: $cosmosKey"
```

### 3. **Konfiguroi Function App**

```powershell
# Aseta Cosmos DB asetukset
az functionapp config appsettings set --name reminderapp-functions-hrhddjfeb0bpa0ee --resource-group ReminderApp_RG --setting COSMOS_ENDPOINT="$cosmosEndpoint"
az functionapp config appsettings set --name reminderapp-functions-hrhddjfeb0bpa0ee --resource-group ReminderApp_RG --setting COSMOS_KEY="$cosmosKey"
az functionapp config appsettings set --name reminderapp-functions-hrhddjfeb0bpa0ee --resource-group ReminderApp_RG --setting COSMOS_DATABASE="ReminderAppDB"
az functionapp config appsettings set --name reminderapp-functions-hrhddjfeb0bpa0ee --resource-group ReminderApp_RG --setting COSMOS_CONTAINER="Configurations"
az functionapp config appsettings set --name reminderapp-functions-hrhddjfeb0bpa0ee --resource-group ReminderApp_RG --setting FUNCTIONS_WORKER_RUNTIME="node"

# Lisää muut tarvittavat asetukset
az functionapp config appsettings set --name reminderapp-functions-hrhddjfeb0bpa0ee --resource-group ReminderApp_RG --setting WEATHER_API_KEY="your-openweathermap-key"
```

### 4. **Luo database ja container Cosmos DB:hen**

```powershell
# Luo database
az cosmosdb sql database create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --name ReminderAppDB

# Luo container
az cosmosdb sql container create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --database-name ReminderAppDB --name Configurations --partition-key-path "/clientID"
```

### 5. **Deployaa function koodi**

```powershell
# Asenna Azure Functions Core Tools jos ei ole
npm install -g azure-functions-core-tools@4 --unsafe-perm true

# Kirjaudu Azureen
az login

# Deployaa function
func azure functionapp publish reminderapp-functions-hrhddjfeb0bpa0ee
```

### 6. **Testaa API**

```powershell
# Testaa perus-API
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"

# Testaa konfiguraatio-API
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ConfigAPI?clientID=test"
```

---

## 🎯 **Vaihtoehtoinen tapa: Azure Portal kautta**

Voit tehdä myös seuraavat Azure Portalin kautta:

1. **Mene Function App:iin** `reminderapp-functions-hrhddjfeb0bpa0ee` → **Configuration**
2. **Lisää Application Settings:**
   - `COSMOS_ENDPOINT`: `[cosmos-endpoint]`
   - `COSMOS_KEY`: `[cosmos-key]`
   - `COSMOS_DATABASE`: `ReminderAppDB`
   - `COSMOS_CONTAINER`: `Configurations`
   - `FUNCTIONS_WORKER_RUNTIME`: `node`
   - `WEBSITE_NODE_DEFAULT_VERSION`: `~20`
   - `WEATHER_API_KEY`: `[your-weather-api-key]`

3. **Mene Cosmos DB:hen** → **Data Explorer**
4. **Luo database:** `ReminderAppDB`
5. **Luo container:** `Configurations` (partition key: `/clientID`)

---

## 📊 **Testaus**

Kun kaikki on valmis, testaa:

```powershell
# Function App URL
Write-Host "Function URL: https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net"

# Testaa API:t
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ConfigAPI?clientID=test"
```

---

## 🚨 **Jos kohtaat ongelmia:**

1. **Tarkista resurssien nimet**
2. **Varmista että olet oikeassa subscriptionissa**
3. **Tarkista Function App:n runtime version (Node.js 18)**

**Kerro kun Function App on luotu niin autan seuraavissa vaiheissa!** 🚀
