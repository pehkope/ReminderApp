# Test Azure Services - Comprehensive Testing

Write-Host "=== AZURE SERVICES COMPREHENSIVE TEST ===" -ForegroundColor Green
Write-Host "Testing all Azure components for ReminderApp" -ForegroundColor Yellow
Write-Host ""

$functionUrl = "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net"
$testClientId = "test"

# Function to test HTTP endpoints
function Test-HttpEndpoint {
    param (
        [string]$url,
        [string]$description,
        [string]$method = "GET",
        [hashtable]$headers = @{}
    )

    Write-Host "Testing: $description" -ForegroundColor Cyan
    Write-Host "URL: $url" -ForegroundColor Gray
    Write-Host "Method: $method" -ForegroundColor Gray

    try {
        $response = Invoke-WebRequest -Uri $url -Method $method -Headers $headers -TimeoutSec 30
        $statusCode = $response.StatusCode

        Write-Host "✅ HTTP $statusCode - SUCCESS" -ForegroundColor Green

        if ($response.Content) {
            try {
                $jsonResponse = $response.Content | ConvertFrom-Json
                Write-Host "Response: $($jsonResponse | ConvertTo-Json -Compress)" -ForegroundColor Green
            } catch {
                Write-Host "Response: $($response.Content)" -ForegroundColor Green
            }
        }

        return $true
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ HTTP $statusCode - FAILED" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }

    Write-Host ""
}

# Function to test Azure CLI commands
function Test-AzureCliCommand {
    param (
        [string]$command,
        [string]$description,
        [switch]$expectOutput
    )

    Write-Host "Testing: $description" -ForegroundColor Cyan
    Write-Host "Command: $command" -ForegroundColor Gray

    try {
        $output = Invoke-Expression $command 2>&1

        if ($expectOutput -and -not $output) {
            Write-Host "⚠️ No output received" -ForegroundColor Yellow
            return $false
        }

        Write-Host "✅ SUCCESS" -ForegroundColor Green
        if ($output) {
            Write-Host "Output: $output" -ForegroundColor Green
        }
        return $true
    } catch {
        Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }

    Write-Host ""
}

Write-Host "🔍 PHASE 1: Azure Infrastructure Status" -ForegroundColor Magenta
Write-Host ""

# Test 1: Function App status
Test-AzureCliCommand "az functionapp show --resource-group ReminderApp_RG --name reminderapp-functions --query '{name:name, state:state}' -o json" "Function App Status" -expectOutput

# Test 2: Function list
Test-AzureCliCommand "az functionapp function list --resource-group ReminderApp_RG --name reminderapp-functions --query '[].name' -o json" "Deployed Functions" -expectOutput

# Test 3: Cosmos DB status
Test-AzureCliCommand "az cosmosdb show --resource-group ReminderApp_RG --name reminderapp-cosmos --query '{name:name, status:status}' -o json" "Cosmos DB Status" -expectOutput

# Test 4: Storage account status
Test-AzureCliCommand "az storage account show --name reminderappstorage123 --resource-group ReminderApp_RG --query '{name:name, status:statusOfPrimary}' -o json" "Storage Account Status" -expectOutput

Write-Host ""
Write-Host "🌐 PHASE 2: API Endpoint Testing" -ForegroundColor Magenta
Write-Host ""

# Test 5: Main Reminder API
Test-HttpEndpoint "$functionUrl/api/ReminderAPI?clientID=$testClientId" "Reminder API Main Endpoint"

# Test 6: Config API
Test-HttpEndpoint "$functionUrl/api/ConfigAPI?clientID=$testClientId" "Configuration API"

# Test 7: Weather API (if exists)
Test-HttpEndpoint "$functionUrl/api/WeatherAPI?clientID=$testClientId" "Weather API"

# Test 8: Root endpoint
Test-HttpEndpoint "$functionUrl/" "Function App Root"

Write-Host ""
Write-Host "🔗 PHASE 3: PWA Configuration Test" -ForegroundColor Magenta
Write-Host ""

# Test 9: Check PWA appsettings
$pwaConfigPath = "ReminderPWA\wwwroot\appsettings.json"
if (Test-Path $pwaConfigPath) {
    Write-Host "Testing: PWA Configuration" -ForegroundColor Cyan
    try {
        $configContent = Get-Content $pwaConfigPath -Raw | ConvertFrom-Json
        $baseUrl = $configContent.ApiSettings.BaseUrl
        Write-Host "✅ PWA Config found" -ForegroundColor Green
        Write-Host "Base URL: $baseUrl" -ForegroundColor Green

        if ($baseUrl -match $functionUrl) {
            Write-Host "✅ PWA is configured to use Azure Functions" -ForegroundColor Green
        } else {
            Write-Host "⚠️ PWA is not using Azure Functions URL" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Failed to read PWA config: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ PWA configuration file not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "📊 PHASE 4: Summary and Recommendations" -ForegroundColor Magenta
Write-Host ""

Write-Host "=== TEST SUMMARY ===" -ForegroundColor Green
Write-Host "Function URL: $functionUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. If APIs return 404, functions might need redeployment" -ForegroundColor White
Write-Host "2. If PWA config is wrong, update appsettings.json" -ForegroundColor White
Write-Host "3. Monitor Azure costs in Azure Portal" -ForegroundColor White
Write-Host "4. Consider adding monitoring and logging" -ForegroundColor White
Write-Host ""
Write-Host "All Azure services should be running and accessible!" -ForegroundColor Green
