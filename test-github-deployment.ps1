# GitHub Actions Deployment Test Script
# Testaa että deployment toimii ja API:t vastaavat

Write-Host "🧪 GitHub Actions Deployment Test" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Yellow

$functionUrl = "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net"

Write-Host "`n🔗 Function App URL: $functionUrl" -ForegroundColor Cyan

# Testaa Function App health
Write-Host "`n🏥 Testataan Function App health..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$functionUrl/api/ReminderAPI?clientID=test" -Method GET -TimeoutSec 30
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Function App vastaa (HTTP $($response.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Function App vastaa mutta status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Function App ei vastaa!" -ForegroundColor Red
    Write-Host "Virhe: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Testaa ReminderAPI
Write-Host "`n📝 Testataan ReminderAPI..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$functionUrl/api/ReminderAPI?clientID=test" -Method GET -TimeoutSec 30
    $content = $response.Content | ConvertFrom-Json

    if ($response.StatusCode -eq 200 -and $content.success -eq $true) {
        Write-Host "✅ ReminderAPI toimii!" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
        Write-Host "   ClientID: $($content.clientID)" -ForegroundColor Gray
        Write-Host "   Reminders count: $($content.count)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  ReminderAPI vastaa mutta data ei ole validi" -ForegroundColor Yellow
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Yellow
        Write-Host "   Success: $($content.success)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ ReminderAPI testi epäonnistui!" -ForegroundColor Red
    Write-Host "Virhe: $($_.Exception.Message)" -ForegroundColor Red
}

# Testaa ConfigAPI
Write-Host "`n⚙️  Testataan ConfigAPI..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$functionUrl/api/ConfigAPI?clientID=test" -Method GET -TimeoutSec 30
    $content = $response.Content | ConvertFrom-Json

    if ($response.StatusCode -eq 200 -and $content.success -eq $true) {
        Write-Host "✅ ConfigAPI toimii!" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
        Write-Host "   ClientID: $($content.clientID)" -ForegroundColor Gray
        Write-Host "   Has config: $(if ($content.config) { 'Kyllä' } else { 'Ei' })" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  ConfigAPI vastaa mutta data ei ole validi" -ForegroundColor Yellow
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Yellow
        Write-Host "   Success: $($content.success)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ ConfigAPI testi epäonnistui!" -ForegroundColor Red
    Write-Host "Virhe: $($_.Exception.Message)" -ForegroundColor Red
}

# Testaa POST ReminderAPI
Write-Host "`n📤 Testataan POST ReminderAPI..." -ForegroundColor Cyan
try {
    $testData = @{
        title = "Test Reminder"
        message = "GitHub Actions test"
        time = "12:00"
        active = $true
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$functionUrl/api/ReminderAPI?clientID=test" -Method POST -Body $testData -ContentType "application/json" -TimeoutSec 30
    $content = $response.Content | ConvertFrom-Json

    if ($response.StatusCode -eq 201 -and $content.success -eq $true) {
        Write-Host "✅ POST ReminderAPI toimii!" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
        Write-Host "   Reminder ID: $($content.reminder.id)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  POST ReminderAPI vastaa mutta status ei ole 201" -ForegroundColor Yellow
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ POST ReminderAPI testi epäonnistui!" -ForegroundColor Red
    Write-Host "Virhe: $($_.Exception.Message)" -ForegroundColor Red
}

# Testaa POST ConfigAPI
Write-Host "`n⚙️  Testataan POST ConfigAPI..." -ForegroundColor Cyan
try {
    $testConfig = @{
        settings = @{
            useWeather = $true
            usePhotos = $true
            useTelegram = $false
            useSMS = $false
        }
        weather = @{
            apiKey = ""
            location = "Helsinki"
        }
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$functionUrl/api/ConfigAPI?clientID=test" -Method POST -Body $testConfig -ContentType "application/json" -TimeoutSec 30
    $content = $response.Content | ConvertFrom-Json

    if ($response.StatusCode -eq 201 -and $content.success -eq $true) {
        Write-Host "✅ POST ConfigAPI toimii!" -ForegroundColor Green
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  POST ConfigAPI vastaa mutta status ei ole 201" -ForegroundColor Yellow
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ POST ConfigAPI testi epäonnistui!" -ForegroundColor Red
    Write-Host "Virhe: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Testaus valmis!" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Yellow

Write-Host "`n📊 Yhteenveto:" -ForegroundColor Cyan
Write-Host "- Jos kaikki testit ovat ✅ vihreitä → Deployment onnistui!" -ForegroundColor Green
Write-Host "- Jos jotkut ovat ⚠️  keltaisia → Tarkista Azure Portal" -ForegroundColor Yellow
Write-Host "- Jos jotkut ovat ❌ punaisia → Tarkista deployment logs" -ForegroundColor Red

Write-Host "`n🔍 Tarkista myös:" -ForegroundColor Cyan
Write-Host "- Azure Portal: Function App → Functions" -ForegroundColor White
Write-Host "- GitHub: Actions tab → viimeisin workflow" -ForegroundColor White
Write-Host "- PWA: appsettings.json API URL" -ForegroundColor White

Write-Host "`n✅ Kaikki valmista! Jos testit onnistuivat, GitHub Actions toimii! 🎉" -ForegroundColor Green
