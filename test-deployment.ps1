# Test Azure Functions deployment

Write-Host "=== AZURE FUNCTIONS API TEST ===" -ForegroundColor Green
Write-Host "Testing ReminderApp Functions deployment" -ForegroundColor Yellow
Write-Host ""

$baseUrl = "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net"
$testClientId = "test"

# Function to test API endpoint
function Test-ApiEndpoint {
    param (
        [string]$endpoint,
        [string]$description
    )

    Write-Host "Testing: $description" -ForegroundColor Cyan
    Write-Host "URL: $endpoint" -ForegroundColor Gray

    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method GET -TimeoutSec 30
        $statusCode = $response.StatusCode

        if ($statusCode -eq 200) {
            Write-Host "✅ SUCCESS: HTTP $statusCode" -ForegroundColor Green

            # Try to parse JSON response
            try {
                $jsonResponse = $response.Content | ConvertFrom-Json
                Write-Host "Response: $($jsonResponse | ConvertTo-Json -Compress)" -ForegroundColor Green
            } catch {
                Write-Host "Response: $($response.Content)" -ForegroundColor Green
            }
        } else {
            Write-Host "⚠️ UNEXPECTED: HTTP $statusCode" -ForegroundColor Yellow
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ FAILED: HTTP $statusCode - $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host ""
}

# Test endpoints
Write-Host "Testing API endpoints..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Main ReminderAPI
Test-ApiEndpoint "$baseUrl/api/ReminderAPI?clientID=$testClientId" "Main Reminder API"

# Test 2: ConfigAPI
Test-ApiEndpoint "$baseUrl/api/ConfigAPI?clientID=$testClientId" "Configuration API"

# Test 3: Weather endpoint (if exists)
Test-ApiEndpoint "$baseUrl/api/WeatherAPI?clientID=$testClientId" "Weather API"

# Test 4: Basic function list
Write-Host "Checking deployed functions..." -ForegroundColor Cyan
try {
    $functions = az functionapp function list --resource-group ReminderApp_RG --name reminderapp-functions --output json | ConvertFrom-Json
    Write-Host "✅ Found $($functions.Count) functions:" -ForegroundColor Green
    $functions | ForEach-Object {
        Write-Host "  - $($_.name)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Could not list functions: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST COMPLETE ===" -ForegroundColor Green
Write-Host "If you see 404 errors, wait 2-3 minutes and try again." -ForegroundColor Yellow
Write-Host "Functions might still be starting up." -ForegroundColor Yellow
Write-Host ""
Write-Host "Base URL: $baseUrl" -ForegroundColor Cyan
