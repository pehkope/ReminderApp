# =====================================================
# COSMOS DB AUTOMAATTINEN LUOMINEN - ReminderApp
# =====================================================
# Aja tämä Azure Cloud Shellissä tai PowerShell 7+ terminaalissa
# Vaatii: Azure PowerShell moduuli (Install-Module Az)

Write-Host "🚀 Luodaan Cosmos DB automaattisesti..." -ForegroundColor Cyan

# Parametrit (voit muuttaa näitä)
$subscriptionName = "Enel-Virtual-desktop-Infrastructure"
$resourceGroupName = "rg-reminderapp"
$cosmosAccountName = "reminderapp-cosmos-db"
$location = "Sweden Central"
$databaseName = "ReminderAppDB"

# =====================================================
# 1. KIRJAUDU JA VALITSE SUBSCRIPTION
# =====================================================
Write-Host "1. Tarkistetaan Azure yhteys..." -ForegroundColor Yellow

try {
    $context = Get-AzContext
    if (-not $context) {
        Write-Host "Kirjaudutaan Azure:iin..." -ForegroundColor Green
        Connect-AzAccount
    }
    
    # Aseta oikea subscription
    Set-AzContext -SubscriptionName $subscriptionName
    Write-Host "✅ Subscription asetettu: $subscriptionName" -ForegroundColor Green
}
catch {
    Write-Error "❌ Azure kirjautuminen epäonnistui: $($_.Exception.Message)"
    exit 1
}

# =====================================================
# 2. TARKISTA/LUO RESOURCE GROUP
# =====================================================
Write-Host "2. Tarkistetaan Resource Group..." -ForegroundColor Yellow

$rg = Get-AzResourceGroup -Name $resourceGroupName -ErrorAction SilentlyContinue
if (-not $rg) {
    Write-Host "Resource Group ei löydy, luodaan uusi..." -ForegroundColor Green
    $rg = New-AzResourceGroup -Name $resourceGroupName -Location $location
}
Write-Host "✅ Resource Group: $($rg.ResourceGroupName) ($($rg.Location))" -ForegroundColor Green

# =====================================================
# 3. TARKISTA ONKO COSMOS DB JO OLEMASSA
# =====================================================
Write-Host "3. Tarkistetaan Cosmos DB..." -ForegroundColor Yellow

$existingCosmos = Get-AzCosmosDBAccount -ResourceGroupName $resourceGroupName -Name $cosmosAccountName -ErrorAction SilentlyContinue
if ($existingCosmos) {
    Write-Host "✅ Cosmos DB löytyy jo: $cosmosAccountName" -ForegroundColor Green
    $cosmosAccount = $existingCosmos
} else {
    # =====================================================
    # 4. LUO COSMOS DB ACCOUNT
    # =====================================================
    Write-Host "4. Luodaan Cosmos DB Account..." -ForegroundColor Yellow
    Write-Host "   Nimi: $cosmosAccountName" -ForegroundColor Gray
    Write-Host "   Sijainti: $location" -ForegroundColor Gray
    Write-Host "   Free Tier: Enabled (400 RU/s)" -ForegroundColor Gray
    
    try {
        $cosmosAccount = New-AzCosmosDBAccount `
            -ResourceGroupName $resourceGroupName `
            -Name $cosmosAccountName `
            -Location $location `
            -DefaultConsistencyLevel "Session" `
            -EnableFreeTier $true `
            -MaxTotalThroughput 400
            
        Write-Host "✅ Cosmos DB Account luotu onnistuneesti!" -ForegroundColor Green
        
        # Odotetaan että account on valmis
        Write-Host "   Odotetaan että account on valmis (30s)..." -ForegroundColor Gray
        Start-Sleep -Seconds 30
    }
    catch {
        Write-Error "❌ Cosmos DB Account luominen epäonnistui: $($_.Exception.Message)"
        exit 1
    }
}

# =====================================================
# 5. LUO DATABASE
# =====================================================
Write-Host "5. Luodaan Database: $databaseName" -ForegroundColor Yellow

