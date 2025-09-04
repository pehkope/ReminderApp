# Azure Functions Deployment - Step by Step Commands for PowerShell
# Location: Sweden Central
# Resource Group: ReminderApp_RG

Write-Host "=== AZURE FUNCTIONS DEPLOYMENT COMMANDS ===" -ForegroundColor Green
Write-Host "Location: Sweden Central" -ForegroundColor Yellow
Write-Host "Resource Group: ReminderApp_RG" -ForegroundColor Yellow
Write-Host ""

# Step 1: Login to Azure
Write-Host "# STEP 1: Login to Azure" -ForegroundColor Cyan
Write-Host "Command: az login" -ForegroundColor White
Write-Host "Note: This will open browser for authentication" -ForegroundColor Gray
Write-Host ""

# Step 2: Create Resource Group
Write-Host "# STEP 2: Create Resource Group" -ForegroundColor Cyan
Write-Host "Command: az group create --name ReminderApp_RG --location ""Sweden Central""" -ForegroundColor White
Write-Host ""

# Step 3: Create Cosmos DB
Write-Host "# STEP 3: Create Cosmos DB Account" -ForegroundColor Cyan
Write-Host "Command: az cosmosdb create --name reminderapp-cosmos --resource-group ReminderApp_RG --locations regionName=""Sweden Central"" failoverPriority=0 --enable-free-tier true" -ForegroundColor White
Write-Host ""

# Step 4: Create Database
Write-Host "# STEP 4: Create Database" -ForegroundColor Cyan
Write-Host "Command: az cosmosdb sql database create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --name ReminderAppDB" -ForegroundColor White
Write-Host ""

# Step 5: Create Container
Write-Host "# STEP 5: Create Container" -ForegroundColor Cyan
Write-Host "Command: az cosmosdb sql container create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --database-name ReminderAppDB --name Configurations --partition-key-path ""/clientID""" -ForegroundColor White
Write-Host ""

# Step 6: Create Storage Account
Write-Host "# STEP 6: Create Storage Account" -ForegroundColor Cyan
Write-Host "Command: az storage account create --name reminderappstorage --location ""Sweden Central"" --resource-group ReminderApp_RG --sku Standard_LRS" -ForegroundColor White
Write-Host ""

# Step 7: Create Function App
Write-Host "# STEP 7: Create Function App" -ForegroundColor Cyan
Write-Host "Command: az functionapp create --resource-group ReminderApp_RG --consumption-plan-location ""Sweden Central"" --runtime node --runtime-version 18 --functions-version 4 --name reminderapp-functions --storage-account reminderappstorage" -ForegroundColor White
Write-Host ""

# Step 8: Get Cosmos DB connection details
Write-Host "# STEP 8: Get Cosmos DB connection details" -ForegroundColor Cyan
Write-Host "Command: `$cosmosEndpoint = az cosmosdb show --name reminderapp-cosmos --resource-group ReminderApp_RG --query documentEndpoint --output tsv" -ForegroundColor White
Write-Host "Command: `$cosmosKey = az cosmosdb keys list --name reminderapp-cosmos --resource-group ReminderApp_RG --query primaryMasterKey --output tsv" -ForegroundColor White
Write-Host ""

# Step 9: Configure Function App Settings
Write-Host "# STEP 9: Configure Function App Settings" -ForegroundColor Cyan
Write-Host "Command: az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_ENDPOINT=`"`$cosmosEndpoint`"" -ForegroundColor White
Write-Host "Command: az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_KEY=`"`$cosmosKey`"" -ForegroundColor White
Write-Host "Command: az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_DATABASE=""ReminderAppDB""" -ForegroundColor White
Write-Host "Command: az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_CONTAINER=""Configurations""" -ForegroundColor White
Write-Host "Command: az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting FUNCTIONS_WORKER_RUNTIME=""node""" -ForegroundColor White
Write-Host ""

# Step 10: Test the deployment
Write-Host "# STEP 10: Test the deployment" -ForegroundColor Cyan
Write-Host "Command: curl ""https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test""" -ForegroundColor White
Write-Host ""

Write-Host "=== QUICK COPY COMMANDS ===" -ForegroundColor Green
Write-Host ""
Write-Host "# Copy and run these commands one by one in PowerShell:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. az login" -ForegroundColor White
Write-Host "2. az group create --name ReminderApp_RG --location ""Sweden Central""" -ForegroundColor White
Write-Host "3. az cosmosdb create --name reminderapp-cosmos --resource-group ReminderApp_RG --locations regionName=""Sweden Central"" failoverPriority=0 --enable-free-tier true" -ForegroundColor White
Write-Host "4. az cosmosdb sql database create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --name ReminderAppDB" -ForegroundColor White
Write-Host "5. az cosmosdb sql container create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --database-name ReminderAppDB --name Configurations --partition-key-path ""/clientID""" -ForegroundColor White
Write-Host "6. az storage account create --name reminderappstorage123 --location ""Sweden Central"" --resource-group ReminderApp_RG --sku Standard_LRS" -ForegroundColor White
Write-Host "7. az functionapp create --resource-group ReminderApp_RG --consumption-plan-location ""Sweden Central"" --runtime node --runtime-version 20 --functions-version 4 --name reminderapp-functions --storage-account reminderappstorage123 --os-type Linux" -ForegroundColor White
Write-Host "8. `$cosmosEndpoint = az cosmosdb show --name reminderapp-cosmos --resource-group ReminderApp_RG --query documentEndpoint --output tsv" -ForegroundColor White
Write-Host "9. `$cosmosKey = az cosmosdb keys list --name reminderapp-cosmos --resource-group ReminderApp_RG --query primaryMasterKey --output tsv" -ForegroundColor White
Write-Host "10. az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_ENDPOINT=`"`$cosmosEndpoint`"" -ForegroundColor White
Write-Host "11. az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_KEY=`"`$cosmosKey`"" -ForegroundColor White
Write-Host "12. az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_DATABASE=""ReminderAppDB""" -ForegroundColor White
Write-Host "13. az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_CONTAINER=""Configurations""" -ForegroundColor White
Write-Host "14. az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting FUNCTIONS_WORKER_RUNTIME=""node""" -ForegroundColor White
Write-Host ""
Write-Host "=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host "Function URL: https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net" -ForegroundColor Yellow
