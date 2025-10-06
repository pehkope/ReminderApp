# Testaa ja korjaa Telegram Webhook
# Käyttö: .\test-telegram-webhook.ps1 -BotToken "YOUR_TOKEN"

param(
    [Parameter(Mandatory=$true)]
    [string]$BotToken
)

Write-Host "🔍 Telegram Webhook Diagnostics" -ForegroundColor Cyan
Write-Host ""

$webhookUrl = "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/telegram/webhook"

# 1. Tarkista Bot Token
Write-Host "1️⃣ Tarkistetaan Bot Token..." -ForegroundColor Yellow
$getMeUrl = "https://api.telegram.org/bot$BotToken/getMe"

try {
    $botInfo = Invoke-RestMethod -Uri $getMeUrl -ErrorAction Stop
    if ($botInfo.ok) {
        Write-Host "   ✅ Bot OK: @$($botInfo.result.username)" -ForegroundColor Green
        Write-Host "      Bot ID: $($botInfo.result.id)" -ForegroundColor Gray
        Write-Host "      Nimi: $($botInfo.result.first_name)" -ForegroundColor Gray
    } else {
        Write-Host "   ❌ Bot Token virheellinen!" -ForegroundColor Red
        Write-Host "      Virhe: $($botInfo.description)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ VIRHE: Ei voitu tarkistaa Bot Token:ia" -ForegroundColor Red
    Write-Host "      $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Tarkista:" -ForegroundColor Yellow
    Write-Host "   - Token on oikein kopio-liitetty" -ForegroundColor White
    Write-Host "   - Ei ylimääräisiä välilyöntejä" -ForegroundColor White
    Write-Host "   - Token on muotoa: 123456789:ABCdefGHI..." -ForegroundColor White
    exit 1
}

# 2. Tarkista nykyinen webhook
Write-Host ""
Write-Host "2️⃣ Tarkistetaan nykyinen webhook..." -ForegroundColor Yellow
$getWebhookUrl = "https://api.telegram.org/bot$BotToken/getWebhookInfo"

try {
    $webhookInfo = Invoke-RestMethod -Uri $getWebhookUrl -ErrorAction Stop
    if ($webhookInfo.ok) {
        if ([string]::IsNullOrEmpty($webhookInfo.result.url)) {
            Write-Host "   ℹ️ Webhook ei asetettu" -ForegroundColor Gray
        } else {
            Write-Host "   📍 Nykyinen webhook: $($webhookInfo.result.url)" -ForegroundColor White
            Write-Host "      Pending updates: $($webhookInfo.result.pending_update_count)" -ForegroundColor Gray
            
            if ($webhookInfo.result.last_error_date) {
                Write-Host "      ⚠️ Viimeisin virhe:" -ForegroundColor Yellow
                Write-Host "         $($webhookInfo.result.last_error_message)" -ForegroundColor Red
                Write-Host "         Aika: $(Get-Date -UnixTimeSeconds $webhookInfo.result.last_error_date)" -ForegroundColor Gray
            }
            
            if ($webhookInfo.result.url -ne $webhookUrl) {
                Write-Host "      ⚠️ Webhook URL on väärä!" -ForegroundColor Yellow
                Write-Host "         Pitäisi olla: $webhookUrl" -ForegroundColor White
            }
        }
    }
} catch {
    Write-Host "   ⚠️ Ei voitu hakea webhook-tietoja" -ForegroundColor Yellow
}

# 3. Poista vanha webhook
Write-Host ""
Write-Host "3️⃣ Poistetaan vanha webhook..." -ForegroundColor Yellow
$deleteWebhookUrl = "https://api.telegram.org/bot$BotToken/deleteWebhook"

try {
    $deleteResult = Invoke-RestMethod -Uri $deleteWebhookUrl -ErrorAction Stop
    if ($deleteResult.ok) {
        Write-Host "   ✅ Vanha webhook poistettu" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ Ei voitu poistaa vanhaa webhook:ia" -ForegroundColor Yellow
        Write-Host "      $($deleteResult.description)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ⚠️ Virhe webhook:in poistossa (voi olla OK)" -ForegroundColor Yellow
}

# 4. Testaa Function App endpoint
Write-Host ""
Write-Host "4️⃣ Testataan Function App endpoint..." -ForegroundColor Yellow

try {
    # Testaa että endpoint vastaa (voi antaa 400/405 mutta ei 404)
    $response = Invoke-WebRequest -Uri $webhookUrl -Method POST -ErrorAction SilentlyContinue
    Write-Host "   ℹ️ Endpoint vastasi (status: $($response.StatusCode))" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400 -or $statusCode -eq 405) {
        Write-Host "   ✅ Function App endpoint löytyy (vastaus: $statusCode)" -ForegroundColor Green
    } elseif ($statusCode -eq 404) {
        Write-Host "   ❌ Function App endpoint EI löydy (404)!" -ForegroundColor Red
        Write-Host "      URL: $webhookUrl" -ForegroundColor Gray
        Write-Host ""
        Write-Host "💡 Ratkaisut:" -ForegroundColor Yellow
        Write-Host "   1. Tarkista että Function App on deployd" -ForegroundColor White
        Write-Host "   2. Käy Azure Portal: Function App → Functions" -ForegroundColor White
        Write-Host "   3. Etsi: TelegramWebhook" -ForegroundColor White
        Write-Host "   4. Jos puuttuu → Deploy uudelleen GitHub Actions:lla" -ForegroundColor White
    } else {
        Write-Host "   ⚠️ Endpoint virhe: $statusCode" -ForegroundColor Yellow
    }
}

# 5. Aseta uusi webhook
Write-Host ""
Write-Host "5️⃣ Asetetaan uusi webhook..." -ForegroundColor Yellow

# Escape webhook URL properly
$setWebhookUrl = "https://api.telegram.org/bot$BotToken/setWebhook"
$body = @{
    url = $webhookUrl
    max_connections = 40
    drop_pending_updates = $true
} | ConvertTo-Json

try {
    $setResult = Invoke-RestMethod -Uri $setWebhookUrl -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    
    if ($setResult.ok) {
        Write-Host "   ✅ Webhook asetettu onnistuneesti!" -ForegroundColor Green
        Write-Host "      URL: $webhookUrl" -ForegroundColor White
    } else {
        Write-Host "   ❌ Webhook:in asettaminen epäonnistui!" -ForegroundColor Red
        Write-Host "      Virhe: $($setResult.description)" -ForegroundColor Red
        
        # Näytä yleisiä virhetilanteita
        Write-Host ""
        Write-Host "💡 Yleisimmät ongelmat:" -ForegroundColor Yellow
        
        if ($setResult.description -like "*certificate*") {
            Write-Host "   - SSL-sertifikaatti ongelma" -ForegroundColor White
            Write-Host "     → Azure Functions pitäisi olla HTTPS (OK)" -ForegroundColor Gray
        }
        
        if ($setResult.description -like "*url*" -or $setResult.description -like "*format*") {
            Write-Host "   - URL muoto väärä" -ForegroundColor White
            Write-Host "     → Tarkista että URL alkaa https://" -ForegroundColor Gray
        }
        
        if ($setResult.description -like "*port*") {
            Write-Host "   - Portti ongelma (pitää olla 443, 80, 88 tai 8443)" -ForegroundColor White
            Write-Host "     → Azure Functions käyttää 443 (OK)" -ForegroundColor Gray
        }
        
        exit 1
    }
} catch {
    Write-Host "   ❌ KRIITTINEN VIRHE webhook:in asettamisessa" -ForegroundColor Red
    Write-Host "      $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 6. Vahvista webhook
Write-Host ""
Write-Host "6️⃣ Vahvistetaan webhook..." -ForegroundColor Yellow

Start-Sleep -Seconds 2

try {
    $verifyInfo = Invoke-RestMethod -Uri $getWebhookUrl -ErrorAction Stop
    if ($verifyInfo.ok -and $verifyInfo.result.url -eq $webhookUrl) {
        Write-Host "   ✅ Webhook vahvistettu!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Webhook tiedot:" -ForegroundColor Cyan
        Write-Host "   URL: $($verifyInfo.result.url)" -ForegroundColor White
        Write-Host "   Has custom certificate: $($verifyInfo.result.has_custom_certificate)" -ForegroundColor Gray
        Write-Host "   Pending update count: $($verifyInfo.result.pending_update_count)" -ForegroundColor Gray
        Write-Host "   Max connections: $($verifyInfo.result.max_connections)" -ForegroundColor Gray
        
        if ($verifyInfo.result.allowed_updates) {
            Write-Host "   Allowed updates: $($verifyInfo.result.allowed_updates -join ', ')" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️ Webhook asetettu mutta URL ei täsmää" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️ Ei voitu vahvistaa webhook:ia" -ForegroundColor Yellow
}

# 7. Yhteenveto
Write-Host ""
Write-Host "🎉 Valmis!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Seuraavat askeleet:" -ForegroundColor Cyan
Write-Host "   1. Lähetä /start botille Telegramissa" -ForegroundColor White
Write-Host "   2. Jos botti ei vastaa → tarkista Function App lokit" -ForegroundColor White
Write-Host "   3. Azure Portal → Function App → Log stream" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Testaa webhook:" -ForegroundColor Cyan
Write-Host "   .\send-test-message.ps1 -BotToken '$BotToken' -ChatId <YOUR_CHAT_ID>" -ForegroundColor Gray
Write-Host ""

