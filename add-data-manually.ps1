# =====================================================
# COSMOS DB DATA UPLOAD - Manual JSON Insert
# =====================================================
# Tämä script lisää JSON:it manuaalisesti Cosmos DB:hen
# Käytä kun automaattinen MCP ei toimi

Write-Host "🚀 Lisätään JSON-data Cosmos DB:hen manuaalisesti..." -ForegroundColor Cyan

# Parametrit - ReminderApp sivubisnes
$subscriptionName = "Enel-Virtual-desktop-Infrastructure"  # Todellinen Azure subscription
$resourceGroupName = "ReminderAppDB"  # Kuten mainitsit
$cosmosAccountName = "reminderapp-cosmos-db"  # Oletettu nimi
$databaseName = "ReminderAppDB"

# Lue JSON-tiedosto
Write-Host "📖 Luetaan testidata..." -ForegroundColor Yellow
$testDataPath = "cosmos-testdata.json"

if (-not (Test-Path $testDataPath)) {
    Write-Host "❌ Ei löydy tiedostoa: $testDataPath" -ForegroundColor Red
    exit 1
}

$testData = Get-Content $testDataPath -Raw | ConvertFrom-Json

Write-Host "✅ JSON data ladattu:" -ForegroundColor Green
Write-Host "   Clients: $($testData.clients.Count)"
Write-Host "   Photos: $($testData.photos.Count)"
Write-Host "   Foods: $($testData.foods.Count)"
Write-Host "   Medications: $($testData.medications.Count)"

# =====================================================
# VAIHTOEHDOT DATAN LISÄÄMISEEN
# =====================================================

Write-Host ""
Write-Host "🛠️ VALITSE TAPA LISÄTÄ DATA:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ⚡ AZURE DATA EXPLORER (nopein)" -ForegroundColor Green
Write-Host "   - Mene Azure Portal → Cosmos DB → Data Explorer"  
Write-Host "   - Valitse container (Clients, Photos, Foods, Medications)"
Write-Host "   - Klikkaa 'New Item' → liitä JSON → Save"
Write-Host ""

Write-Host "2. 🔧 POWERSHELL + REST API (automatisoitu)" -ForegroundColor Yellow
Write-Host "   - Vaatii Cosmos DB connection stringin"
Write-Host "   - Käyttää Cosmos DB REST API:a"
Write-Host ""

Write-Host "3. 📋 COSMOS DB SDK (.NET)" -ForegroundColor Blue
Write-Host "   - Vaatii .NET console app:n"
Write-Host "   - Käyttää Microsoft.Azure.Cosmos NuGet packagea"
Write-Host ""

# =====================================================
# AZURE DATA EXPLORER OHJEET
# =====================================================

Write-Host ""
Write-Host "📋 AZURE DATA EXPLORER - Vaihe vaiheelta:" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Clients container:" -ForegroundColor Yellow
foreach ($client in $testData.clients) {
    $json = $client | ConvertTo-Json -Depth 10 -Compress
    Write-Host "   → $($client.id): " -NoNewline -ForegroundColor Gray
    Write-Host $json -ForegroundColor White
}

Write-Host ""
Write-Host "2. Photos container:" -ForegroundColor Yellow  
foreach ($photo in $testData.photos) {
    $json = $photo | ConvertTo-Json -Depth 10 -Compress
    Write-Host "   → $($photo.id): " -NoNewline -ForegroundColor Gray
    Write-Host $json -ForegroundColor White
}

Write-Host ""
Write-Host "3. Foods container:" -ForegroundColor Yellow
foreach ($food in $testData.foods) {
    $json = $food | ConvertTo-Json -Depth 10 -Compress
    Write-Host "   → $($food.id): " -NoNewline -ForegroundColor Gray
    Write-Host $json -ForegroundColor White
}

Write-Host ""
Write-Host "4. Medications container:" -ForegroundColor Yellow
foreach ($medication in $testData.medications) {
    $json = $medication | ConvertTo-Json -Depth 10 -Compress
    Write-Host "   → $($medication.id): " -NoNewline -ForegroundColor Gray
    Write-Host $json -ForegroundColor White
}

# =====================================================
# TESTAUS
# =====================================================

Write-Host ""
Write-Host "🧪 KUN DATA ON LISÄTTY, TESTAA:" -ForegroundColor Green
Write-Host ""
Write-Host "curl 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom'"
Write-Host "curl 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=dad'" 
Write-Host "curl 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test'"
Write-Host ""

Write-Host "📋 ODOTETTAVA MUUTOS:" -ForegroundColor Cyan
Write-Host '   "storage": "cosmos"  // Ei enää "in-memory"'
Write-Host '   "settings": { "useFoodReminders": true/false, "foodReminderType": "detailed/simple" }'
Write-Host '   "dailyTasks": [erilaisia taskeja per asiakas]'
Write-Host ""

Write-Host "✅ SCRIPT VALMIS! Käytä Azure Data Explorer -metodia." -ForegroundColor Green
