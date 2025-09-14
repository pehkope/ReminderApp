# =====================================================
# TESTAA COSMOS DB INTEGRAATIO
# =====================================================
# Testaa että ReminderAPI käyttää Cosmos DB:tä oikein

Write-Host "🧪 Testataan Cosmos DB integraatio..." -ForegroundColor Cyan

$apiUrl = "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI"
$clientId = "mom"

Write-Host ""
Write-Host "📡 Testataan API..." -ForegroundColor Yellow
Write-Host "URL: $apiUrl?clientID=$clientId"

try {
    # Tee API-kutsu
    $response = Invoke-RestMethod -Uri "$apiUrl?clientID=$clientId" -Method GET -ContentType "application/json"
    
    Write-Host "✅ API vastasi onnistuneesti!" -ForegroundColor Green
    Write-Host ""
    
    # Tarkista storage-tyyppi
    Write-Host "📊 ANALYYSI:" -ForegroundColor Cyan
    Write-Host "Storage type: $($response.storage)" -ForegroundColor $(if ($response.storage -eq "cosmos") { "Green" } else { "Red" })
    
    if ($response.storage -eq "cosmos") {
        Write-Host "✅ COSMOS DB TOIMII!" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "📈 DATA TILASTOT:" -ForegroundColor Cyan
        Write-Host "   Daily tasks: $($response.dailyTasks.Count)"
        Write-Host "   Foods: $($response.foods.Count)"
        Write-Host "   Medications: $($response.medications.Count)"
        Write-Host "   Appointments: $($response.appointments.Count)"
        Write-Host "   Daily photo: $(if ($response.dailyPhotoUrl) { "✅ Löytyi" } else { "❌ Puuttuu" })"
        Write-Host "   Greeting: $($response.greeting)"
        
        Write-Host ""
        Write-Host "📋 DAILY TASKS:" -ForegroundColor Cyan
        if ($response.dailyTasks.Count -gt 0) {
            foreach ($task in $response.dailyTasks) {
                $status = if ($task.completed) { "✅" } else { "⏳" }
                Write-Host "   $status $($task.time) - $($task.text) ($($task.type))"
            }
        } else {
            Write-Host "   Ei daily taskeja (lisää testidata!)"
        }
        
    } else {
        Write-Host "❌ COSMOS DB EI KÄYTÖSSÄ!" -ForegroundColor Red
        Write-Host "   Storage type: $($response.storage)" 
        Write-Host ""
        Write-Host "🔧 KORJAUSEHDOTUKSET:" -ForegroundColor Yellow
        Write-Host "1. Tarkista että Cosmos DB on luotu"
        Write-Host "2. Tarkista CONNECTION_STRING Azure Functions:issa:"
        Write-Host "   Function App → Configuration → COSMOS_CONNECTION_STRING"
        Write-Host "3. Käynnistä Function App uudelleen"
        Write-Host "4. Tarkista että containerit on luotu oikein"
    }
    
    Write-Host ""
    Write-Host "📋 TÄYDELLINEN VASTAUS:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Gray
    
} catch {
    Write-Host "❌ API kutsu epäonnistui!" -ForegroundColor Red
    Write-Host "Virhe: $($_.Exception.Message)" -ForegroundColor Red
    
    Write-Host ""
    Write-Host "🔧 TARKISTA:" -ForegroundColor Yellow
    Write-Host "1. Onko Function App käynnissä?"
    Write-Host "2. Toimiiko URL selaimessa?"
    Write-Host "3. Onko CORS sallittu?"
    Write-Host "4. Tarkista Function App logeista virheet"
}

Write-Host ""
Write-Host "🚀 VALMIS!" -ForegroundColor Green
