# Create mom's photos data for Cosmos DB
# Supports both Google Drive and Azure Blob Storage URLs
# 
# Architecture:
# 1. Google Drive (current): url field
# 2. Azure Blob Storage (future): blobUrl field
# 3. Telegram (future): blobUrl + telegramFileId + source="telegram"
#
# API priority: blobUrl → url → empty string

Write-Host "📸 Luodaan mom:n valokuva-dokumentit Cosmos DB:hin..." -ForegroundColor Cyan
Write-Host "   Tukee: Google Drive, Azure Blob Storage, Telegram" -ForegroundColor Gray
Write-Host ""

# Photo data from Google Drive
$photos = @(
    @{ url = "https://drive.google.com/thumbnail?id=1-C_GAzA6QP7UDIfDU2VgYxyd3ZcWwELw"; caption = "Äiti, Petri ja Tiitta euroopan kiertueella" },
    @{ url = "https://drive.google.com/thumbnail?id=13bnl5gdYaUzj591PulJJsORr28RK6AHu"; caption = "Joensuun mummi, Petri ja Tiitta" },
    @{ url = "https://drive.google.com/thumbnail?id=1Dp2KrOUMGr1tR8zWBAUODDlY1uZ-bymL"; caption = "Äiti ja Asta Kostamo Kilpisjärvellä" },
    @{ url = "https://drive.google.com/thumbnail?id=1uiP0mA3WTJmEdQKu6Aor7ex0TUKhI4yN"; caption = "Pehkoset ja Kostamot Kilpisjärvellä" },
    @{ url = "https://drive.google.com/thumbnail?id=13yTXPhaFwsQhZAb7IvPG4msh7Us4B73W"; caption = "Petri" },
    @{ url = "https://drive.google.com/thumbnail?id=14zyxO39JwagjzsUDnEk4psrEfdtAIwTG"; caption = "Äiti, Petri ja Tiitta" },
    @{ url = "https://drive.google.com/thumbnail?id=1LFp6yUXtCrEbP2sGFUBSBbRrfJEujYxY"; caption = "Äiti, Petri ja Tiitta" },
    @{ url = "https://drive.google.com/thumbnail?id=1khLG2HcfgcUrJPkDdGSuu2i_6OTpcPiO"; caption = "Airi ja Petri" },
    @{ url = "https://drive.google.com/thumbnail?id=1dGWsX6Jn8oBdRGfVorY2B-hiGF4dZyM2"; caption = "Äiti, Petri, Tiitta ja Raili (lastenhoitaja / sukulainen)" },
    @{ url = "https://drive.google.com/thumbnail?id=1f61SLOOH7dxax7tiGq1iiXI9otOMP4mq"; caption = "Isä ja Tiitta" },
    @{ url = "https://drive.google.com/thumbnail?id=1lsQ5-bEz0odiy7yyz-yDfyyUTX5BG_W1"; caption = "Ukki ja sen isä sekä ukin veli (Kangasniemi)" },
    @{ url = "https://drive.google.com/thumbnail?id=1D2IN2wNB4JE1OAURQdo4fGjTGm8GY7is"; caption = "Isän vanhemmat  eli Juho ja Eeva" },
    @{ url = "https://drive.google.com/thumbnail?id=1oZMT7tyOEU7nHwW7HLwEavBQo1I6wC7B"; caption = "Kajoo - navetta" },
    @{ url = "https://drive.google.com/thumbnail?id=1OpX1h-HTKj9PVgWBCr3fzrU2aObIicMh"; caption = "Tiitta" },
    @{ url = "https://drive.google.com/thumbnail?id=1qN9ko3DFUpToOGFpFVGADmqQNEKc9UPZ"; caption = "Petri ja Tiitta Aittolammella" },
    @{ url = "https://drive.google.com/thumbnail?id=1S2UjtmLOR1kIk8ziI_ubWCCVi3YeFCPO"; caption = "Malmin kavereita" },
    @{ url = "https://drive.google.com/thumbnail?id=1RydqtIGmfduqvxlPfUJ4DO68--qXkaMf"; caption = "Tiitta" },
    @{ url = "https://drive.google.com/thumbnail?id=1DtnX3ShL8bhBqKbNSB76TjWkYrGTJ10K"; caption = "Äiti, Petri ja Tiitta Juuassa (Kajoo)" },
    @{ url = "https://drive.google.com/thumbnail?id=1CRYAeHKySiZ7QGGmoO8XgGQRCRhuqgPq"; caption = "Malmilla hiekkalaatikolla" },
    @{ url = "https://drive.google.com/thumbnail?id=1bQXgA47Ly9LRgugi0pTom0xzeJQnaLyx"; caption = "Toivon lapsia (meidän serkkuja)" },
    @{ url = "https://drive.google.com/thumbnail?id=1uRT3QXa77J7ajWmxNXHI4dLwWx0jWTu2"; caption = "Liisa (täti), Petri ja Tiitta" },
    @{ url = "https://drive.google.com/thumbnail?id=18lkhB90VPj2UHr-SUNLbdA2-Svw62ywX"; caption = "Serjon perhe, mummi ja äiti sekä Kukkoset" },
    @{ url = "https://drive.google.com/thumbnail?id=1nDrMukpljNk5pQ9NCSyfzaXPuIvl4rBJ"; caption = "Äiti, Petri ja Tiitta" },
    @{ url = "https://drive.google.com/thumbnail?id=1A_gV4isk3ONeDLnJiv_Yk7ry3s-13bsb"; caption = "Petri ja Tiitta Malmilla" },
    @{ url = "https://drive.google.com/thumbnail?id=1b19jQt8YqUCbFhuAZKsJqqW2n7bOYzI5"; caption = "Isä ja Tiitta tai Petri" },
    @{ url = "https://drive.google.com/thumbnail?id=1_9SeYaRC16MEs-dzpeZK8fGhwGr5trJi"; caption = "Äiti, Petri ja Tiitta Jukan-Salpan takapihalla" }
)

