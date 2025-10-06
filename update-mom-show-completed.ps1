# Update mom client settings to show completed tasks
# Purpose: Enable ShowCompletedTasks for memory-impaired users

$resourceGroup = "reminder-app-rg"
$accountName = "reminderapp-cosmos"
$databaseName = "ReminderAppDB"
$containerName = "Clients"
$clientId = "mom"

Write-Host "🔄 Updating mom client settings..." -ForegroundColor Cyan

# Get the existing client document
$query = "SELECT * FROM c WHERE c.clientId = '$clientId' AND c.type = 'client'"

Write-Host "📖 Fetching current client document..." -ForegroundColor Yellow

$document = az cosmosdb sql query `
    --account-name $accountName `
    --database-name $databaseName `
    --container-name $containerName `
    --query-text $query | ConvertFrom-Json

if ($document.Count -eq 0) {
    Write-Host "❌ Client 'mom' not found!" -ForegroundColor Red
    exit 1
}

$client = $document[0]
Write-Host "✅ Found client: $($client.name)" -ForegroundColor Green

# Update settings
if (-not $client.settings) {
    $client.settings = @{}
}

# Add ShowCompletedTasks setting
$client.settings.showCompletedTasks = $true
$client.updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")

Write-Host "📝 Updating document with showCompletedTasks = true..." -ForegroundColor Yellow

# Save the updated document
$tempFile = New-TemporaryFile
$client | ConvertTo-Json -Depth 10 | Out-File -FilePath $tempFile -Encoding UTF8

az cosmosdb sql container item upsert `
    --account-name $accountName `
    --database-name $databaseName `
    --container-name $containerName `
    --partition-key-value $clientId `
    --body "@$tempFile"

Remove-Item $tempFile

Write-Host ""
Write-Host "✅ mom client settings updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Setting: showCompletedTasks = true" -ForegroundColor Cyan
Write-Host "   → Kuitatut tehtävät NÄYTETÄÄN ✅ KUITATTU -badgella" -ForegroundColor White
Write-Host "   → Hyödyllinen muistiongelmaisille käyttäjille" -ForegroundColor White
Write-Host ""
Write-Host "💡 Jos haluat piilottaa kuitatut tehtävät:" -ForegroundColor Yellow
Write-Host "   1. Muuta Cosmos DB:ssä: showCompletedTasks = false" -ForegroundColor White
Write-Host "   2. Tai luo toinen client eri asetuksilla" -ForegroundColor White

