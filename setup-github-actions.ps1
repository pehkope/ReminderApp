# Setup GitHub Actions for Azure Functions
# This script helps configure Azure credentials for GitHub Actions

Write-Host "=== GITHUB ACTIONS SETUP FOR AZURE FUNCTIONS ===" -ForegroundColor Green
Write-Host "This script will help you configure Azure credentials for GitHub Actions" -ForegroundColor Yellow
Write-Host ""

# Check if Azure CLI is available
Write-Host "Checking Azure CLI..." -ForegroundColor Cyan
try {
    $azVersion = az --version | Select-Object -First 1
    Write-Host "✅ Azure CLI found: $azVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found!" -ForegroundColor Red
    Write-Host "Please install Azure CLI first: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Login to Azure
Write-Host "Please login to Azure..." -ForegroundColor Cyan
az login

# Get subscription ID
Write-Host "Getting subscription information..." -ForegroundColor Cyan
$subscription = az account show --query "{id:id, name:name}" | ConvertFrom-Json
$subscriptionId = $subscription.id
$subscriptionName = $subscription.name

Write-Host "Current subscription: $subscriptionName ($subscriptionId)" -ForegroundColor Green
Write-Host ""

# Create Service Principal
Write-Host "Creating Service Principal for GitHub Actions..." -ForegroundColor Cyan
$spJson = az ad sp create-for-rbac --name "ReminderAppGitHubActions" --role contributor --scopes "/subscriptions/$subscriptionId" --sdk-auth

Write-Host ""
Write-Host "=== AZURE CREDENTIALS FOR GITHUB ===" -ForegroundColor Magenta
Write-Host "Copy this JSON to GitHub Secrets as 'AZURE_CREDENTIALS':" -ForegroundColor Yellow
Write-Host ""
Write-Host $spJson -ForegroundColor White
Write-Host ""

# Get Function App publish profile
Write-Host "Getting Function App publish profile..." -ForegroundColor Cyan
try {
    $publishProfile = az functionapp deployment list-publishing-profiles --name reminderapp-functions --resource-group ReminderApp_RG --xml
    Write-Host ""
    Write-Host "=== PUBLISH PROFILE FOR GITHUB ===" -ForegroundColor Magenta
    Write-Host "Copy this XML to GitHub Secrets as 'AZURE_FUNCTIONAPP_PUBLISH_PROFILE':" -ForegroundColor Yellow
    Write-Host ""
    Write-Host $publishProfile -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "⚠️ Could not get publish profile automatically" -ForegroundColor Yellow
    Write-Host "You can get it from Azure Portal:" -ForegroundColor Gray
    Write-Host "1. Go to Function App → Deployment Center → FTPS credentials" -ForegroundColor Gray
    Write-Host "2. Copy the Publish Profile" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "=== NEXT STEPS ===" -ForegroundColor Green
Write-Host "1. Go to your GitHub repository" -ForegroundColor White
Write-Host "2. Settings → Secrets and variables → Actions" -ForegroundColor White
Write-Host "3. Add 'AZURE_CREDENTIALS' secret with the JSON above" -ForegroundColor White
Write-Host "4. Add 'AZURE_FUNCTIONAPP_PUBLISH_PROFILE' secret with the XML above" -ForegroundColor White
Write-Host "5. Push code to main branch to trigger deployment" -ForegroundColor White
Write-Host ""
Write-Host "GitHub URL: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "After setup, every push to main branch will automatically deploy to Azure!" -ForegroundColor Green
