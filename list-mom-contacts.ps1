# Listaa äidin kaikki yhteyshenkilöt
# Käyttö: .\list-mom-contacts.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "👥 ÄIDIN YHTEYSHENKILÖT" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Lue client_mom_settings.json
$jsonPath = "client_mom_settings.json"
if (-not (Test-Path $jsonPath)) {
    Write-Host "❌ Tiedostoa ei löydy: $jsonPath" -ForegroundColor Red
    exit 1
}

$json = Get-Content $jsonPath -Raw | ConvertFrom-Json

# Ryhmittele kontaktit
$family = @()
$friends = @()

foreach ($contact in $json.contacts) {
    if ($contact.relationship -match "Poika|Tytär|Lapsenlapsi|Sisar") {
        $family += $contact
    } else {
        $friends += $contact
    }
}

# Näytä perhe
Write-Host "👨‍👩‍👧‍👦 PERHE ($($family.Count) henkilöä):" -ForegroundColor Yellow
Write-Host ""
foreach ($contact in $family) {
    $primaryBadge = if ($contact.isPrimary) { " ⭐" } else { "" }
    $alertBadge = if ($contact.canReceiveAlerts) { " 🔔" } else { "" }
    
    Write-Host "  $($contact.name)$primaryBadge$alertBadge" -ForegroundColor White
    Write-Host "    Suhde: $($contact.relationship)" -ForegroundColor Gray
    Write-Host "    Puhelin: $($contact.phone)" -ForegroundColor Gray
    
    if ($contact.email) {
        Write-Host "    Sähköposti: $($contact.email)" -ForegroundColor Gray
    }
    if ($contact.telegramChatId) {
        Write-Host "    Telegram: $($contact.telegramChatId)" -ForegroundColor Gray
    }
    if ($contact.notes) {
        Write-Host "    📝 $($contact.notes)" -ForegroundColor Cyan
    }
    Write-Host ""
}

# Näytä ystävät
if ($friends.Count -gt 0) {
    Write-Host "👥 YSTÄVÄT ($($friends.Count) henkilöä):" -ForegroundColor Yellow
    Write-Host ""
    foreach ($contact in $friends) {
        Write-Host "  $($contact.name)" -ForegroundColor White
        Write-Host "    Puhelin: $($contact.phone)" -ForegroundColor Gray
        
        if ($contact.email) {
            Write-Host "    Sähköposti: $($contact.email)" -ForegroundColor Gray
        }
        if ($contact.notes) {
            Write-Host "    📝 $($contact.notes)" -ForegroundColor Cyan
        }
        Write-Host ""
    }
}

Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "YHTEENSÄ: $($json.contacts.Count) yhteyshenkilöä" -ForegroundColor Green
Write-Host ""

# Näytä Quick Call preview
Write-Host "📞 QUICK CALL NAPIT (PWA alapalkki):" -ForegroundColor Cyan
$primary = $json.contacts | Where-Object { $_.isPrimary } | Select-Object -First 1
$topFriends = $friends | Select-Object -First 3

$quickCallList = @()
if ($primary) { $quickCallList += $primary }
$quickCallList += $topFriends

Write-Host "  " -NoNewline
foreach ($contact in $quickCallList) {
    Write-Host "[☎️ $($contact.name)]  " -NoNewline -ForegroundColor White
}
Write-Host ""
Write-Host ""

# Tarkista puuttuvat tiedot
Write-Host "⚠️ TARKISTUS:" -ForegroundColor Yellow
$missingPhone = $json.contacts | Where-Object { $_.phone -eq "+358XXXXXXXXX" }
if ($missingPhone.Count -gt 0) {
    Write-Host "  📞 Puhelinnumero puuttuu: $($missingPhone.Count) henkilöltä" -ForegroundColor Yellow
    foreach ($contact in $missingPhone) {
        Write-Host "    - $($contact.name) ($($contact.id))" -ForegroundColor Gray
    }
}

$missingTelegram = $json.contacts | Where-Object { $_.canReceiveAlerts -and -not $_.telegramChatId }
if ($missingTelegram.Count -gt 0) {
    Write-Host "  💬 Telegram Chat ID puuttuu: $($missingTelegram.Count) henkilöltä" -ForegroundColor Yellow
    foreach ($contact in $missingTelegram) {
        Write-Host "    - $($contact.name) (hälytykset käytössä, mutta ei Telegram ID:tä)" -ForegroundColor Gray
    }
}

Write-Host ""

