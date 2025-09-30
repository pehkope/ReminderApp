# Lisää mom-client data suoraan Cosmos DB:hen (Azure Portal / Azure CLI)
# YKSINKERTAINEN VERSIO - Ei Google Sheets:iä!

Write-Host "🚀 Lisätään mom-client Cosmos DB:hen..." -ForegroundColor Cyan
Write-Host ""

# Mom Client JSON
$momClientJson = @'
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
      "12:00": "lounas",
      "16:00": "päivällinen",
      "20:00": "iltapala"
    }
  },
  "createdAt": "2025-09-30T10:00:00Z",
  "updatedAt": "2025-09-30T10:00:00Z"
}
'@

Write-Host "📋 Mom-client JSON:" -ForegroundColor Yellow
$momClientJson | Write-Host
Write-Host ""

# Tallennetaan tiedostoon
$momClientJson | Out-File -FilePath "mom-client.json" -Encoding UTF8 -NoNewline

Write-Host "✅ Tallennettu: mom-client.json" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Lisää tämä Cosmos DB:hen:" -ForegroundColor Cyan
Write-Host "   1. Azure Portal: https://portal.azure.com" -ForegroundColor White
Write-Host "   2. Cosmos DB Account: reminderappdb" -ForegroundColor White
Write-Host "   3. Database: ReminderAppDB" -ForegroundColor White
Write-Host "   4. Container: Clients" -ForegroundColor White
Write-Host "   5. New Item → Kopioi mom-client.json sisältö" -ForegroundColor White
Write-Host "   6. Save" -ForegroundColor White
Write-Host ""
Write-Host "TAI Azure CLI:llä (jos toimii):" -ForegroundColor Cyan
Write-Host "az cosmosdb sql item create --account-name reminderappdb --database-name ReminderAppDB --container-name Clients --resource-group ReminderAppDB --body @mom-client.json" -ForegroundColor Blue
Write-Host ""
Write-Host "🧪 Testaa lisäämisen jälkeen:" -ForegroundColor Yellow
Write-Host "Invoke-RestMethod -Uri 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?client=mom' | Select-Object clientID, storage, dailyTasks" -ForegroundColor Blue
