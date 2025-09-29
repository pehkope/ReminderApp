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

# 2. Yksinkertaiset ruokamuistutukset - vain "Muista syödä"
Write-Host "2️⃣ Lisätään yksinkertaiset ruokamuistutukset..." -ForegroundColor Cyan

# HUOM: Kellonajat ja nimet määritellään client settings:ssä (mealTimes)
# API luo automaattisesti simple food reminders näiden perusteella
# Ei tarvitse lisätä Foods-containeriin mitään - API hoitaa!

Write-Host "✅ Simple food reminders hoidetaan automaattisesti API:ssa client.settings.mealTimes:n perusteella" -ForegroundColor Green

# 3. Lääkkeet - äidille vain aamulla (skaalautuva muille asiakkaille)
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
    }
    # Äidille vain aamulla - muille asiakkaille voi olla useampia
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
Write-Host "🎉 Mom-client data lisätty Cosmos DB:hen!" -ForegroundColor Green
Write-Host "💡 EI Google Sheets:iä tai GAS:ia tarvita!" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Äidille määritelty:" -ForegroundColor Cyan
Write-Host "   🍽️  Simple food reminders: 08:00 aamupala, 11:00 lounas, 16:00 päivällinen, 20:00 iltapala" -ForegroundColor White
Write-Host "   💊 Lääkemuistutus: vain aamulla (08:00)" -ForegroundColor White
Write-Host "   📱 Viesti: 'Muista syödä' (ei rikkaita ehdotuksia)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Skaalautuvuus:" -ForegroundColor Green
Write-Host "   ✅ Muut asiakkaat voivat saada useampia lääkkeitä" -ForegroundColor White
Write-Host "   ✅ Kellonajat ja aterianimi muokattavia" -ForegroundColor White
Write-Host "   ✅ Yksinkertainen tai detailed food mode" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Testaa tulokset:" -ForegroundColor Cyan
Write-Host "Invoke-RestMethod -Uri 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom' | Select-Object dailyTasks, medications" -ForegroundColor Blue
