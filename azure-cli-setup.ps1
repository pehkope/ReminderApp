# Azure CLI Installation Script for Windows
# Run this in PowerShell as Administrator

Write-Host "=== AZURE CLI INSTALLATION SCRIPT ===" -ForegroundColor Green
Write-Host ""

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Running as Administrator" -ForegroundColor Green

# Method 1: Try winget (Windows Package Manager)
Write-Host ""
Write-Host "Method 1: Installing via winget..." -ForegroundColor Yellow
try {
    winget install Microsoft.AzureCLI --accept-source-agreements --accept-package-agreements
    Write-Host "✓ Azure CLI installed successfully via winget!" -ForegroundColor Green
} catch {
    Write-Host "✗ Winget failed, trying alternative method..." -ForegroundColor Red

    # Method 2: Download and install MSI
    Write-Host ""
    Write-Host "Method 2: Downloading MSI installer..." -ForegroundColor Yellow

    $msiUrl = "https://aka.ms/installazurecliwindows"
    $msiPath = "$env:TEMP\AzureCLI.msi"

    try {
        Invoke-WebRequest -Uri $msiUrl -OutFile $msiPath
        Write-Host "✓ MSI downloaded to: $msiPath" -ForegroundColor Green

        Write-Host ""
        Write-Host "Installing Azure CLI..." -ForegroundColor Yellow
        Start-Process msiexec.exe -Wait -ArgumentList "/i `"$msiPath`" /quiet /norestart"

        Write-Host "✓ Azure CLI installation completed!" -ForegroundColor Green

        # Clean up
        Remove-Item $msiPath -ErrorAction SilentlyContinue

    } catch {
        Write-Host "✗ MSI installation failed" -ForegroundColor Red
        Write-Host "Please download manually from: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
        exit 1
    }
}

# Verify installation
Write-Host ""
Write-Host "Verifying Azure CLI installation..." -ForegroundColor Yellow
try {
    $version = & az --version 2>$null | Select-Object -First 1
    Write-Host "✓ Azure CLI installed: $version" -ForegroundColor Green
} catch {
    Write-Host "✗ Azure CLI verification failed" -ForegroundColor Red
    Write-Host "Please restart PowerShell and try again" -ForegroundColor Yellow
    exit 1
}

# Login to Azure
Write-Host ""
Write-Host "=== AZURE LOGIN ===" -ForegroundColor Green
Write-Host "Opening browser for Azure login..." -ForegroundColor Yellow
Write-Host "Please complete the login process in your browser" -ForegroundColor Yellow

try {
    & az login --use-device-code
    Write-Host "✓ Azure login successful!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Azure login completed (or cancelled)" -ForegroundColor Yellow
}

# Show account info
Write-Host ""
Write-Host "=== ACCOUNT INFO ===" -ForegroundColor Green
try {
    $account = & az account show --query "{name:name, id:id, tenantId:tenantId}" -o json | ConvertFrom-Json
    Write-Host "Account: $($account.name)" -ForegroundColor Cyan
    Write-Host "Subscription ID: $($account.id)" -ForegroundColor Cyan
    Write-Host "Tenant ID: $($account.tenantId)" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️ Could not retrieve account info" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== NEXT STEPS ===" -ForegroundColor Green
Write-Host "1. Azure CLI is now installed and configured!" -ForegroundColor Green
Write-Host "2. Run the deployment commands from azure-deployment-commands.sh" -ForegroundColor Cyan
Write-Host "3. Or use: .\azure-deployment-commands.ps1" -ForegroundColor Cyan

Write-Host ""
Write-Host "🎉 Ready for Azure Functions deployment!" -ForegroundColor Green
