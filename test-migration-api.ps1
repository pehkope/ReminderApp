# Test Migration API to move Google Sheets data to Cosmos DB
# Siirtää mom-client datan + kuvat Google Sheetsistä Cosmos DB:hen

$apiUrl = "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/migrate-sheets?clientId=mom"

Write-Host "🚀 Käynnistetään Google Sheets → Cosmos DB migraatio..." -ForegroundColor Cyan
Write-Host "Client: mom" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -ContentType "application/json"
    
    Write-Host "✅ Migration API vastaus:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5 | Write-Host
    
    if ($response.success) {
        Write-Host ""
        Write-Host "🎉 Migraatio onnistui!" -ForegroundColor Green
        Write-Host "📋 Siirretty:" -ForegroundColor Cyan
        Write-Host "   ✅ Mom-client asetukset" -ForegroundColor White
        Write-Host "   ✅ Valokuvat (linkit Google Sheetsistä)" -ForegroundColor White
        Write-Host "   ✅ Lääkkeet" -ForegroundColor White
        Write-Host "   ✅ Ruuat" -ForegroundColor White
        Write-Host "   ✅ Tapaamiset" -ForegroundColor White
        Write-Host ""
        Write-Host "🧪 Testaa tulokset:" -ForegroundColor Cyan
        Write-Host "Invoke-RestMethod -Uri 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?client=mom' | Select-Object clientID, storage, dailyPhotoUrl, weeklyPhotos" -ForegroundColor Blue
    } else {
        Write-Host ""
        Write-Host "❌ Migraatio epäonnistui!" -ForegroundColor Red
        Write-Host "Tarkista Google Sheets API-avain ja että data on oikein" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Virhe Migration API -kutsussa:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Varmista että:" -ForegroundColor Yellow
    Write-Host "   1. GitHub Actions deployment on valmis" -ForegroundColor White
    Write-Host "   2. Google Sheets API-avain on Application Settings:ssä" -ForegroundColor White
    Write-Host "   3. Google Sheet on jaettu service accountille" -ForegroundColor White
}
