# Manual .NET Functions Deployment to Azure
# This script manually deploys .NET Functions when GitHub Actions fails

Write-Host "🚀 Manual .NET Azure Functions Deployment" -ForegroundColor Cyan
Write-Host ""

$functionAppName = "reminderapp-functions"
$resourceGroup = "ReminderApp_RG"
$projectPath = "ReminderApp.Functions"

# Step 1: Build and publish locally
Write-Host "1. 🔨 Building .NET Functions locally..." -ForegroundColor Yellow
try {
    Set-Location $projectPath
    Write-Host "   📂 Current directory: $(Get-Location)" -ForegroundColor Gray
    
    # Clean previous builds
    if (Test-Path "./publish") { Remove-Item -Recurse -Force "./publish" }
    if (Test-Path "./output") { Remove-Item -Recurse -Force "./output" }
    
    # Build and publish
    dotnet clean
    dotnet restore
    dotnet publish -c Release -o ./publish
    
    Write-Host "   ✅ Build completed successfully" -ForegroundColor Green
    
    # List published files
    Write-Host "   📋 Published files:" -ForegroundColor Gray
    Get-ChildItem "./publish" | ForEach-Object { Write-Host "      - $($_.Name)" -ForegroundColor Gray }
    
} catch {
    Write-Host "   ❌ Build failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Set-Location ".."
}

Write-Host ""

# Step 2: Create deployment ZIP
Write-Host "2. 📦 Creating deployment ZIP..." -ForegroundColor Yellow
try {
    $zipPath = "ReminderApp.Functions/dotnet-functions-manual.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath }
    
    # Create ZIP from publish folder
    Compress-Archive -Path "ReminderApp.Functions/publish/*" -DestinationPath $zipPath -Force
    
    $zipSize = (Get-Item $zipPath).Length / 1MB
    Write-Host "   ✅ ZIP created: $zipPath ($([math]::Round($zipSize, 2)) MB)" -ForegroundColor Green
    
} catch {
    Write-Host "   ❌ ZIP creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Check Azure Functions configuration
Write-Host "3. ⚙️ Checking Azure Functions configuration..." -ForegroundColor Yellow
try {
    Write-Host "   🔍 Function App: $functionAppName" -ForegroundColor Gray
    
    # Try to get current settings (may fail due to Azure CLI issues)
    Write-Host "   📋 Current app settings (may show errors due to CLI issues):" -ForegroundColor Gray
    try {
        $settings = az functionapp config appsettings list --name $functionAppName --resource-group $resourceGroup --query "[?name=='FUNCTIONS_WORKER_RUNTIME' || name=='FUNCTIONS_EXTENSION_VERSION'].{name:name, value:value}" -o table
        Write-Host $settings -ForegroundColor White
    } catch {
        Write-Host "      ⚠️ Could not retrieve settings (Azure CLI issue)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "   ⚠️ Configuration check failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Manual deployment instructions
Write-Host "4. 🎯 Manual Deployment Options:" -ForegroundColor Yellow
Write-Host ""

Write-Host "   📋 OPTION A - Azure Portal (Recommended):" -ForegroundColor Cyan
Write-Host "   1. Open Azure Portal: https://portal.azure.com" -ForegroundColor White
Write-Host "   2. Navigate to Function App: $functionAppName" -ForegroundColor White
Write-Host "   3. Go to 'Deployment Center' → 'FTPS credentials'" -ForegroundColor White
Write-Host "   4. Download publish profile OR use ZIP Deploy" -ForegroundColor White
Write-Host "   5. Upload: $zipPath" -ForegroundColor White
Write-Host ""

Write-Host "   📋 OPTION B - Azure CLI ZIP Deploy:" -ForegroundColor Cyan
Write-Host "   Run this command:" -ForegroundColor White
Write-Host "   az functionapp deployment source config-zip --src `"$zipPath`" --name $functionAppName --resource-group $resourceGroup" -ForegroundColor Gray
Write-Host ""

Write-Host "   📋 OPTION C - func CLI (if func tools installed):" -ForegroundColor Cyan
Write-Host "   cd ReminderApp.Functions" -ForegroundColor Gray
Write-Host "   func azure functionapp publish $functionAppName --dotnet" -ForegroundColor Gray
Write-Host ""

# Step 5: Configuration commands
Write-Host "5. 🔧 Required Configuration Commands:" -ForegroundColor Yellow
Write-Host "   Run these after deployment to ensure .NET runtime:" -ForegroundColor White
Write-Host ""
Write-Host "   # Set runtime to .NET" -ForegroundColor Gray
Write-Host "   az functionapp config appsettings set --name $functionAppName --resource-group $resourceGroup --settings `"FUNCTIONS_WORKER_RUNTIME=dotnet`"" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Set extension version" -ForegroundColor Gray
Write-Host "   az functionapp config appsettings set --name $functionAppName --resource-group $resourceGroup --settings `"FUNCTIONS_EXTENSION_VERSION=~4`"" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Restart function app" -ForegroundColor Gray
Write-Host "   az functionapp restart --name $functionAppName --resource-group $resourceGroup" -ForegroundColor Gray
Write-Host ""

# Step 6: Testing instructions
Write-Host "6. 🧪 Testing After Deployment:" -ForegroundColor Yellow
Write-Host "   Wait 2-3 minutes, then test these endpoints:" -ForegroundColor White
Write-Host ""
Write-Host "   ✅ Health Check:" -ForegroundColor Green
Write-Host "      https://$functionAppName.azurewebsites.net/api/health" -ForegroundColor Gray
Write-Host ""
Write-Host "   ✅ ReminderAPI:" -ForegroundColor Green
Write-Host "      https://$functionAppName.azurewebsites.net/api/ReminderAPI?clientID=mom" -ForegroundColor Gray
Write-Host ""
Write-Host "   ✅ Admin Dashboard:" -ForegroundColor Green
Write-Host "      https://$functionAppName.azurewebsites.net/admin" -ForegroundColor Gray
Write-Host ""

Write-Host "🎉 Manual deployment package ready!" -ForegroundColor Green
Write-Host "Choose one of the deployment options above to complete the process." -ForegroundColor White
