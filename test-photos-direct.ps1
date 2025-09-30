# Test if photos exist in Cosmos DB and API can fetch them

Write-Host "🔍 Testataan valokuvien hakua Cosmos DB:stä..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check API response in detail
Write-Host "1️⃣ Testataan API:a yksityiskohtaisesti..." -ForegroundColor Yellow
Write-Host ""

$apiUrl = "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom"

try {
    $response = Invoke-RestMethod -Uri $apiUrl -Method Get
    
    Write-Host "📊 API vastaus:" -ForegroundColor Cyan
    Write-Host "   Storage: $($response.storage)" -ForegroundColor White
    Write-Host "   Client ID: $($response.clientID)" -ForegroundColor White
    Write-Host ""
    
    if ($response.dailyPhotoUrl) {
        Write-Host "✅ KUVA LÖYTYI!" -ForegroundColor Green
        Write-Host "   URL: $($response.dailyPhotoUrl)" -ForegroundColor White
        Write-Host "   Caption: $($response.dailyPhotoCaption)" -ForegroundColor White
    } else {
        Write-Host "❌ KUVAA EI LÖYDY API:sta" -ForegroundColor Red
        Write-Host ""
        Write-Host "🔍 Tarkista:" -ForegroundColor Yellow
        Write-Host "   1. Ovatko kuvat oikeasti Cosmos DB:ssä?" -ForegroundColor White
        Write-Host "      → Azure Portal → Cosmos DB → reminderappdb → Data Explorer" -ForegroundColor Gray
        Write-Host "      → Photos container → Items" -ForegroundColor Gray
        Write-Host "      → Pitäisi näkyä 26 dokumenttia (photo_mom_001...026)" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   2. Jos kuvat OVAT Cosmos DB:ssä, restart Function App:" -ForegroundColor White
        Write-Host "      → Azure Portal → Function App → reminderapp-functions" -ForegroundColor Gray
        Write-Host "      → Overview → Restart" -ForegroundColor Gray
        Write-Host ""
    }
    
    # Show full response for debugging
    Write-Host ""
    Write-Host "📝 Koko API vastaus tallennettu: photos-test-response.json" -ForegroundColor Gray
    $response | ConvertTo-Json -Depth 10 | Out-File -FilePath "photos-test-response.json" -Encoding UTF8
    
} catch {
    Write-Host "❌ VIRHE API-kutsussa!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📋 SEURAAVAT ASKELEET:" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan

if ($response.dailyPhotoUrl) {
    Write-Host "✅ Kuvat toimivat! Jatketaan aktiviteetteihin:" -ForegroundColor Green
    Write-Host "   1. Lisää aktiviteetit Cosmos DB:hen" -ForegroundColor White
    Write-Host "   2. Päivitä API käyttämään aktiviteetteja" -ForegroundColor White
} else {
    Write-Host "⚠️  Tarkista kuvat ensin:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "VAIHTOEHTO A: Kuvat EI OLE vielä Cosmos DB:ssä" -ForegroundColor Cyan
    Write-Host "   → Lisää ne Azure Portalissa manuaalisesti" -ForegroundColor White
    Write-Host "   → Tai käytä REST API -scriptiä" -ForegroundColor White
    Write-Host ""
    Write-Host "VAIHTOEHTO B: Kuvat OVAT Cosmos DB:ssä" -ForegroundColor Cyan
    Write-Host "   → Restart Function App Azure Portalissa" -ForegroundColor White
    Write-Host "   → Odota 1-2 min ja testaa uudelleen" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "💬 Kerro:" -ForegroundColor Yellow
Write-Host "   - Näkyvätkö kuvat Cosmos DB:n Data Explorerissa?" -ForegroundColor White
Write-Host "   - Montako kuva-dokumenttia näkyy?" -ForegroundColor White
