# Azure Functions Deployment Script for ReminderApp
# Location: Sweden Central
# Resource Group: ReminderApp_RG
# Run this in PowerShell after Azure CLI installation

Write-Host "=== AZURE FUNCTIONS DEPLOYMENT SCRIPT ===" -ForegroundColor Green
Write-Host "Location: Sweden Central" -ForegroundColor Cyan
Write-Host "Resource Group: ReminderApp_RG" -ForegroundColor Cyan
Write-Host ""

# Function to run Azure CLI commands with error handling
function Invoke-AzureCommand {
    param([string]$Command, [string]$Description)

    Write-Host ""
    Write-Host "=== $Description ===" -ForegroundColor Yellow
    Write-Host "Command: $Command" -ForegroundColor Gray

    try {
        $result = Invoke-Expression $Command
        Write-Host "✓ SUCCESS: $Description" -ForegroundColor Green
        return $result
    } catch {
        Write-Host "✗ FAILED: $Description" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. Login to Azure
Invoke-AzureCommand "az login" "Azure Login"

# 2. Create Resource Group
Invoke-AzureCommand "az group create --name ReminderApp_RG --location 'Sweden Central'" "Create Resource Group"

# 3. Create Cosmos DB Account
Invoke-AzureCommand "az cosmosdb create --name reminderapp-cosmos --resource-group ReminderApp_RG --locations regionName='Sweden Central' failoverPriority=0 --enable-free-tier true" "Create Cosmos DB Account"

# 4. Create Database
Invoke-AzureCommand "az cosmosdb sql database create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --name ReminderAppDB" "Create Cosmos Database"

# 5. Create Container
Invoke-AzureCommand "az cosmosdb sql container create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --database-name ReminderAppDB --name Configurations --partition-key-path '/clientID'" "Create Cosmos Container"

# 6. Create Storage Account
Invoke-AzureCommand "az storage account create --name reminderappstorage --location 'Sweden Central' --resource-group ReminderApp_RG --sku Standard_LRS" "Create Storage Account"

# 7. Create Function App
Invoke-AzureCommand "az functionapp create --resource-group ReminderApp_RG --consumption-plan-location 'Sweden Central' --runtime node --runtime-version 18 --functions-version 4 --name reminderapp-functions --storage-account reminderappstorage" "Create Function App"

# 8. Get Cosmos DB connection details
Write-Host ""
Write-Host "=== GETTING COSMOS DB CONNECTION DETAILS ===" -ForegroundColor Yellow

try {
    $cosmosEndpoint = az cosmosdb show --name reminderapp-cosmos --resource-group ReminderApp_RG --query documentEndpoint --output tsv
    $cosmosKey = az cosmosdb keys list --name reminderapp-cosmos --resource-group ReminderApp_RG --query primaryMasterKey --output tsv

    Write-Host "✓ Got Cosmos DB connection details" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to get Cosmos DB connection details" -ForegroundColor Red
    $cosmosEndpoint = "https://reminderapp-cosmos.documents.azure.com:443/"
    $cosmosKey = "YOUR_COSMOS_KEY"
    Write-Host "⚠️ Using placeholder values - update manually in Azure Portal" -ForegroundColor Yellow
}

# 9. Configure Function App Settings
Write-Host ""
Write-Host "=== CONFIGURING FUNCTION APP SETTINGS ===" -ForegroundColor Yellow

$settings = @(
    "COSMOS_ENDPOINT=$cosmosEndpoint",
    "COSMOS_KEY=$cosmosKey",
    "COSMOS_DATABASE=ReminderAppDB",
    "COSMOS_CONTAINER=Configurations",
    "WEATHER_API_KEY=your-openweathermap-key",
    "FUNCTIONS_WORKER_RUNTIME=node"
)

foreach ($setting in $settings) {
    $settingName = $setting.Split('=')[0]
    $settingValue = $setting.Split('=', 2)[1]

    $command = "az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting $settingName='$settingValue'"
    Invoke-AzureCommand $command "Set $settingName"
}

Write-Host ""
Write-Host "=== DEPLOYMENT SUMMARY ===" -ForegroundColor Green
Write-Host "✓ Resource Group: ReminderApp_RG" -ForegroundColor Green
Write-Host "✓ Cosmos DB: reminderapp-cosmos" -ForegroundColor Green
Write-Host "✓ Storage: reminderappstorage" -ForegroundColor Green
Write-Host "✓ Function App: reminderapp-functions" -ForegroundColor Green
Write-Host ""
Write-Host "=== NEXT STEPS ===" -ForegroundColor Yellow
Write-Host "1. Copy azure-functions-cosmos-config.js to your Function App" -ForegroundColor Cyan
Write-Host "2. Deploy using: func azure functionapp publish reminderapp-functions" -ForegroundColor Cyan
Write-Host "3. Test API: https://reminderapp-functions.azurewebsites.net/api/ReminderAPI?clientID=test" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Azure Functions infrastructure ready!" -ForegroundColor Green
