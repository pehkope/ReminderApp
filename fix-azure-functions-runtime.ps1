# Fix Azure Functions Runtime: Node.js → .NET
# This script changes the Azure Functions runtime from Node.js to .NET 8

Write-Host "🔧 Fixing Azure Functions Runtime: Node.js → .NET 8" -ForegroundColor Cyan
Write-Host ""

$functionAppName = "reminderapp-functions"
$resourceGroup = "ReminderApp_RG"

Write-Host "📋 Current Function App Configuration:" -ForegroundColor Yellow

# Check current runtime
Write-Host "1. Checking current runtime stack..."
try {
    $currentConfig = az functionapp config show --name $functionAppName --resource-group $resourceGroup --query "{linuxFxVersion: linuxFxVersion, netFrameworkVersion: netFrameworkVersion}" -o json | ConvertFrom-Json
    Write-Host "   Current LinuxFxVersion: $($currentConfig.linuxFxVersion)" -ForegroundColor White
    Write-Host "   Current NetFrameworkVersion: $($currentConfig.netFrameworkVersion)" -ForegroundColor White
} catch {
    Write-Host "   ❌ Failed to get current config: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🔄 Updating Function App to .NET 8:" -ForegroundColor Yellow

# Step 1: Set runtime to .NET 8
Write-Host "1. Setting runtime stack to .NET 8..."
try {
    $result = az functionapp config set --name $functionAppName --resource-group $resourceGroup --net-framework-version "v8.0" --output table
    Write-Host "   ✅ Runtime set to .NET 8" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to set .NET runtime: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 2: Set FUNCTIONS_WORKER_RUNTIME
Write-Host "2. Setting FUNCTIONS_WORKER_RUNTIME to dotnet..."
try {
    $result = az functionapp config appsettings set --name $functionAppName --resource-group $resourceGroup --settings "FUNCTIONS_WORKER_RUNTIME=dotnet" --output table
    Write-Host "   ✅ Worker runtime set to dotnet" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to set worker runtime: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Set FUNCTIONS_EXTENSION_VERSION
Write-Host "3. Setting FUNCTIONS_EXTENSION_VERSION to ~4..."
try {
    $result = az functionapp config appsettings set --name $functionAppName --resource-group $resourceGroup --settings "FUNCTIONS_EXTENSION_VERSION=~4" --output table
    Write-Host "   ✅ Extension version set to ~4" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to set extension version: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Remove Node.js specific settings
Write-Host "4. Removing Node.js specific settings..."
try {
    # Remove WEBSITE_NODE_DEFAULT_VERSION if exists
    $result = az functionapp config appsettings delete --name $functionAppName --resource-group $resourceGroup --setting-names "WEBSITE_NODE_DEFAULT_VERSION" --output table 2>$null
    Write-Host "   ✅ Node.js settings removed" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️ Node.js settings may not exist (this is OK)" -ForegroundColor Yellow
}

# Step 5: Restart Function App
Write-Host "5. Restarting Function App to apply changes..."
try {
    $result = az functionapp restart --name $functionAppName --resource-group $resourceGroup --output table
    Write-Host "   ✅ Function App restarted" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Failed to restart Function App: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Updated Function App Configuration:" -ForegroundColor Yellow

# Check updated runtime
Write-Host "Checking updated runtime stack..."
try {
    $updatedConfig = az functionapp config show --name $functionAppName --resource-group $resourceGroup --query "{linuxFxVersion: linuxFxVersion, netFrameworkVersion: netFrameworkVersion}" -o json | ConvertFrom-Json
    Write-Host "   Updated LinuxFxVersion: $($updatedConfig.linuxFxVersion)" -ForegroundColor White
    Write-Host "   Updated NetFrameworkVersion: $($updatedConfig.netFrameworkVersion)" -ForegroundColor White
} catch {
    Write-Host "   ❌ Failed to get updated config: $($_.Exception.Message)" -ForegroundColor Red
}

# Check app settings
Write-Host ""
Write-Host "Key app settings:"
try {
    $settings = az functionapp config appsettings list --name $functionAppName --resource-group $resourceGroup --query "[?name=='FUNCTIONS_WORKER_RUNTIME' || name=='FUNCTIONS_EXTENSION_VERSION'].{name:name, value:value}" -o table
    Write-Host $settings -ForegroundColor White
} catch {
    Write-Host "   ❌ Failed to get app settings: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Wait 2-3 minutes for runtime to fully initialize" -ForegroundColor White
Write-Host "2. Deploy .NET Functions using GitHub Actions or manual deployment" -ForegroundColor White
Write-Host "3. Test API endpoints:" -ForegroundColor White
Write-Host "   - https://reminderapp-functions.azurewebsites.net/api/health" -ForegroundColor Gray
Write-Host "   - https://reminderapp-functions.azurewebsites.net/api/ReminderAPI?clientID=mom" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Azure Functions runtime updated to .NET 8!" -ForegroundColor Green

