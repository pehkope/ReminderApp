# Helppo Azure Functions deployment
# Suorita tämä PowerShellissä projektin juuressa

Write-Host "=== AZURE FUNCTIONS DEPLOYMENT ===" -ForegroundColor Green
Write-Host "Helppo deployment ReminderApp Functions:iin" -ForegroundColor Yellow
Write-Host ""

# Tarkista että olemme oikeassa kansiossa
$currentPath = Get-Location
Write-Host "Nykyinen kansio: $currentPath" -ForegroundColor Cyan

# Tarkista Azure CLI
Write-Host "1. Tarkistetaan Azure CLI..." -ForegroundColor Cyan
try {
    $azVersion = az --version | Select-Object -First 1
    Write-Host "✅ Azure CLI: $azVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI ei löydy. Asenna se ensin!" -ForegroundColor Red
    Write-Host "Lataa: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
    exit 1
}

# Tarkista Azure Functions Core Tools
Write-Host "2. Tarkistetaan Azure Functions Core Tools..." -ForegroundColor Cyan
try {
    $funcVersion = func --version
    Write-Host "✅ Azure Functions Core Tools: $funcVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Azure Functions Core Tools ei löydy." -ForegroundColor Yellow
    Write-Host "Asennetaan automaattisesti..." -ForegroundColor Cyan

    # Asenna Azure Functions Core Tools
    npm install -g azure-functions-core-tools@4 --unsafe-perm true
}

# Kirjaudu Azureen
Write-Host "3. Kirjaudutaan Azureen..." -ForegroundColor Cyan
az login

# Tarkista resurssit
Write-Host "4. Tarkistetaan resurssit..." -ForegroundColor Cyan
az resource list --resource-group ReminderApp_RG --output table

# Asenna dependencies
Write-Host "5. Asennetaan npm paketit..." -ForegroundColor Cyan
npm install

# Deployaa function
Write-Host "6. Deployataan Azure Functions..." -ForegroundColor Cyan
func azure functionapp publish reminderapp-functions-hrhddjfeb0bpa0ee

# Testaa deployment
Write-Host "7. Testataan deployment..." -ForegroundColor Cyan
Start-Sleep -Seconds 10  # Odota että function on valmis

try {
    $testResponse = curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"
    Write-Host "✅ Test response: $testResponse" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Test epäonnistui - function voi vielä latautua" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== DEPLOYMENT VALMIS ===" -ForegroundColor Green
Write-Host "Function URL: https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net" -ForegroundColor Yellow
Write-Host ""
Write-Host "Testaa API:t:" -ForegroundColor Cyan
Write-Host "curl 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test'" -ForegroundColor White
Write-Host "curl 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ConfigAPI?clientID=test'" -ForegroundColor White
