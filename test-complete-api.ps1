# Comprehensive API test for mom's ReminderApp
# Tests all features: photos, food reminders, medications, weather, messages

Write-Host "🧪 Testataan ReminderApp API - Kaikki ominaisuudet" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom"

try {
    Write-Host "📡 Haetaan dataa API:sta..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get
    
    Write-Host "✅ API vastasi!" -ForegroundColor Green
    Write-Host ""
    
    # Test 1: Client Info
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "1️⃣  ASIAKASTIEDOT" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "Client ID:    $($response.clientID)" -ForegroundColor White
    Write-Host "Nimi:         $($response.clientName)" -ForegroundColor White
    Write-Host "Storage:      $($response.storage)" -ForegroundColor $(if ($response.storage -eq "cosmos") { "Green" } else { "Red" })
    Write-Host ""
    
    if ($response.storage -ne "cosmos") {
        Write-Host "⚠️  VAROITUS: Storage ei ole Cosmos! Tarkista connection string." -ForegroundColor Yellow
        Write-Host ""
    }
    
    # Test 2: Photos
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "2️⃣  VALOKUVAT" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    
    if ($response.dailyPhotoUrl) {
        Write-Host "✅ Kuva löytyi!" -ForegroundColor Green
        Write-Host "URL:          $($response.dailyPhotoUrl)" -ForegroundColor White
        Write-Host "Kuvateksti:   $($response.dailyPhotoCaption)" -ForegroundColor White
        Write-Host ""
        Write-Host "📅 Tänään on päivä: $(Get-Date -Format 'dd')" -ForegroundColor Gray
        Write-Host "   Kuvia yhteensä: 26" -ForegroundColor Gray
        Write-Host "   Indeksi: $(([int](Get-Date -Format 'dd')) % 26)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Kuvaa ei löytynyt!" -ForegroundColor Red
        Write-Host "   Tarkista että Photos containerissa on mom:n kuvia" -ForegroundColor Yellow
    }
    Write-Host ""
    
    # Test 3: Food Reminders
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "3️⃣  RUOKAMUISTUTUKSET" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    
    $foodTasks = $response.dailyTasks | Where-Object { $_.type -eq "food" }
    if ($foodTasks) {
        Write-Host "✅ Löytyi $($foodTasks.Count) ruokamuistutusta:" -ForegroundColor Green
        foreach ($task in $foodTasks) {
            $icon = if ($task.completed) { "✅" } else { "☐" }
            Write-Host "   $icon $($task.time) - $($task.text)" -ForegroundColor White
        }
    } else {
        Write-Host "❌ Ruokamuistutuksia ei löytynyt!" -ForegroundColor Red
    }
    Write-Host ""
    
    # Test 4: Medications
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "4️⃣  LÄÄKEMUISTUTUKSET" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    
    $medTasks = $response.dailyTasks | Where-Object { $_.type -eq "medication" }
    if ($medTasks) {
        Write-Host "✅ Löytyi $($medTasks.Count) lääkemuistutusta:" -ForegroundColor Green
        foreach ($task in $medTasks) {
            $icon = if ($task.completed) { "✅" } else { "☐" }
            Write-Host "   $icon $($task.time) - $($task.text)" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️  Lääkemuistutuksia ei löytynyt!" -ForegroundColor Yellow
        Write-Host "   Tämä on OK jos lääkkeet lisätään myöhemmin" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Test 5: Weather
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "5️⃣  SÄÄ" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    
    if ($response.weather) {
        $weather = $response.weather
        Write-Host "✅ Säätiedot haettu!" -ForegroundColor Green
        Write-Host "Lämpötila:    $($weather.temperature)" -ForegroundColor White
        Write-Host "Kuvaus:       $($weather.description)" -ForegroundColor White
        Write-Host "Kosteus:      $($weather.humidity)%" -ForegroundColor White
        Write-Host "Tuuli:        $($weather.windSpeed) m/s" -ForegroundColor White
        Write-Host ""
        Write-Host "Olosuhteet:" -ForegroundColor Yellow
        Write-Host "   IsGood:    $($weather.isGood)" -ForegroundColor $(if ($weather.isGood) { "Green" } else { "Gray" })
        Write-Host "   IsCold:    $($weather.isCold)" -ForegroundColor $(if ($weather.isCold) { "Cyan" } else { "Gray" })
        Write-Host "   IsRaining: $($weather.isRaining)" -ForegroundColor $(if ($weather.isRaining) { "Blue" } else { "Gray" })
        Write-Host ""
        
        if ($weather.recommendation) {
            Write-Host "💡 Suositus:" -ForegroundColor Yellow
            Write-Host "   $($weather.recommendation)" -ForegroundColor White
        }
    } else {
        Write-Host "❌ Säätietoja ei saatu!" -ForegroundColor Red
        Write-Host "   Tarkista Weather API key" -ForegroundColor Yellow
    }
    Write-Host ""
    
    # Test 6: Greeting
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "6️⃣  TERVEHDYS" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "$($response.greeting)" -ForegroundColor White
    Write-Host ""
    
    # Summary
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "📊 YHTEENVETO" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    
    $checksPass = 0
    $checksTotal = 5
    
    if ($response.storage -eq "cosmos") { $checksPass++ } 
    if ($response.dailyPhotoUrl) { $checksPass++ }
    if ($foodTasks) { $checksPass++ }
    if ($response.weather) { $checksPass++ }
    if ($response.greeting) { $checksPass++ }
    
    Write-Host "Testejä läpi: $checksPass / $checksTotal" -ForegroundColor $(if ($checksPass -eq $checksTotal) { "Green" } else { "Yellow" })
    Write-Host ""
    
    if ($checksPass -eq $checksTotal) {
        Write-Host "🎉 KAIKKI TOIMII! API on valmis käyttöön!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📱 Seuraavat vaiheet:" -ForegroundColor Cyan
        Write-Host "   1. Lisää viestit: .\add-mom-messages.ps1" -ForegroundColor White
        Write-Host "   2. Aloita PWA-sovellus" -ForegroundColor White
        Write-Host "   3. Testaa tabletin kanssa" -ForegroundColor White
    } else {
        Write-Host "⚠️  Jotkut ominaisuudet puuttuvat" -ForegroundColor Yellow
        Write-Host "   Katso yllä olevat virheet ja korjaa" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "📝 Koko vastaus tallennettu: api-response.json" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 10 | Out-File -FilePath "api-response.json" -Encoding UTF8
    
} catch {
    Write-Host "❌ VIRHE API-kutsussa!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Virheilmoitus:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Tarkista:" -ForegroundColor Yellow
    Write-Host "   1. Onko Function App käynnissä?" -ForegroundColor White
    Write-Host "   2. Onko API-URL oikein?" -ForegroundColor White
    Write-Host "   3. Onko verkko yhteys OK?" -ForegroundColor White
    exit 1
}
