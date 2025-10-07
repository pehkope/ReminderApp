# Lataa viestit Cosmos DB:hen REST API:lla
param(
    [string]$CosmosAccountName = "reminderapp-cosmos2025",
    [string]$ResourceGroup = "ReminderApp-RG",
    [string]$DatabaseName = "ReminderAppDB",
    [string]$ContainerName = "Messages"
)

Write-Host "🔐 Haetaan Cosmos DB primary key..." -ForegroundColor Cyan
$keys = az cosmosdb keys list --name $CosmosAccountName --resource-group $ResourceGroup | ConvertFrom-Json
$primaryKey = $keys.primaryMasterKey

if (-not $primaryKey) {
    Write-Host "❌ Ei saatu primary keytä!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Primary key haettu!" -ForegroundColor Green
Write-Host ""

# Lue viestit JSON-tiedostosta
$messagesJson = Get-Content "messages_import.json" -Raw | ConvertFrom-Json

$cosmosEndpoint = "https://$CosmosAccountName.documents.azure.com"
$uploaded = 0
$failed = 0

Write-Host "📤 Ladataan viestejä Cosmos DB:hen..." -ForegroundColor Cyan
Write-Host ""

foreach ($message in $messagesJson) {
    try {
        # Cosmos DB REST API URL
        $uri = "$cosmosEndpoint/dbs/$DatabaseName/colls/$ContainerName/docs"
        
        # Timestamp
        $utcNow = [DateTime]::UtcNow
        $xDate = $utcNow.ToString("r")
        
        # Luo authorization token
        $verb = "POST"
        $resourceType = "docs"
        $resourceLink = "dbs/$DatabaseName/colls/$ContainerName"
        
        $keyBytes = [System.Convert]::FromBase64String($primaryKey)
        $text = "$($verb.ToLowerInvariant())`n$($resourceType.ToLowerInvariant())`n$resourceLink`n$($xDate.ToLowerInvariant())`n`n"
        $body = [Text.Encoding]::UTF8.GetBytes($text)
        $hmacsha = New-Object System.Security.Cryptography.HMACSHA256
        $hmacsha.Key = $keyBytes
        $hashBytes = $hmacsha.ComputeHash($body)
        $signature = [System.Convert]::ToBase64String($hashBytes)
        $authToken = [System.Web.HttpUtility]::UrlEncode("type=master&ver=1.0&sig=$signature")
        
        # Headers
        $headers = @{
            "Authorization" = $authToken
            "x-ms-date" = $xDate
            "x-ms-version" = "2018-12-31"
            "Content-Type" = "application/json"
            "x-ms-documentdb-partitionkey" = "[`"$($message.clientId)`"]"
        }
        
        # Body
        $bodyJson = $message | ConvertTo-Json -Depth 10 -Compress
        
        # Lähetä POST request
        $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers -Body $bodyJson
        
        Write-Host "  ✅ $($message.id)" -ForegroundColor Green
        $uploaded++
    }
    catch {
        Write-Host "  ❌ $($message.id): $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════" -ForegroundColor Yellow
Write-Host "📊 YHTEENVETO:" -ForegroundColor Yellow
Write-Host "   ✅ Ladattu: $uploaded/$($messagesJson.Count)" -ForegroundColor Green
Write-Host "   ❌ Epäonnistui: $failed/$($messagesJson.Count)" -ForegroundColor Red
Write-Host "═══════════════════════════════════" -ForegroundColor Yellow

