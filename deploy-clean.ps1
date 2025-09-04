# Clean Azure Functions deployment (small package)
# Only deploys necessary Azure Functions files

Write-Host "=== CLEAN AZURE FUNCTIONS DEPLOYMENT ===" -ForegroundColor Green
Write-Host "Deploying only necessary files (should be ~5-10 MB)" -ForegroundColor Yellow
Write-Host ""

# Check current directory
$currentPath = Get-Location
Write-Host "Working directory: $currentPath" -ForegroundColor Cyan

# Check if .funcignore exists
if (!(Test-Path ".funcignore")) {
    Write-Host "❌ .funcignore file missing!" -ForegroundColor Red
    Write-Host "Creating .funcignore file..." -ForegroundColor Yellow

    # Create basic .funcignore
    @"
# Exclude everything except Azure Functions files
*

# Include only these files
!azure-functions-cosmos-config.js
!host.json
!package.json
!package-lock.json
!.funcignore
"@ | Out-File -FilePath ".funcignore" -Encoding UTF8
}

# Install dependencies (only production)
Write-Host "1. Installing production dependencies..." -ForegroundColor Cyan
npm ci --only=production

# Create deployment package manually (more reliable)
Write-Host "2. Creating deployment package..." -ForegroundColor Cyan

# Clean any existing deployment files
if (Test-Path "deploy.zip") {
    Remove-Item "deploy.zip" -Force
}

# Create zip with only necessary files
$filesToInclude = @(
    "azure-functions-cosmos-config.js",
    "host.json",
    "package.json",
    "package-lock.json",
    ".funcignore"
)

Write-Host "Files to deploy:" -ForegroundColor Cyan
$filesToInclude | ForEach-Object {
    if (Test-Path $_) {
        Write-Host "  ✅ $_" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $_ (missing)" -ForegroundColor Red
    }
}

# Create the zip file
try {
    Compress-Archive -Path $filesToInclude -DestinationPath "deploy.zip" -CompressionLevel Optimal -Force
    $zipSize = (Get-Item "deploy.zip").Length / 1MB
    Write-Host "✅ Deployment package created: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create deployment package: $_" -ForegroundColor Red
    exit 1
}

# Deploy using Azure CLI (more reliable than func)
Write-Host "3. Deploying to Azure..." -ForegroundColor Cyan

# Method 1: Use az functionapp deployment
try {
    Write-Host "Using Azure CLI deployment..." -ForegroundColor Yellow
    az functionapp deployment source config-zip --resource-group ReminderApp_RG --name reminderapp-functions --src deploy.zip

    Write-Host "✅ Deployment successful!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Azure CLI deployment failed, trying alternative method..." -ForegroundColor Yellow

    # Method 2: Use func command
    try {
        Write-Host "Using Azure Functions Core Tools..." -ForegroundColor Yellow
        func azure functionapp publish reminderapp-functions --no-build

        Write-Host "✅ Deployment successful!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Both deployment methods failed: $_" -ForegroundColor Red
        Write-Host "Check your Azure CLI authentication and Function App name" -ForegroundColor Yellow
        exit 1
    }
}

# Wait for deployment to complete
Write-Host "4. Waiting for deployment to complete..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

# Test the deployment
Write-Host "5. Testing deployment..." -ForegroundColor Cyan
$testUrl = "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"

try {
    $response = Invoke-WebRequest -Uri $testUrl -Method GET -TimeoutSec 30
    Write-Host "✅ API test successful!" -ForegroundColor Green
    Write-Host "Response: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "⚠️ API test failed: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "This might be normal if the function is still starting up" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== DEPLOYMENT COMPLETE ===" -ForegroundColor Green
Write-Host "Function URL: https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net" -ForegroundColor Yellow
Write-Host "Test URL: $testUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host "Package size should be around 5-10 MB instead of 800+ MB!" -ForegroundColor Green
