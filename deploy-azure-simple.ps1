# Simple Azure Deployment Script
# Run in PowerShell as Administrator

Write-Host "=== SIMPLE AZURE DEPLOYMENT ===" -ForegroundColor Green
Write-Host "Location: Sweden Central" -ForegroundColor Cyan
Write-Host "Resource Group: ReminderApp_RG" -ForegroundColor Cyan
Write-Host ""

# One-liner deployment
Write-Host "Starting deployment..." -ForegroundColor Yellow

$command = @"
az login && az group create --name ReminderApp_RG --location "Sweden Central" && az cosmosdb create --name reminderapp-cosmos --resource-group ReminderApp_RG --locations regionName="Sweden Central" failoverPriority=0 --enable-free-tier true && az cosmosdb sql database create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --name ReminderAppDB && az cosmosdb sql container create --account-name reminderapp-cosmos --resource-group ReminderApp_RG --database-name ReminderAppDB --name Configurations --partition-key-path "/clientID" && az storage account create --name reminderappstorage --location "Sweden Central" --resource-group ReminderApp_RG --sku Standard_LRS && az functionapp create --resource-group ReminderApp_RG --consumption-plan-location "Sweden Central" --runtime node --runtime-version 18 --functions-version 4 --name reminderapp-functions --storage-account reminderappstorage
"@

Write-Host "Executing: $command" -ForegroundColor Gray
Write-Host ""

try {
    Invoke-Expression $command

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "=== SUCCESS ===" -ForegroundColor Green
        Write-Host "✅ Azure infrastructure created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "=== CONFIGURE ENVIRONMENT ===" -ForegroundColor Yellow

        # Get connection details
        $cosmosEndpoint = az cosmosdb show --name reminderapp-cosmos --resource-group ReminderApp_RG --query documentEndpoint --output tsv
        $cosmosKey = az cosmosdb keys list --name reminderapp-cosmos --resource-group ReminderApp_RG --query primaryMasterKey --output tsv

        Write-Host "Setting up Function App configuration..." -ForegroundColor Cyan

        # Configure settings
        az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_ENDPOINT="$cosmosEndpoint"
        az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_KEY="$cosmosKey"
        az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_DATABASE="ReminderAppDB"
        az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting COSMOS_CONTAINER="Configurations"
        az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting WEATHER_API_KEY="your-openweathermap-key"
        az functionapp config appsettings set --name reminderapp-functions --resource-group ReminderApp_RG --setting FUNCTIONS_WORKER_RUNTIME="node"

        Write-Host ""
        Write-Host "=== READY FOR CODE DEPLOYMENT ===" -ForegroundColor Green
        Write-Host "Run these commands next:" -ForegroundColor Cyan
        Write-Host "  func azure functionapp publish reminderapp-functions" -ForegroundColor White
        Write-Host "  curl 'https://reminderapp-functions.azurewebsites.net/api/ReminderAPI?clientID=test'" -ForegroundColor White
        Write-Host ""
        Write-Host "🎉 All set! Your Azure Functions are ready!" -ForegroundColor Green

    } else {
        Write-Host ""
        Write-Host "❌ DEPLOYMENT FAILED" -ForegroundColor Red
        Write-Host "Check the error messages above and try again" -ForegroundColor Yellow
    }

} catch {
    Write-Host ""
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure Azure CLI is installed and you're logged in" -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"
