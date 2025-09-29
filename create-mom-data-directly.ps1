# Create Mom Data Directly in Cosmos DB (No Google Sheets needed!)
# Aja Azure Cloud Shellissä tai PowerShellissä Azure CLI:n kanssa

param(
    [string]$SubscriptionName = "Enel-Virtual-desktop-Infrastructure",
    [string]$ResourceGroup = "ReminderAppDB",
    [string]$DatabaseAccount = "reminderappdb",
    [string]$DatabaseName = "ReminderAppDB"
)

Write-Host "🚀 Luodaan mom-client data suoraan Cosmos DB:hen (EI Google Sheets:iä tarvita)" -ForegroundColor Green

# Set subscription
az account set --subscription $SubscriptionName
Write-Host "✅ Subscription: $SubscriptionName" -ForegroundColor Green

# 1. Mom Client Configuration
Write-Host "1️⃣ Lisätään mom-client asetukset..." -ForegroundColor Cyan

$momClient = @'
{
  "id": "mom",
  "clientId": "mom",
  "type": "client",
  "name": "Äiti",
  "displayName": "Kultaseni",
  "timezone": "Europe/Helsinki",
  "language": "fi",
  "settings": {
    "useWeather": true,
    "usePhotos": true,
    "useTelegram": false,
    "useSMS": false,
    "useFoodReminders": true,
    "foodReminderType": "simple",
    "simpleReminderText": "Muista syödä",
    "mealTimes": {
      "08:00": "aamupala",
      "11:00": "lounas",
      "16:00": "päivällinen", 
      "20:00": "iltapala"
    }
  },
  "createdAt": "2025-09-29T16:00:00Z",
  "updatedAt": "2025-09-29T16:00:00Z"
}
'@

$tempFile1 = [System.IO.Path]::GetTempFileName()
$momClient | Out-File -FilePath $tempFile1 -Encoding UTF8

az cosmosdb sql item create `
    --account-name $DatabaseAccount `
    --database-name $DatabaseName `
    --container-name "Clients" `
    --resource-group $ResourceGroup `
    --body @"$tempFile1"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Mom-client lisätty!" -ForegroundColor Green
} else {
    Write-Host "❌ Mom-client lisääminen epäonnistui!" -ForegroundColor Red
}

# 2. Rikkaita ruokaehdotuksia (kuten Google Sheetsistä)
Write-Host "2️⃣ Lisätään ruokaehdotukset..." -ForegroundColor Cyan

$foods = @(
    @{
        id = "food_mom_breakfast"
        clientId = "mom"
        type = "food"
        mealTime = "breakfast"
        timeSlot = "08:00"
        date = (Get-Date).ToString("yyyy-MM-dd")
        suggestions = @("🥣 Kaurapuuro marjoilla", "🥛 Jogurtti + banaani", "🧀 Ruisleipä + juusto")
        encouragingMessage = "Hyvä! Kunnollinen aamupala antaa voimia päivään 🌅"
        completed = $false
    },
    @{
        id = "food_mom_lunch"
        clientId = "mom" 
        type = "food"
        mealTime = "lunch"
        timeSlot = "11:00"
        date = (Get-Date).ToString("yyyy-MM-dd")
        suggestions = @("🐟 Uunilohta + vihannekset", "🍲 Kasviskeitto + leipä", "🥗 Kanasalaatti")
        encouragingMessage = "Mahtavaa! Terveellinen lounas pitää voimat yllä 🍽️"
        completed = $false
    },
    @{
        id = "food_mom_dinner"
        clientId = "mom"
        type = "food" 
        mealTime = "dinner"
        timeSlot = "16:00"
        date = (Get-Date).ToString("yyyy-MM-dd")
        suggestions = @("🥗 Ruokaisa salaatti", "🍛 Broilerikastike + peruna", "🐟 Kalapihvit + perunamuusi")
        encouragingMessage = "Erinomaista! Herkullinen päivällinen odottaa 😊"
        completed = $false
    },
    @{
        id = "food_mom_evening"
        clientId = "mom"
        type = "food"
        mealTime = "evening" 
        timeSlot = "20:00"
        date = (Get-Date).ToString("yyyy-MM-dd")
        suggestions = @("🍶 Rahka marjoilla", "🥣 Viili + hedelmä", "🍎 Hedelmä + pieni jogurtti")
        encouragingMessage = "Hyvää! Kevyt iltapala auttaa nukkumaan paremmin 🌙"
        completed = $false
    }
)

foreach ($food in $foods) {
    $foodJson = $food | ConvertTo-Json -Depth 3
    $tempFile = [System.IO.Path]::GetTempFileName()
    $foodJson | Out-File -FilePath $tempFile -Encoding UTF8

    az cosmosdb sql item create `
        --account-name $DatabaseAccount `
        --database-name $DatabaseName `
        --container-name "Foods" `
        --resource-group $ResourceGroup `
        --body @"$tempFile"
    
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Ruokaehdotus lisätty: $($food.mealTime)" -ForegroundColor Green
    }
}

# 3. Lääkkeet (esimerkkidataa)
Write-Host "3️⃣ Lisätään lääkemuistutukset..." -ForegroundColor Cyan

$medications = @(
    @{
        id = "med_mom_morning"
        clientId = "mom"
        type = "medication"
        name = "Aamulääke"
        timeSlot = "08:00"
        time = "08:00"
        date = (Get-Date).ToString("yyyy-MM-dd")
        instructions = "Aamulla ruokailun yhteydessä"
        completed = $false
        recurring = $true
    },
    @{
        id = "med_mom_evening" 
        clientId = "mom"
        type = "medication"
        name = "Iltalääke"
        timeSlot = "18:00"
        time = "18:00"
        date = (Get-Date).ToString("yyyy-MM-dd")
        instructions = "Illalla ruokailun jälkeen"
        completed = $false
        recurring = $true
    }
)

foreach ($med in $medications) {
    $medJson = $med | ConvertTo-Json -Depth 3
    $tempFile = [System.IO.Path]::GetTempFileName()
    $medJson | Out-File -FilePath $tempFile -Encoding UTF8

    az cosmosdb sql item create `
        --account-name $DatabaseAccount `
        --database-name $DatabaseName `
        --container-name "Medications" `
        --resource-group $ResourceGroup `
        --body @"$tempFile"
    
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Lääkemuistutus lisätty: $($med.name)" -ForegroundColor Green
    }
}

# Cleanup
Remove-Item $tempFile1 -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "🎉 Kaikki data lisätty Cosmos DB:hen!" -ForegroundColor Green
Write-Host "💡 EI Google Sheets:iä tai GAS:ia tarvita!" -ForegroundColor Yellow
Write-Host ""
Write-Host "🧪 Testaa tulokset:" -ForegroundColor Cyan
Write-Host "Invoke-RestMethod -Uri 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom' | Select-Object dailyTasks, foods, medications" -ForegroundColor Blue
