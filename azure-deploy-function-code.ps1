# Deploy Azure Function Code to Azure

Write-Host "=== DEPLOY AZURE FUNCTION CODE ===" -ForegroundColor Green
Write-Host "This will publish the ReminderApp function code to Azure" -ForegroundColor Yellow
Write-Host ""

# Step 1: Navigate to function directory (if exists)
Write-Host "# STEP 1: Check Function Directory" -ForegroundColor Cyan
Write-Host "Command: ls azure-functions-cosmos-config" -ForegroundColor White
Write-Host ""

# Step 2: Deploy using Azure Functions Core Tools
Write-Host "# STEP 2: Deploy Function Code" -ForegroundColor Cyan
Write-Host "Command: func azure functionapp publish reminderapp-functions" -ForegroundColor White
Write-Host ""

# Alternative: Use Azure CLI
Write-Host "# ALTERNATIVE: Use Azure CLI" -ForegroundColor Cyan
Write-Host "Command: az functionapp deployment source config-zip --resource-group ReminderApp_RG --name reminderapp-functions --src azure-functions-cosmos-config.zip" -ForegroundColor White
Write-Host ""

# Step 3: Check deployment
Write-Host "# STEP 3: Check Function App Status" -ForegroundColor Cyan
Write-Host "Command: az functionapp list --resource-group ReminderApp_RG --output table" -ForegroundColor White
Write-Host ""

# Step 4: Test the API
Write-Host "# STEP 4: Test the API" -ForegroundColor Cyan
Write-Host "Command: curl ""https://reminderapp-functions.azurewebsites.net/api/ReminderAPI?clientID=test""" -ForegroundColor White
Write-Host ""

Write-Host "=== QUICK DEPLOY COMMANDS ===" -ForegroundColor Green
Write-Host ""
Write-Host "# Copy and run these commands:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. func azure functionapp publish reminderapp-functions" -ForegroundColor White
Write-Host "2. az functionapp list --resource-group ReminderApp_RG --output table" -ForegroundColor White
Write-Host "3. curl ""https://reminderapp-functions.azurewebsites.net/api/ReminderAPI?clientID=test""" -ForegroundColor White
Write-Host ""
Write-Host "=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host "Your Azure Function is ready at: https://reminderapp-functions.azurewebsites.net" -ForegroundColor Yellow
