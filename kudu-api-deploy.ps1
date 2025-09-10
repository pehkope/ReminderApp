# Kudu API ZIP Deploy PowerShell Script

# Function App details
$siteName = "reminderapp-functions"
$kuduUrl = "https://reminderapp-functions-hrhddjfeb0bpa0ee.scm.swedencentral-01.azurewebsites.net"
$zipFile = "ReminderApp.Functions/dotnet-functions.zip"

# Check if ZIP file exists
if (-not (Test-Path $zipFile)) {
    Write-Error "ZIP file not found: $zipFile"
    exit 1
}

Write-Host "Deploying $zipFile to $siteName..."

try {
    # Deploy using Kudu API
    $deployUrl = "$kuduUrl/api/zipdeploy"
    
    # Read ZIP file
    $zipBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $zipFile))
    
    Write-Host "Uploading ZIP file ($([math]::Round($zipBytes.Length / 1MB, 2)) MB)..."
    
    # Create web request
    $response = Invoke-RestMethod -Uri $deployUrl -Method POST -Body $zipBytes -ContentType "application/zip" -UseDefaultCredentials
    
    Write-Host "✅ Deployment completed successfully!"
    Write-Host "Response: $response"
    
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Wait 2-3 minutes for deployment to complete"
    Write-Host "2. Restart Function App in Azure Portal"
    Write-Host "3. Test: test-reminderapi-only.html"
    
} catch {
    Write-Error "❌ Deployment failed: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "Alternative: Try manual ZIP upload in Kudu web interface"
    Write-Host "URL: $kuduUrl/ZipPushDeploy"
}
