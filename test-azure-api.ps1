# Test Azure Functions API
# Run after deployment is complete

Write-Host "=== TESTING AZURE FUNCTIONS API ===" -ForegroundColor Green
Write-Host ""

$baseUrl = "https://reminderapp-functions.azurewebsites.net/api"

# Test 1: Basic API call
Write-Host "Test 1: Basic API call..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/ReminderAPI?clientID=test" -Method GET
    Write-Host "✅ SUCCESS: $($response.message)" -ForegroundColor Green
    Write-Host "   Client ID: $($response.clientID)" -ForegroundColor Cyan
    Write-Host "   Execution Time: $($response.executionTime)ms" -ForegroundColor Cyan
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: Weather data
Write-Host "Test 2: Weather data..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/ReminderAPI?clientID=test" -Method GET
    if ($response.weather) {
        Write-Host "✅ Weather data received:" -ForegroundColor Green
        Write-Host "   Description: $($response.weather.description)" -ForegroundColor Cyan
        Write-Host "   Temperature: $($response.weather.temperature)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️ No weather data (API key may be missing)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Configuration API
Write-Host "Test 3: Configuration API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/config/test" -Method GET
    Write-Host "✅ Config API works:" -ForegroundColor Green
    Write-Host "   Client ID: $($response.config.clientID)" -ForegroundColor Cyan
    Write-Host "   Version: $($response.config.version)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Config API failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This is normal if no config exists yet" -ForegroundColor Yellow
}

Write-Host ""

# Test 4: Create customer config
Write-Host "Test 4: Creating customer configuration..." -ForegroundColor Yellow
$config = @{
    settings = @{
        useWeather = $true
        usePhotos = $true
        useTelegram = $false
        language = "fi"
    }
    weather = @{
        apiKey = "demo-key"
        location = "Helsinki"
    }
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/config/test" -Method POST -Body $config -ContentType "application/json"
    Write-Host "✅ Customer config created:" -ForegroundColor Green
    Write-Host "   Message: $($response.message)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Config creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST SUMMARY ===" -ForegroundColor Green
Write-Host "If you see mostly green checkmarks, your Azure Functions are working!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update PWA to use Azure API URL" -ForegroundColor White
Write-Host "2. Get real OpenWeatherMap API key" -ForegroundColor White
Write-Host "3. Configure real customer settings" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Azure Functions deployment test complete!" -ForegroundColor Green

Read-Host "Press Enter to exit"