$database = Get-AzCosmosDBSqlDatabase -ResourceGroupName $resourceGroupName -AccountName $cosmosAccountName -Name $databaseName -ErrorAction SilentlyContinue
if (-not $database) {
    try {
        $database = New-AzCosmosDBSqlDatabase `
            -ResourceGroupName $resourceGroupName `
            -AccountName $cosmosAccountName `
            -Name $databaseName
            
        Write-Host "✅ Database luotu: $databaseName" -ForegroundColor Green
    }
    catch {
        Write-Error "❌ Database luominen epäonnistui: $($_.Exception.Message)"
        exit 1
    }
} else {
    Write-Host "✅ Database löytyy jo: $databaseName" -ForegroundColor Green
}

# =====================================================
# 6. LUO CONTAINERIT
# =====================================================
Write-Host "6. Luodaan Containerit..." -ForegroundColor Yellow

$containers = @(
    "Clients",
    "Appointments", 
    "Foods",
    "Medications",
    "Photos",
    "Messages",
    "Completions"
)

$partitionKeyPath = "/clientId"
$throughput = 400  # Shared 400 RU/s

foreach ($containerName in $containers) {
    Write-Host "   Luodaan container: $containerName" -ForegroundColor Gray
    
    $existingContainer = Get-AzCosmosDBSqlContainer -ResourceGroupName $resourceGroupName -AccountName $cosmosAccountName -DatabaseName $databaseName -Name $containerName -ErrorAction SilentlyContinue
    
    if (-not $existingContainer) {
        try {
            $container = New-AzCosmosDBSqlContainer `
                -ResourceGroupName $resourceGroupName `
                -AccountName $cosmosAccountName `
                -DatabaseName $databaseName `
                -Name $containerName `
                -PartitionKeyPath $partitionKeyPath `
                -Throughput $throughput
                
            Write-Host "   ✅ Container luotu: $containerName" -ForegroundColor Green
        }
        catch {
            Write-Host "   ❌ Container luominen epäonnistui ($containerName): $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "   ✅ Container löytyy jo: $containerName" -ForegroundColor Green  
    }
}

# =====================================================
# 7. HAE CONNECTION STRING
# =====================================================
Write-Host "7. Haetaan Connection String..." -ForegroundColor Yellow

try {
    $keys = Get-AzCosmosDBAccountKey -ResourceGroupName $resourceGroupName -Name $cosmosAccountName
    $connectionString = "AccountEndpoint=https://$cosmosAccountName.documents.azure.com:443/;AccountKey=$($keys.PrimaryMasterKey);"
    
    Write-Host "✅ Connection String haettu!" -ForegroundColor Green
    
    # =====================================================
    # 8. TULOSTA TULOKSET
    # =====================================================
    Write-Host ""
    Write-Host "🎉 COSMOS DB LUOMINEN VALMIS!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 TIEDOT:" -ForegroundColor Cyan
    Write-Host "   Subscription: $subscriptionName"
    Write-Host "   Resource Group: $resourceGroupName"
    Write-Host "   Cosmos Account: $cosmosAccountName"
    Write-Host "   Database: $databaseName"
    Write-Host "   Containerit: $($containers -join ', ')"
    Write-Host "   Partition Key: $partitionKeyPath"
    Write-Host "   Throughput: $throughput RU/s (shared)"
    Write-Host ""
    Write-Host "🔑 CONNECTION STRING:" -ForegroundColor Yellow
    Write-Host $connectionString -ForegroundColor White
    Write-Host ""
    Write-Host "📋 SEURAAVAT ASKELEET:" -ForegroundColor Cyan
    Write-Host "1. Kopioi Connection String ylhäältä"
    Write-Host "2. Lisää se Azure Functions Configuration:iin:"
    Write-Host "   - Function App → Configuration → Application settings"
    Write-Host "   - Uusi setting: COSMOS_CONNECTION_STRING"
    Write-Host "   - Value: [connection string yllä]"
    Write-Host "3. Käynnistä Function App uudelleen"
    Write-Host "4. Testaa API: storage-tyyppi muuttuu 'cosmos':ksi"
    Write-Host ""
    
    # Tallenna connection string tiedostoon
    $connectionString | Out-File -FilePath "cosmos-connection-string.txt" -Encoding UTF8
    Write-Host "💾 Connection string tallennettu tiedostoon: cosmos-connection-string.txt" -ForegroundColor Green
}
catch {
    Write-Error "❌ Connection String haku epäonnistui: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "✅ COSMOS DB SETUP VALMIS! 🚀" -ForegroundColor Green
