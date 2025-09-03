@echo off
REM Azure Functions Deployment Batch Script
REM Run this in Command Prompt as Administrator

echo === AZURE FUNCTIONS DEPLOYMENT ===
echo Location: Sweden Central
echo Resource Group: ReminderApp_RG
echo.

echo Step 1: Login to Azure...
az login
if %errorlevel% neq 0 (
    echo ERROR: Azure login failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Create Resource Group...
az group create --name ReminderApp_RG --location "Sweden Central"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create resource group!
    pause
    exit /b 1
)

echo.
echo Step 3: Create Cosmos DB Account...
az cosmosdb create --name reminderapp-cosmos --resource-group ReminderApp_RG --locations regionName="Sweden Central" failoverPriority=0 --enable-free-tier true
if %errorlevel% neq 0 (
    echo ERROR: Failed to create Cosmos DB!
    pause
    exit /b 1
)

echo.
echo Step 4: Create Database...
az cosmosdb sql database create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --name ReminderAppDB
if %errorlevel% neq 0 (
    echo ERROR: Failed to create database!
    pause
    exit /b 1
)

echo.
echo Step 5: Create Container...
az cosmosdb sql container create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --database-name ReminderAppDB --name Configurations --partition-key-path "/clientID"
if %errorlevel% neq 0 (
    echo ERROR: Failed to create container!
    pause
    exit /b 1
)

echo.
echo Step 6: Create Storage Account...
az storage account create --name reminderappstorage --location "Sweden Central" --resource-group ReminderApp_RG --sku Standard_LRS
if %errorlevel% neq 0 (
    echo ERROR: Failed to create storage account!
    pause
    exit /b 1
)

echo.
echo Step 7: Create Function App...
az functionapp create --resource-group ReminderApp_RG --consumption-plan-location "Sweden Central" --runtime node --runtime-version 18 --functions-version 4 --name reminderapp-functions --storage-account reminderappstorage
if %errorlevel% neq 0 (
    echo ERROR: Failed to create function app!
    pause
    exit /b 1
)

echo.
echo Step 8: Configure Environment Variables...

REM Get Cosmos DB connection details
for /f "delims=" %%i in ('az cosmosdb show --name reminderapp-cosmos --resource-group ReminderApp_RG --query documentEndpoint --output tsv') do set COSMOS_ENDPOINT=%%i
for /f "delims=" %%i in ('az cosmosdb keys list --name reminderapp-cosmos --resource-group ReminderApp_RG --query primaryMasterKey --output tsv') do set COSMOS_KEY=%%i

echo Cosmos DB Endpoint: %COSMOS_ENDPOINT%
echo Cosmos DB Key: [HIDDEN FOR SECURITY]

REM Set function app settings
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_ENDPOINT="%COSMOS_ENDPOINT%"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_KEY="%COSMOS_KEY%"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_DATABASE="ReminderAppDB"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_CONTAINER="Configurations"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting WEATHER_API_KEY="your-openweathermap-key"
az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting FUNCTIONS_WORKER_RUNTIME="node"

echo.
echo === DEPLOYMENT COMPLETE ===
echo.
echo ✅ Created:
echo   - Resource Group: ReminderApp_RG (Sweden Central)
echo   - Cosmos DB: reminderapp-cosmos
echo   - Database: ReminderAppDB
echo   - Container: Configurations (partitioned by clientID)
echo   - Storage: reminderappstorage
echo   - Function App: reminderapp-functions
echo.
echo === NEXT STEPS ===
echo 1. Copy azure-functions-cosmos-config.js to Function App
echo 2. Deploy: func azure functionapp publish reminderapp-functions
echo 3. Test: curl "https://reminderapp-functions.azurewebsites.net/api/ReminderAPI?clientID=test"
echo.
echo 🎉 Azure Functions infrastructure ready!
echo.
pause