$timestamp = Get-Date -Format "o"
$photoDocuments = @()

Write-Host "Luodaan $($photos.Count) valokuva-dokumenttia..." -ForegroundColor Yellow

for ($i = 0; $i -lt $photos.Count; $i++) {
    $photo = $photos[$i]
    $photoId = "photo_mom_{0:D3}" -f ($i + 1)
    
    $doc = @{
        id = $photoId
        clientId = "mom"
        type = "photo"
        fileName = ""
        blobUrl = ""  # Azure Blob Storage URL (jos käytössä)
        thumbnailUrl = ""
        url = $photo.url  # Google Drive URL (nykyinen)
        caption = $photo.caption
        uploadedAt = $timestamp
        uploadedBy = "petri"
        uploadSource = "google_drive"
        source = "google-drive"  # "google-drive", "blob-storage", "telegram"
        telegramFileId = $null
        senderName = $null
        senderChatId = $null
        createdAt = $timestamp
        fileSize = 0
        mimeType = "image/jpeg"
        isActive = $true
        tags = @("family", "memories", "historical")
    } | ConvertTo-Json -Depth 3
    
    $photoDocuments += $doc
    
    # Save individual file
    $filename = "photo-mom-{0:D3}.json" -f ($i + 1)
    $doc | Out-File -FilePath $filename -Encoding UTF8 -NoNewline
}

Write-Host ""
Write-Host "✅ Luotu $($photos.Count) JSON-tiedostoa!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Lisää kuvat Azure Portalissa:" -ForegroundColor Cyan
Write-Host "   1. Data Explorer → ReminderAppDB → Photos" -ForegroundColor White
Write-Host "   2. New Item → Kopioi photo-mom-001.json sisältö → Save" -ForegroundColor White
Write-Host "   3. Toista kaikille 26 kuvalle..." -ForegroundColor White
Write-Host ""
Write-Host "TAI kopioi kaikki kerralla:" -ForegroundColor Yellow
Write-Host "   - Avaa photo-mom-001.json" -ForegroundColor White
Write-Host "   - Kopioi sisältö" -ForegroundColor White
Write-Host "   - Lisää Photos-containeriin" -ForegroundColor White
Write-Host "   - Toista photo-mom-002.json, 003, jne..." -ForegroundColor White
Write-Host ""
Write-Host "🧪 Testaa kun olet lisännyt muutaman kuvan:" -ForegroundColor Cyan
Write-Host "Invoke-RestMethod -Uri 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom' | Select-Object dailyPhotoUrl, dailyPhotoCaption" -ForegroundColor Blue
