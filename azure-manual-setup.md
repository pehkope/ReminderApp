# Azure Manual Setup Guide (No CLI Required)

## 🌐 Vaihtoehto 1: Azure Portal (Helppo tapa)

### 1. Luo Resource Group
1. Mene [Azure Portal](https://portal.azure.com)
2. Klikkaa "Resource groups" → "Create"
3. Täytä:
   - **Subscription**: Valitse subscriptionisi
   - **Resource group**: `ReminderAppRG`
   - **Region**: `North Europe`
4. Klikkaa "Review + create" → "Create"

### 2. Luo Cosmos DB
1. Portalissa: "Create a resource" → "Azure Cosmos DB"
2. Valitse "Core (SQL)" API
3. Täytä:
   - **Subscription**: Sama kuin yllä
   - **Resource Group**: `ReminderAppRG`
   - **Account Name**: `reminderapp-cosmos` (täytyy olla uniikki)
   - **Location**: `North Europe`
   - **Capacity mode**: `Provisioned throughput`
   - **Apply Free Tier Discount**: `Apply`
4. Klikkaa "Review + create" → "Create"

### 3. Luo Database ja Container
1. Mene juuri luotuun Cosmos DB accountiin
2. Klikkaa "Data Explorer" vasemmalta
3. Klikkaa "New Database"
   - **Database id**: `ReminderAppDB`
   - **Throughput**: `Manual` → `400` RU/s (free tier)
4. Klikkaa "New Container"
   - **Database**: `ReminderAppDB`
   - **Container id**: `Configurations`
   - **Partition key**: `/clientID`
   - **Throughput**: `Manual` → `400` RU/s

### 4. Luo Storage Account
1. Portalissa: "Create a resource" → "Storage account"
2. Täytä:
   - **Subscription**: Sama
   - **Resource Group**: `ReminderAppRG`
   - **Storage account name**: `reminderappstorage` (uniikki)
   - **Region**: `North Europe`
   - **Performance**: `Standard`
   - **Redundancy**: `Locally-redundant storage (LRS)`

### 5. Luo Function App
1. Portalissa: "Create a resource" → "Function App"
2. Täytä:
   - **Subscription**: Sama
   - **Resource Group**: `ReminderAppRG`
   - **Function App name**: `reminderapp-functions` (uniikki)
   - **Runtime stack**: `Node.js`
   - **Version**: `18 LTS`
   - **Region**: `North Europe`
   - **Operating System**: `Windows` (tai Linux)
   - **Plan type**: `Consumption (Serverless)`

### 6. Konfiguroi Function App
1. Mene Function Appiin
2. Klikkaa "Configuration" vasemmalta
3. Lisää seuraavat Application Settings:

| Name | Value | Kuvaus |
|------|-------|--------|
| `COSMOS_ENDPOINT` | Cosmos DB endpoint URL | Kopioi Cosmos DB:stä |
| `COSMOS_KEY` | Primary key | Kopioi Cosmos DB:stä |
| `COSMOS_DATABASE` | `ReminderAppDB` | Database nimi |
| `COSMOS_CONTAINER` | `Configurations` | Container nimi |
| `WEATHER_API_KEY` | Sinun OpenWeatherMap API key | Saa ilmaiseksi |
| `FUNCTIONS_WORKER_RUNTIME` | `node` | Runtime |

### 7. Deploy Koodi
1. Function Appissa klikkaa "Deployment Center"
2. Valitse "GitHub" tai "Local Git"
3. Pushaa tämä repository GitHubiin
4. Yhdistä GitHub repository
5. Klikkaa "Save" - deployment tapahtuu automaattisesti

---

## 🖥️ Vaihtoehto 2: PowerShell Script (Windows)

### Lataa ja aja tämä script:

```powershell
# Azure Setup Script
$resourceGroup = "ReminderAppRG"
$location = "North Europe"
$cosmosAccount = "reminderapp-cosmos"
$storageAccount = "reminderappstorage"
$functionApp = "reminderapp-functions"

# Login Azureen
az login

# Luo resource group
az group create --name $resourceGroup --location $location

# Luo Cosmos DB
az cosmosdb create `
  --name $cosmosAccount `
  --resource-group $resourceGroup `
  --locations regionName=$location failoverPriority=0 `
  --enable-free-tier true

# Luo database ja container
az cosmosdb sql database create `
  --account-name $cosmosAccount `
  --resource-group $resourceGroup `
  --name ReminderAppDB

az cosmosdb sql container create `
  --account-name $cosmosAccount `
  --resource-group $resourceGroup `
  --database-name ReminderAppDB `
  --name Configurations `
  --partition-key-path "/clientID"

# Luo storage account
az storage account create `
  --name $storageAccount `
  --location $location `
  --resource-group $resourceGroup `
  --sku Standard_LRS

# Luo function app
az functionapp create `
  --resource-group $resourceGroup `
  --consumption-plan-location $location `
  --runtime node `
  --runtime-version 18 `
  --functions-version 4 `
  --name $functionApp `
  --storage-account $storageAccount

Write-Host "Azure resources created successfully!"
Write-Host "Next: Configure environment variables in Function App"
```

### Aja script:
1. Tallenna yllä oleva koodi tiedostoon `setup-azure.ps1`
2. Avaa PowerShell administratorina
3. Navigoi kansioon ja aja:
   ```powershell
   .\setup-azure.ps1
   ```

---

## 🔧 Vaihtoehto 3: Manual Azure Functions Setup

Jos et halua käyttää Azure CLI:tä lainkaan:

### 1. Luo Azure Functions projekti manuaalisesti:
```bash
# Luo kansio
mkdir ReminderAppAzure
cd ReminderAppAzure

# Kopioi tiedostot
cp ../azure-functions-cosmos-config.js ./index.js
cp ../package-cosmos.json ./package.json
cp ../host.json ./host.json
cp ../local.settings.cosmos.json ./local.settings.json

# Asenna dependencies
npm install
```

### 2. Testaa paikallisesti:
```bash
npm start
# Testaa: http://localhost:7071/api/ReminderAPI?clientID=test
```

### 3. Deploy Azureen:
- Mene [Azure Portal](https://portal.azure.com)
- Luo Function App manuaalisesti
- Käytä "Deployment Center" → "Local Git"
- Pushaa koodi Azureen

---

## 📊 Tarkistuslista

- [ ] Azure subscription aktiivinen
- [ ] Resource Group luotu (`ReminderAppRG`)
- [ ] Cosmos DB account luotu
- [ ] Database `ReminderAppDB` luotu
- [ ] Container `Configurations` luotu (partition key: `/clientID`)
- [ ] Storage account luotu
- [ ] Function App luotu (Node.js 18)
- [ ] Environment variables konfiguroitu
- [ ] Koodi deployattu
- [ ] API testattu toimivaksi

---

## 🔑 Tarvittavat API Keys

### OpenWeatherMap API Key
1. Mene [OpenWeatherMap](https://openweathermap.org/api)
2. Rekisteröidy (ilmainen)
3. Luo API key
4. Lisää Function Appiin: `WEATHER_API_KEY`

### Google Sheets API (valinnainen)
1. Mene [Google Cloud Console](https://console.cloud.google.com)
2. Luo uusi projekti
3. Ota käyttöön Google Sheets API
4. Luo service account key
5. Lisää Function Appiin tarvittaessa

---

## 🚀 Seuraavat Askeleet

Kun kaikki on deployattu:

1. **Testaa API:**
   ```bash
   curl "https://reminderapp-functions.azurewebsites.net/api/ReminderAPI?clientID=test"
   ```

2. **Luo ensimmäinen asiakaskonfiguraatio:**
   ```bash
   curl -X POST "https://reminderapp-functions.azurewebsites.net/api/config/test-customer" \
     -H "Content-Type: application/json" \
     -d '{"settings": {"useWeather": true}, "weather": {"location": "Helsinki"}}'
   ```

3. **Päivitä PWA käyttämään uutta API:a**

**Olet valmis kaupalliseen deploymentiin!** 🎉
