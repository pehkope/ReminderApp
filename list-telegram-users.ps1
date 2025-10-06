# List all whitelisted Telegram users
# Usage: .\list-telegram-users.ps1

Write-Host "👥 Whitelistatut Telegram-käyttäjät" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Haetaan whitelist..." -ForegroundColor Yellow

$whitelist = az functionapp config appsettings list `
    --name "ReminderApp-Functions" `
    --resource-group "ReminderApp-RG" `
    --query "[?name=='TELEGRAM_ALLOWED_CHAT_IDS'].value" `
    --output tsv

if ([string]::IsNullOrEmpty($whitelist)) {
    Write-Host ""
    Write-Host "⚠️ Ei whitelistattuja käyttäjiä!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Lisää käyttäjiä komennolla:" -ForegroundColor Cyan
    Write-Host "   .\add-telegram-user.ps1 -ChatId '123456789' -Name 'Nimi'" -ForegroundColor White
    exit
}

Write-Host ""
Write-Host "✅ Whitelistatut Chat ID:t:" -ForegroundColor Green
Write-Host ""

$chatIds = $whitelist -split ","
$count = 0

foreach ($chatId in $chatIds) {
    $count++
    $trimmedId = $chatId.Trim()
    if (![string]::IsNullOrEmpty($trimmedId)) {
        Write-Host "   $count. Chat ID: $trimmedId" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "📊 Yhteensä: $count käyttäjää" -ForegroundColor Cyan
Write-Host ""

Write-Host "💡 Lisää uusi käyttäjä:" -ForegroundColor Yellow
Write-Host "   1. Pyydä lähettämään /myid @AnneliPBot:lle" -ForegroundColor White
Write-Host "   2. Aja: .\add-telegram-user.ps1 -ChatId 'XXXXXXX' -Name 'Nimi'" -ForegroundColor White
Write-Host ""

Write-Host "🗑️ Poista käyttäjä:" -ForegroundColor Yellow
Write-Host "   1. Muokkaa TELEGRAM_ALLOWED_CHAT_IDS Azure Portal:ssa" -ForegroundColor White
Write-Host "   2. Poista Chat ID listasta" -ForegroundColor White
Write-Host "   3. Restart Function App" -ForegroundColor White

