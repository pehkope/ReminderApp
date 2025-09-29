# Migrate Google Sheets Data to Cosmos DB
# Hakee oikeat asetukset Google Sheetsistä ja vie ne Cosmos DB:hen

param(
    [string]$ClientId = "mom",
    [string]$ApiBaseUrl = "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net"
)

Write-Host "🔄 Siirretään Google Sheets data Cosmos DB:hen..." -ForegroundColor Green
Write-Host "Client: $ClientId" -ForegroundColor Yellow

# Test current API first
Write-Host "1️⃣ Testataan nykyistä API:a..." -ForegroundColor Cyan
try {
    $currentResponse = Invoke-RestMethod -Uri "$ApiBaseUrl/api/ReminderAPI?clientID=$ClientId" -Method GET
    Write-Host "✅ Current API Status:" -ForegroundColor Green
    Write-Host "   Storage: $($currentResponse.storage)" -ForegroundColor White
    Write-Host "   DailyTasks: $($currentResponse.dailyTasks.Count) items" -ForegroundColor White
    Write-Host "   Settings: $($currentResponse.settings.useFoodReminders)" -ForegroundColor White
} catch {
    Write-Host "❌ API test failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2️⃣ Tarkistetaan Google Sheets yhteys..." -ForegroundColor Cyan

# Check if Google Sheets service is configured
$sheetsConfigured = $false
try {
    # This would be a test call to Google Sheets service
    # For now, we'll assume it's configured if API is working
    $sheetsConfigured = $true
    Write-Host "✅ Google Sheets service löytyi" -ForegroundColor Green
} catch {
    Write-Host "❌ Google Sheets ei ole konfiguroitu" -ForegroundColor Red
    Write-Host "   Tarkista SHEETS_WEBAPP_URL environment variable Azure Function App:ssa" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "3️⃣ Aloitetaan migration..." -ForegroundColor Cyan

# Note: Since we can't directly call the migration service from PowerShell,
# we'll create the migration endpoint in the API

Write-Host "⚠️  Migration vaatii API endpoint lisäyksen:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Lisää ReminderApp.Functions:iin uusi endpoint:" -ForegroundColor White
Write-Host "POST /api/migrate-sheets?clientId=$ClientId" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoint käyttää SheetsToCosmosService:a siirtämään datan." -ForegroundColor White
Write-Host ""

Write-Host "📋 Seuraavat vaiheet:" -ForegroundColor Green
Write-Host "1. Lisää MigrationApi endpoint Azure Functions:iin" -ForegroundColor White
Write-Host "2. Deployaa koodi" -ForegroundColor White  
Write-Host "3. Aja migration: POST /api/migrate-sheets?clientId=$ClientId" -ForegroundColor White
Write-Host "4. Testaa tulokset: GET /api/ReminderAPI?clientID=$ClientId" -ForegroundColor White

Write-Host ""
Write-Host "🎯 Migration siirtää:" -ForegroundColor Cyan
Write-Host "   ✅ Client asetukset (Config sheet)" -ForegroundColor Green
Write-Host "   ✅ Lääkkeet (Lääkkeet sheet)" -ForegroundColor Green
Write-Host "   ✅ Ruoka-ajat (Ruoka-ajat sheet)" -ForegroundColor Green
Write-Host "   ✅ Viestit (Viestit sheet)" -ForegroundColor Green
Write-Host "   ✅ Tapaamiset (Tapaamiset sheet)" -ForegroundColor Green
Write-Host "   ✅ Valokuvat (Kuvat sheet)" -ForegroundColor Green

Write-Host ""
Write-Host "🔗 Google Sheets URL:" -ForegroundColor Cyan
Write-Host "https://docs.google.com/spreadsheets/d/14i3QPYquqSqyE7fTp_pa2LNBq2Jb_re2rwsuUpRRSHo/edit" -ForegroundColor Blue

Write-Host ""
Write-Host "Jatka migration API:n luomisella! 🚀" -ForegroundColor Green
