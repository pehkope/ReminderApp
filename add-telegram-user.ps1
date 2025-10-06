# Add new Telegram user to whitelist
# Usage: .\add-telegram-user.ps1 -ChatId "123456789" -Name "Liisa"

param(
    [Parameter(Mandatory=$true)]
    [string]$ChatId,
    
    [Parameter(Mandatory=$false)]
    [string]$Name = "Unknown"
)

Write-Host "👤 Lisätään uusi käyttäjä Telegram whitelistiin..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Nimi: $Name" -ForegroundColor White
Write-Host "Chat ID: $ChatId" -ForegroundColor White
Write-Host ""

# Get current whitelist
Write-Host "1️⃣ Haetaan nykyinen whitelist..." -ForegroundColor Yellow
$currentSettings = az functionapp config appsettings list `
    --name "ReminderApp-Functions" `
    --resource-group "ReminderApp-RG" `
    --query "[?name=='TELEGRAM_ALLOWED_CHAT_IDS'].value" `
    --output tsv

if ($currentSettings) {
    Write-Host "   Nykyinen: $currentSettings" -ForegroundColor Gray
    $newWhitelist = "$currentSettings,$ChatId"
} else {
    Write-Host "   Whitelist tyhjä, luodaan uusi" -ForegroundColor Gray
    $newWhitelist = $ChatId
}

Write-Host ""
Write-Host "2️⃣ Päivitetään whitelist..." -ForegroundColor Yellow
Write-Host "   Uusi: $newWhitelist" -ForegroundColor Gray

az functionapp config appsettings set `
    --name "ReminderApp-Functions" `
    --resource-group "ReminderApp-RG" `
    --settings "TELEGRAM_ALLOWED_CHAT_IDS=$newWhitelist" `
    --output none

Write-Host "   ✅ Päivitetty!" -ForegroundColor Green
Write-Host ""

Write-Host "3️⃣ Restartataan Function App..." -ForegroundColor Yellow
az functionapp restart `
    --name "ReminderApp-Functions" `
    --resource-group "ReminderApp-RG" `
    --output none

Write-Host "   ✅ Restarted!" -ForegroundColor Green
Write-Host ""

Write-Host "⏰ Odotetaan 10 sekuntia..." -ForegroundColor Gray
Start-Sleep -Seconds 10
Write-Host ""

Write-Host "🎉 VALMIS!" -ForegroundColor Green
Write-Host ""
Write-Host "✅ $Name (Chat ID: $ChatId) lisätty whitelistiin!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 $Name voi nyt:" -ForegroundColor Cyan
Write-Host "   - Lähettää kuvia @AnneliPBot:lle" -ForegroundColor White
Write-Host "   - Lähettää viestejä" -ForegroundColor White
Write-Host "   - Kuvat ja viestit näkyvät PWA:ssa" -ForegroundColor White
Write-Host ""
Write-Host "💡 Nykyinen whitelist:" -ForegroundColor Yellow
Write-Host "   $newWhitelist" -ForegroundColor White

