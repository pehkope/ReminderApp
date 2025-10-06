# Get Chat IDs from Telegram Bot
# Näyttää ketkä ovat lähettäneet viestejä botille ja heidän Chat ID:nsä

param(
    [Parameter(Mandatory=$true)]
    [string]$BotToken
)

Write-Host "📋 Telegram Chat ID Collector" -ForegroundColor Cyan
Write-Host ""

# Hae viimeisimmät päivitykset
Write-Host "🔍 Haetaan viimeisimmät viestit..." -ForegroundColor Yellow
$getUpdatesUrl = "https://api.telegram.org/bot$BotToken/getUpdates"

try {
    $updates = Invoke-RestMethod -Uri $getUpdatesUrl
    
    if (-not $updates.ok) {
        Write-Host "❌ Virhe päivitysten haussa!" -ForegroundColor Red
        Write-Host $updates.description -ForegroundColor Red
        exit 1
    }

    if ($updates.result.Count -eq 0) {
        Write-Host "ℹ️ Ei viestejä. Pyydä perheenjäseniä lähettämään /start botille!" -ForegroundColor Yellow
        exit 0
    }

    Write-Host "✅ Löytyi $($updates.result.Count) viestiä" -ForegroundColor Green
    Write-Host ""

    # Kerää uniikit käyttäjät
    $uniqueUsers = @{}
    
    foreach ($update in $updates.result) {
        if ($update.message -and $update.message.from) {
            $chatId = $update.message.chat.id
            $firstName = $update.message.from.first_name
            $lastName = $update.message.from.last_name
            $username = $update.message.from.username
            
            $fullName = "$firstName"
            if ($lastName) { $fullName += " $lastName" }
            if ($username) { $fullName += " (@$username)" }
            
            if (-not $uniqueUsers.ContainsKey($chatId)) {
                $uniqueUsers[$chatId] = $fullName
            }
        }
    }

    # Näytä löydetyt käyttäjät
    Write-Host "👥 Löydetyt käyttäjät:" -ForegroundColor Cyan
    Write-Host ""
    
    $chatIdList = @()
    foreach ($chatId in $uniqueUsers.Keys) {
        $name = $uniqueUsers[$chatId]
        Write-Host "   $name" -ForegroundColor White
        Write-Host "   Chat ID: $chatId" -ForegroundColor Green
        Write-Host ""
        $chatIdList += $chatId
    }

    # Luo pilkuilla erotettu lista
    $chatIdString = $chatIdList -join ","
    
    Write-Host ""
    Write-Host "📋 Kopioi tämä Azure Function App:iin:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "TELEGRAM_ALLOWED_CHAT_IDS = $chatIdString" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 TAI käytä setup-scriptiä:" -ForegroundColor Cyan
    Write-Host ".\setup-annelipbot.ps1 -BotToken <TOKEN> -AllowedChatIds '$chatIdString'" -ForegroundColor Gray
    Write-Host ""

} catch {
    Write-Host "❌ Virhe!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

