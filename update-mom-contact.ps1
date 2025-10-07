# Päivitä äidin yhteyshenkilön tiedot
# Käyttö: .\update-mom-contact.ps1 -ContactId "contact_petri" -Phone "+358401234567"

param(
    [Parameter(Mandatory=$true)]
    [string]$ContactId,
    
    [Parameter(Mandatory=$false)]
    [string]$Phone,
    
    [Parameter(Mandatory=$false)]
    [string]$Email,
    
    [Parameter(Mandatory=$false)]
    [string]$TelegramChatId,
    
    [Parameter(Mandatory=$false)]
    [string]$Notes
)

$ErrorActionPreference = "Stop"

Write-Host "📝 Päivitetään yhteyshenkilö: $ContactId" -ForegroundColor Cyan

# 1. Lue client_mom_settings.json
$jsonPath = "client_mom_settings.json"
if (-not (Test-Path $jsonPath)) {
    Write-Host "❌ Tiedostoa ei löydy: $jsonPath" -ForegroundColor Red
    exit 1
}

$json = Get-Content $jsonPath -Raw | ConvertFrom-Json

# 2. Etsi yhteyshenkilö
$contact = $json.contacts | Where-Object { $_.id -eq $ContactId }
if (-not $contact) {
    Write-Host "❌ Yhteyshenkilöä ei löydy: $ContactId" -ForegroundColor Red
    Write-Host "Käytettävissä olevat ID:t:" -ForegroundColor Yellow
    $json.contacts | ForEach-Object { Write-Host "  - $($_.id): $($_.name)" }
    exit 1
}

Write-Host "✅ Löytyi: $($contact.name) ($($contact.relationship))" -ForegroundColor Green

# 3. Päivitä tiedot
$updated = $false
if ($Phone) {
    $contact.phone = $Phone
    Write-Host "  📞 Puhelin: $Phone" -ForegroundColor Cyan
    $updated = $true
}
if ($Email) {
    $contact.email = $Email
    Write-Host "  📧 Sähköposti: $Email" -ForegroundColor Cyan
    $updated = $true
}
if ($TelegramChatId) {
    $contact.telegramChatId = $TelegramChatId
    Write-Host "  💬 Telegram Chat ID: $TelegramChatId" -ForegroundColor Cyan
    $updated = $true
}
if ($Notes) {
    $contact.notes = $Notes
    Write-Host "  📝 Muistiinpanot: $Notes" -ForegroundColor Cyan
    $updated = $true
}

if (-not $updated) {
    Write-Host "⚠️ Mitään ei päivitetty. Käytä -Phone, -Email, -TelegramChatId tai -Notes parametreja." -ForegroundColor Yellow
    exit 0
}

# 4. Tallenna
$json | ConvertTo-Json -Depth 10 | Set-Content $jsonPath -Encoding UTF8
Write-Host "✅ Tiedot päivitetty ja tallennettu!" -ForegroundColor Green

# 5. Näytä yhteenveto
Write-Host ""
Write-Host "📊 Yhteyshenkilön tiedot:" -ForegroundColor Cyan
Write-Host "  Nimi: $($contact.name)" -ForegroundColor White
Write-Host "  Suhde: $($contact.relationship)" -ForegroundColor White
Write-Host "  Puhelin: $($contact.phone)" -ForegroundColor White
Write-Host "  Sähköposti: $($contact.email)" -ForegroundColor White
Write-Host "  Telegram: $($contact.telegramChatId)" -ForegroundColor White
Write-Host "  Muistiinpanot: $($contact.notes)" -ForegroundColor White
Write-Host ""

# 6. Kysy haluaako käyttäjä ladata Cosmos DB:hen
$upload = Read-Host "Haluatko ladata päivitetyt tiedot Cosmos DB:hen? (k/e)"
if ($upload -eq "k" -or $upload -eq "K") {
    Write-Host ""
    Write-Host "📤 Ladataan Cosmos DB:hen..." -ForegroundColor Cyan
    
    # Hae Cosmos DB connection string
    $cosmosConnection = az cosmosdb keys list `
        --name reminderapp-cosmos2025 `
        --resource-group ReminderApp-RG `
        --type connection-strings `
        --query "connectionStrings[0].connectionString" `
        -o tsv 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Cosmos DB connection stringin haku epäonnistui" -ForegroundColor Red
        exit 1
    }
    
    # TODO: Implementoi Cosmos DB upload
    # (Vaatii .NET SDK:n tai REST API kutsun)
    
    Write-Host "⚠️ Cosmos DB upload ei vielä toteutettu. Päivitä manuaalisesti tai käytä upload-client-cosmos.ps1" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ VALMIS!" -ForegroundColor Green

