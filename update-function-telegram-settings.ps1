# Päivitä Telegram-asetukset Azure Function App:iin

$token = "7650897551:AAGdACo33Q37dhpUvvlg6XVTzYqjm5oR6xI"
$functionAppName = "reminderapp-functions2025"
$resourceGroup = "reminder-app-rg"

Write-Host "🔧 Päivitetään Telegram-asetukset..." -ForegroundColor Cyan
Write-Host ""

# Tarkista että Azure CLI on kirjautunut
Write-Host "1️⃣ Tarkistetaan Azure CLI..." -ForegroundColor Yellow
try {
    $account = az account show 2>$null | ConvertFrom-Json
    Write-Host "   ✅ Kirjautunut: $($account.name)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Kirjaudu ensin: az login" -ForegroundColor Red
    exit 1
}

# Aseta TELEGRAM_BOT_TOKEN
Write-Host ""
Write-Host "2️⃣ Asetetaan TELEGRAM_BOT_TOKEN..." -ForegroundColor Yellow
az functionapp config appsettings set `
    --name $functionAppName `
    --resource-group $resourceGroup `
    --settings "TELEGRAM_BOT_TOKEN=$token" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ TELEGRAM_BOT_TOKEN asetettu" -ForegroundColor Green
} else {
    Write-Host "   ❌ Virhe TELEGRAM_BOT_TOKEN:n asettamisessa" -ForegroundColor Red
}

# Aseta TELEGRAM_ALLOWED_CHAT_IDS (tyhjä = kaikki sallittu)
Write-Host ""
Write-Host "3️⃣ Asetetaan TELEGRAM_ALLOWED_CHAT_IDS (tyhjä)..." -ForegroundColor Yellow
az functionapp config appsettings set `
    --name $functionAppName `
    --resource-group $resourceGroup `
    --settings "TELEGRAM_ALLOWED_CHAT_IDS=" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ TELEGRAM_ALLOWED_CHAT_IDS asetettu (kaikki sallittu)" -ForegroundColor Green
    Write-Host "   💡 Lisää Chat ID:t myöhemmin whitelistiä varten" -ForegroundColor Gray
} else {
    Write-Host "   ❌ Virhe TELEGRAM_ALLOWED_CHAT_IDS:n asettamisessa" -ForegroundColor Red
}

# Restart Function App
Write-Host ""
Write-Host "4️⃣ Käynnistetään Function App uudelleen..." -ForegroundColor Yellow
az functionapp restart `
    --name $functionAppName `
    --resource-group $resourceGroup `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Function App käynnistetty uudelleen" -ForegroundColor Green
} else {
    Write-Host "   ⚠️ Ei voitu käynnistää uudelleen" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Valmis!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Seuraavat vaiheet:" -ForegroundColor Cyan
Write-Host "   1. Lähetä /start @AnneliPBot:lle Telegramissa" -ForegroundColor White
Write-Host "   2. Botti vastaa Chat ID:lläsi" -ForegroundColor White
Write-Host "   3. Lähetä kuva botille" -ForegroundColor White
Write-Host "   4. Tarkista PWA:ssa että kuva näkyy (15 min päivitys)" -ForegroundColor White
Write-Host ""
Write-Host "🔐 Whitelisting (myöhemmin):" -ForegroundColor Cyan
Write-Host "   .\get-telegram-chat-ids.ps1 -BotToken '$token'" -ForegroundColor Gray
Write-Host "   az functionapp config appsettings set --name $functionAppName --resource-group $resourceGroup --settings 'TELEGRAM_ALLOWED_CHAT_IDS=123,456,789'" -ForegroundColor Gray
Write-Host ""

