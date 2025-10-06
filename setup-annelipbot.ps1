# AnneliPBot Setup Script
# Automatisoi Telegram Bot webhookin ja Azure Function App:n konfiguroinnin

param(
    [Parameter(Mandatory=$true)]
    [string]$BotToken,
    
    [Parameter(Mandatory=$false)]
    [string]$AllowedChatIds = "",
    
    [string]$FunctionAppName = "reminderapp-functions",
    [string]$ResourceGroup = "reminder-app-rg"
)

Write-Host "🤖 AnneliPBot Setup Script" -ForegroundColor Cyan
Write-Host ""

# 1. Tarkista Bot Token
Write-Host "1️⃣ Tarkistetaan Bot Token..." -ForegroundColor Yellow
$botInfoUrl = "https://api.telegram.org/bot$BotToken/getMe"

try {
    $botInfo = Invoke-RestMethod -Uri $botInfoUrl
    if ($botInfo.ok) {
        Write-Host "✅ Bot löytyi: @$($botInfo.result.username)" -ForegroundColor Green
    } else {
        Write-Host "❌ Virheellinen Bot Token!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Virhe Bot Token:in tarkistuksessa!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# 2. Aseta Webhook
Write-Host ""
Write-Host "2️⃣ Asetetaan Telegram Webhook..." -ForegroundColor Yellow
$webhookUrl = "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/telegram/webhook"
$setWebhookUrl = "https://api.telegram.org/bot$BotToken/setWebhook?url=$webhookUrl"

try {
    $webhookResult = Invoke-RestMethod -Uri $setWebhookUrl
    if ($webhookResult.ok) {
        Write-Host "✅ Webhook asetettu: $webhookUrl" -ForegroundColor Green
    } else {
        Write-Host "❌ Webhook:in asettaminen epäonnistui!" -ForegroundColor Red
        Write-Host $webhookResult.description -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Virhe Webhook:in asettamisessa!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# 3. Päivitä Azure Function App asetukset
Write-Host ""
Write-Host "3️⃣ Päivitetään Azure Function App asetuksia..." -ForegroundColor Yellow

try {
    # Tarkista että Azure CLI on asennettu
    $azVersion = az version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Azure CLI ei ole asennettu!" -ForegroundColor Red
        Write-Host "💡 Asenna: https://aka.ms/installazurecliwindows" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📝 Lisää asetukset manuaalisesti Azure Portal:ssa:" -ForegroundColor Cyan
        Write-Host "   1. Function App: $FunctionAppName" -ForegroundColor White
        Write-Host "   2. Settings → Environment variables" -ForegroundColor White
        Write-Host "   3. Lisää:" -ForegroundColor White
        Write-Host "      TELEGRAM_BOT_TOKEN = $BotToken" -ForegroundColor Gray
        Write-Host "      TELEGRAM_ALLOWED_CHAT_IDS = $AllowedChatIds" -ForegroundColor Gray
        exit 1
    }

    # Aseta Bot Token
    Write-Host "   Asetetaan TELEGRAM_BOT_TOKEN..." -ForegroundColor Gray
    az functionapp config appsettings set `
        --name $FunctionAppName `
        --resource-group $ResourceGroup `
        --settings "TELEGRAM_BOT_TOKEN=$BotToken" `
        --output none

    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ TELEGRAM_BOT_TOKEN asetettu" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Ei voitu asettaa TELEGRAM_BOT_TOKEN automaattisesti" -ForegroundColor Yellow
    }

    # Aseta Allowed Chat IDs (jos annettu)
    if (-not [string]::IsNullOrEmpty($AllowedChatIds)) {
        Write-Host "   Asetetaan TELEGRAM_ALLOWED_CHAT_IDS..." -ForegroundColor Gray
        az functionapp config appsettings set `
            --name $FunctionAppName `
            --resource-group $ResourceGroup `
            --settings "TELEGRAM_ALLOWED_CHAT_IDS=$AllowedChatIds" `
            --output none

        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ TELEGRAM_ALLOWED_CHAT_IDS asetettu: $AllowedChatIds" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️ Ei voitu asettaa TELEGRAM_ALLOWED_CHAT_IDS automaattisesti" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   ℹ️ TELEGRAM_ALLOWED_CHAT_IDS ei asetettu (sallitaan kaikki)" -ForegroundColor Gray
    }

    # Restart Function App
    Write-Host ""
    Write-Host "   Käynnistetään Function App uudelleen..." -ForegroundColor Gray
    az functionapp restart `
        --name $FunctionAppName `
        --resource-group $ResourceGroup `
        --output none

    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Function App käynnistetty uudelleen" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Ei voitu käynnistää Function App:ia uudelleen automaattisesti" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Virhe Azure Function App:in päivityksessä!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# 4. Tarkista Webhook Status
Write-Host ""
Write-Host "4️⃣ Tarkistetaan Webhook Status..." -ForegroundColor Yellow
$webhookInfoUrl = "https://api.telegram.org/bot$BotToken/getWebhookInfo"

try {
    $webhookInfo = Invoke-RestMethod -Uri $webhookInfoUrl
    if ($webhookInfo.ok) {
        Write-Host "✅ Webhook Status:" -ForegroundColor Green
        Write-Host "   URL: $($webhookInfo.result.url)" -ForegroundColor White
        Write-Host "   Pending updates: $($webhookInfo.result.pending_update_count)" -ForegroundColor White
        Write-Host "   Max connections: $($webhookInfo.result.max_connections)" -ForegroundColor White
        
        if ($webhookInfo.result.last_error_date) {
            Write-Host "   ⚠️ Last error: $($webhookInfo.result.last_error_message)" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Virhe Webhook Status:n tarkistuksessa!" -ForegroundColor Red
}

# 5. Yhteenveto
Write-Host ""
Write-Host "🎉 Setup valmis!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Yhteenveto:" -ForegroundColor Cyan
Write-Host "   Bot: @$($botInfo.result.username)" -ForegroundColor White
Write-Host "   Webhook: $webhookUrl" -ForegroundColor White
Write-Host "   Function App: $FunctionAppName" -ForegroundColor White

if (-not [string]::IsNullOrEmpty($AllowedChatIds)) {
    Write-Host "   Sallitut Chat ID:t: $AllowedChatIds" -ForegroundColor White
} else {
    Write-Host "   Sallitut Chat ID:t: KAIKKI (ei rajoitusta)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Seuraavat vaiheet:" -ForegroundColor Cyan
Write-Host "   1. Perheenjäsenet lähettävät /start botille" -ForegroundColor White
Write-Host "   2. Botti näyttää heidän Chat ID:nsä" -ForegroundColor White
Write-Host "   3. Lisää Chat ID:t TELEGRAM_ALLOWED_CHAT_IDS:iin" -ForegroundColor White
Write-Host "   4. Käynnistä script uudelleen -AllowedChatIds parametrilla:" -ForegroundColor White
Write-Host "      .\setup-annelipbot.ps1 -BotToken <TOKEN> -AllowedChatIds '123,456,789'" -ForegroundColor Gray
Write-Host ""
Write-Host "🧪 Testaa:" -ForegroundColor Cyan
Write-Host "   1. Lähetä kuva botille" -ForegroundColor White
Write-Host "   2. Tarkista PWA:ssa että kuva näkyy" -ForegroundColor White
Write-Host "   3. Lähetä tekstiviesti botille" -ForegroundColor White
Write-Host "   4. Tarkista PWA:ssa että viesti näkyy" -ForegroundColor White
Write-Host ""

