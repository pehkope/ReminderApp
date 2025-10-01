# Testaa CORS korjaus

Write-Host "🧪 Testataan CORS..." -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-WebRequest `
        -Uri "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom" `
        -Headers @{'Origin'='https://lively-forest-0b274f703.1.azurestaticapps.net'} `
        -Method GET
    
    $corsHeader = $response.Headers['Access-Control-Allow-Origin']
    
    Write-Host "✅ API vastaa! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "CORS Header: '$corsHeader'" -ForegroundColor Cyan
    Write-Host ""
    
    if ($corsHeader -eq "https://lively-forest-0b274f703.1.azurestaticapps.net") {
        Write-Host "🎉🎉🎉 CORS TOIMII OIKEIN!" -ForegroundColor Green
        Write-Host ""
        Write-Host "✅ Avaa PWA incognito-ikkunassa:" -ForegroundColor Green
        Write-Host "   https://lively-forest-0b274f703.1.azurestaticapps.net" -ForegroundColor Cyan
    } elseif ($corsHeader -eq "null" -or $corsHeader -eq "") {
        Write-Host "❌ CORS header on VIELÄ virheellinen!" -ForegroundColor Red
        Write-Host "   Odota että GitHub Actions deployment valmistuu..." -ForegroundColor Yellow
    } else {
        Write-Host "⚠️ CORS header on epäodotettu: $corsHeader" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Virhe API-kutsussa:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ℹ️ Odota että deployment valmistuu..." -ForegroundColor Cyan
}

