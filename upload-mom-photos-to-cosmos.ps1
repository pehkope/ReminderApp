# Upload all 26 mom photos to Cosmos DB
# Run this in Azure Cloud Shell (PowerShell mode)

param(
    [string]$SubscriptionName = "Enel-Virtual-desktop-Infrastructure",
    [string]$ResourceGroup = "ReminderAppDB",
    [string]$AccountName = "reminderappdb",
    [string]$DatabaseName = "ReminderAppDB",
    [string]$ContainerName = "Photos"
)

Write-Host "📸 Lisätään 26 mom:n kuvaa Cosmos DB:hen..." -ForegroundColor Cyan
Write-Host ""

# Set subscription
Write-Host "🔧 Asetetaan subscription..." -ForegroundColor Yellow
az account set --subscription $SubscriptionName

# Get Cosmos DB connection details
Write-Host "🔑 Haetaan Cosmos DB tiedot..." -ForegroundColor Yellow
$accountKey = az cosmosdb keys list `
    --name $AccountName `
    --resource-group $ResourceGroup `
    --query primaryMasterKey `
    --output tsv

if (-not $accountKey) {
    Write-Host "❌ Cosmos DB avainta ei löytynyt!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Cosmos DB avain haettu" -ForegroundColor Green
Write-Host ""

# Photo files to upload
$photoFiles = 1..26 | ForEach-Object { "photo-mom-{0:D3}.json" -f $_ }

$successCount = 0
$failCount = 0

foreach ($photoFile in $photoFiles) {
    if (-not (Test-Path $photoFile)) {
        Write-Host "⚠️  Tiedostoa ei löydy: $photoFile" -ForegroundColor Yellow
        $failCount++
        continue
    }

    Write-Host "📤 Lisätään: $photoFile..." -ForegroundColor White
    
    try {
        # Read JSON file
        $jsonContent = Get-Content -Path $photoFile -Raw
        
        # Parse JSON to get the id and clientId for partition key
        $photoData = $jsonContent | ConvertFrom-Json
        $photoId = $photoData.id
        $partitionKey = $photoData.clientId
        
        # Create item using Azure CLI
        $result = az cosmosdb sql container create-item `
            --account-name $AccountName `
            --resource-group $ResourceGroup `
            --database-name $DatabaseName `
            --container-name $ContainerName `
            --partition-key-value $partitionKey `
            --body $jsonContent `
            2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ $photoId lisätty!" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "   ❌ Virhe: $result" -ForegroundColor Red
            $failCount++
        }
    }
    catch {
        Write-Host "   ❌ Exception: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
    
    # Small delay to avoid throttling
    Start-Sleep -Milliseconds 200
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 YHTEENVETO" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Onnistuneet: $successCount / 26" -ForegroundColor Green
Write-Host "❌ Epäonnistuneet: $failCount / 26" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($successCount -eq 26) {
    Write-Host "🎉 Kaikki kuvat lisätty onnistuneesti!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🧪 Testaa nyt:" -ForegroundColor Cyan
    Write-Host "Invoke-RestMethod -Uri 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom' | Select-Object dailyPhotoUrl, dailyPhotoCaption" -ForegroundColor Blue
} else {
    Write-Host "⚠️  Jotkut kuvat epäonnistuivat. Tarkista virheet yllä." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Voit tarkistaa kuvat Azure Portalissa:" -ForegroundColor Gray
Write-Host "   Portal → Cosmos DB → ReminderAppDB → Data Explorer → Photos" -ForegroundColor Gray
