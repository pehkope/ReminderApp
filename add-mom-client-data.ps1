# Add Mom Client Data to Cosmos DB
# Aja Azure Cloud Shellissä tai PowerShellissä Azure CLI:n kanssa

param(
    [string]$SubscriptionName = "Enel-Virtual-desktop-Infrastructure",
    [string]$ResourceGroup = "ReminderAppDB",
    [string]$DatabaseAccount = "reminderappdb",
    [string]$DatabaseName = "ReminderAppDB"
)

Write-Host "🚀 Lisätään mom-client data Cosmos DB:hen..." -ForegroundColor Green

# Set subscription
az account set --subscription $SubscriptionName
Write-Host "✅ Subscription: $SubscriptionName" -ForegroundColor Green

# Mom client data
$momClientData = @'
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
  "contacts": {
    "primaryFamily": "Petri",
    "phone": "+358123456789",
    "emergencyContact": "+358123456789"
  },
  "createdAt": "2025-09-29T16:00:00Z",
  "updatedAt": "2025-09-29T16:00:00Z"
}
'@

# Write to temp file
$tempFile = [System.IO.Path]::GetTempFileName()
$momClientData | Out-File -FilePath $tempFile -Encoding UTF8

try {
    Write-Host "📝 Lisätään mom-client..." -ForegroundColor Yellow
    
    az cosmosdb sql item create `
        --account-name $DatabaseAccount `
        --database-name $DatabaseName `
        --container-name "Clients" `
        --resource-group $ResourceGroup `
        --body @"$tempFile"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Mom-client lisätty onnistuneesti!" -ForegroundColor Green
    } else {
        Write-Host "❌ Virhe mom-clientin lisäämisessä!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Virhe: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    # Clean up temp file
    Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
}

Write-Host "🎉 Mom-client data lisätty! Testaa API:" -ForegroundColor Green
Write-Host "Invoke-RestMethod -Uri 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom' | Select-Object dailyTasks" -ForegroundColor Cyan
