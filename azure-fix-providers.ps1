# Fix Azure Resource Providers - Run this BEFORE deployment

Write-Host "=== FIXING AZURE RESOURCE PROVIDERS ===" -ForegroundColor Green
Write-Host "This will register required providers for Cosmos DB and Functions" -ForegroundColor Yellow
Write-Host ""

# Register Cosmos DB provider
Write-Host "# 1. Register Cosmos DB Provider" -ForegroundColor Cyan
Write-Host "Command: az provider register --namespace Microsoft.DocumentDB" -ForegroundColor White
Write-Host ""

# Register Functions provider
Write-Host "# 2. Register Functions Provider" -ForegroundColor Cyan
Write-Host "Command: az provider register --namespace Microsoft.Web" -ForegroundColor White
Write-Host ""

# Register Storage provider
Write-Host "# 3. Register Storage Provider" -ForegroundColor Cyan
Write-Host "Command: az provider register --namespace Microsoft.Storage" -ForegroundColor White
Write-Host ""

# Check registration status
Write-Host "# 4. Check Registration Status" -ForegroundColor Cyan
Write-Host "Command: az provider show --namespace Microsoft.DocumentDB --query registrationState" -ForegroundColor White
Write-Host ""

Write-Host "=== QUICK FIX COMMANDS ===" -ForegroundColor Green
Write-Host ""
Write-Host "# Run these commands in PowerShell:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. az provider register --namespace Microsoft.DocumentDB" -ForegroundColor White
Write-Host "2. az provider register --namespace Microsoft.Web" -ForegroundColor White
Write-Host "3. az provider register --namespace Microsoft.Storage" -ForegroundColor White
Write-Host ""
Write-Host "# Wait 2-3 minutes, then check:" -ForegroundColor Yellow
Write-Host "4. az provider show --namespace Microsoft.DocumentDB --query registrationState" -ForegroundColor White
Write-Host ""
Write-Host "# Should return: ""Registered""" -ForegroundColor Green
Write-Host ""
Write-Host "=== THEN CONTINUE WITH DEPLOYMENT ===" -ForegroundColor Green
