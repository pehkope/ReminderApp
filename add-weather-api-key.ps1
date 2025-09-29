# Add OpenWeatherMap API key to Azure Function App Settings
# Run this in Azure Cloud Shell or local PowerShell with Azure CLI

# Määritä muuttujat
$FunctionAppName = "reminderapp-functions"
$ResourceGroupName = "ReminderAppDB"
$WeatherApiKey = "50fe59d3cb03a3e81cb7ab6e6e6cc9c0"

Write-Host "🌤️ Lisätään OpenWeatherMap API-avain Azure Function App:iin..." -ForegroundColor Cyan
Write-Host "Function App: $FunctionAppName" -ForegroundColor Yellow
Write-Host "Resource Group: $ResourceGroupName" -ForegroundColor Yellow

try {
    # Lisää WEATHER_API_KEY Application Settings:iin
    Write-Host "🔑 Lisätään WEATHER_API_KEY..." -ForegroundColor Cyan
    
    az functionapp config appsettings set `
        --name $FunctionAppName `
        --resource-group $ResourceGroupName `
        --settings WEATHER_API_KEY=$WeatherApiKey

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ WEATHER_API_KEY lisätty onnistuneesti!" -ForegroundColor Green
    } else {
        Write-Host "❌ WEATHER_API_KEY lisääminen epäonnistui!" -ForegroundColor Red
        exit 1
    }

    # Restart Function App jotta muutokset tulevat voimaan
    Write-Host "🔄 Käynnistetään Function App uudelleen..." -ForegroundColor Cyan
    
    az functionapp restart `
        --name $FunctionAppName `
        --resource-group $ResourceGroupName

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Function App käynnistetty uudelleen!" -ForegroundColor Green
    } else {
        Write-Host "❌ Function App restart epäonnistui!" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "🎉 Weather API-avain konfiguroitu!" -ForegroundColor Green
    Write-Host "💡 WeatherService nyt käytössä samalla logiikalla kuin GAS-koodi!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🧪 Testaa Weather API:" -ForegroundColor Cyan
    Write-Host "Invoke-RestMethod -Uri 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom' | Select-Object weather" -ForegroundColor Blue

} catch {
    Write-Host "❌ Virhe Weather API-avaimen lisäämisessä: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Mitä tehtiin:" -ForegroundColor Green
Write-Host "   🔑 Lisättiin WEATHER_API_KEY Function App Settings:iin" -ForegroundColor White  
Write-Host "   🌤️ WeatherService käyttää nyt OpenWeatherMap API:a" -ForegroundColor White
Write-Host "   🧠 Sama isGood/isRaining-logiikka kuin GAS-koodissa" -ForegroundColor White
Write-Host "   📍 Sijaintina Helsinki (kuten GAS:ssa)" -ForegroundColor White
Write-Host "   🇫🇮 Suomenkieliset säätiedot (lang=fi)" -ForegroundColor White
