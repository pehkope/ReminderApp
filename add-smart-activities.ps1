# Create smart weather-based activity suggestions for mom
# 4 times per day: morning (8:00), noon (12:00), afternoon (16:00), evening (20:00)

Write-Host "🎯 Luodaan älykkäät sääperusteiset aktiviteettiehdotukset..." -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "o"

# AAMUAKTIVITEETIT (8:00) - Sisällä
$morningInside = @(
    @{ text = "Rauhallinen lehden luku 10–15 min 🗞️"; icon = "📰" },
    @{ text = "Kevyt venyttely 5–10 min 🤸‍♀️"; icon = "🧘" },
    @{ text = "Hengitysharjoitus (4–6 hengitystä, 3 kierrosta) 🌬️"; icon = "🌬️" },
    @{ text = "Ikkunasta maisemia katsellen 5 min 👀"; icon = "🪟" },
    @{ text = "Lempimusiikkia 10 min 🎶"; icon = "🎵" },
    @{ text = "Valokuvien selailu 10 min 🖼️"; icon = "📸" },
    @{ text = "Pieni suunnittelu: 1–2 asiaa päivälle 📝"; icon = "📋" },
    @{ text = "Niska–hartia pyörittely 2 min 🧘‍♀️"; icon = "💆" },
    @{ text = "Ristikko/sudoku 10 min 🧩"; icon = "🧩" },
    @{ text = "100–200 askelta sisätiloissa 🚶‍♀️"; icon = "🚶" }
)

# PÄIVÄAKTIVITEETIT (12:00, 16:00) - Ulkona (hyvä sää)
$dayOutside = @(
    @{ text = "Lyhyt kävely pihalla/parvekkeella 🚶‍♀️"; icon = "🚶" },
    @{ text = "Taivaan ja lintujen katselua 🐦"; icon = "🐦" },
    @{ text = "Penkillä istuskelu 10 min 🪑"; icon = "🪑" },
    @{ text = "Katsotaan puita ja kukkia 🌳🌸"; icon = "🌳" },
    @{ text = "Korttelikierros rauhallisesti 🏘️"; icon = "🏘️" },
    @{ text = "Aurinkokohtaa etsimään (varjossa tarvittaessa) 🕶️"; icon = "☀️" },
    @{ text = "Rauhallinen hengittely ulkona 🌬️"; icon = "🌬️" },
    @{ text = "Vilttiin kääriytyen hetki rauhaa parvekkeella 🧣"; icon = "🧣" }
)

# PÄIVÄAKTIVITEETIT - Sisällä (huono sää)
$dayInside = @(
    @{ text = "Lempiohjelma tai radio 20 min 📺🎧"; icon = "📻" },
    @{ text = "Ristikko/sudoku 15 min 🧩"; icon = "🧩" },
    @{ text = "Helppo käsityö 15 min 🧶"; icon = "🧶" },
    @{ text = "Vanhojen kuvien katselu 10 min 🖼️"; icon = "📸" },
    @{ text = "Yksi pieni paikka kuntoon 🗂️"; icon = "🧺" },
    @{ text = "Rauhallinen lukuhetki 10 min 📖"; icon = "📖" },
    @{ text = "2–3 kappaletta musiikkia rauhassa 🎶"; icon = "🎵" },
    @{ text = "Kevyt kehon herättely 5 min 🤸‍♀️"; icon = "🧘" }
)

# PÄIVÄAKTIVITEETIT - Sosiaalinen
$daySocial = @(
    @{ text = "Soitetaan Petrille 📞"; icon = "📞" },
    @{ text = "Lähetetään tervehdys tai kuva perheelle 📱"; icon = "📱" },
    @{ text = "Viesti Tiitalle ✍️"; icon = "✉️" },
    @{ text = "Sovitaan pieni kuulumispuhelu 📆"; icon = "☎️" }
)

# ILTAAKTIVITEETIT (20:00) - Sisällä
$eveningInside = @(
    @{ text = "Iltatv 30 min rauhassa 📺"; icon = "📺" },
    @{ text = "Hiljainen musiikki 15 min 🎶"; icon = "🎵" },
    @{ text = "Kevyt iltavenyttely 5 min 🧘‍♀️"; icon = "🧘" },
    @{ text = "3 hyvää asiaa tältä päivältä 📝"; icon = "✨" },
    @{ text = "Vaatteet valmiiksi huomiseen 👗"; icon = "👔" },
    @{ text = "Kuvia tai albumia 10 min 🖼️"; icon = "📚" },
    @{ text = "Ikkunasta iltavaloja katselemaan 👀"; icon = "🌃" },
    @{ text = "Pieni lempiohjelma rauhassa 💛"; icon = "📺" }
)

# ILTAAKTIVITEETIT - Ulkona (lämmin ilta)
$eveningOutside = @(
    @{ text = "Pieni pihakävely 5–10 min 🚶‍♀️"; icon = "🚶" },
    @{ text = "Viltin kanssa hetki rauhaa parvekkeella 🧣"; icon = "🌙" }
)

# Function to create activity document
function New-ActivityDocument {
    param(
        [string]$Id,
        [string]$TimeSlot,
        [string]$WeatherCondition,
        [string]$Text,
        [string]$Icon,
        [array]$Variants = @()
    )
    
    return @{
        id = $Id
        clientId = "mom"
        type = "activity"
        category = "suggestion"
        timeSlot = $TimeSlot
        weatherCondition = $WeatherCondition
        text = $Text
        icon = $Icon
        variants = $Variants
        isActive = $true
        createdAt = $timestamp
        updatedAt = $timestamp
    }
}

$allActivities = @()
$counter = 1

# Morning activities (inside only - early morning)
Write-Host "📝 Aamuaktiviteetit (sisällä)..." -ForegroundColor Yellow
foreach ($activity in $morningInside) {
    $doc = New-ActivityDocument `
        -Id "activity_morning_inside_$counter" `
        -TimeSlot "morning" `
        -WeatherCondition "any" `
        -Text $activity.text `
        -Icon $activity.icon
    $allActivities += $doc
    $counter++
}

# Day activities - Outside (good weather)
Write-Host "📝 Päiväaktiviteetit (ulkona, hyvä sää)..." -ForegroundColor Yellow
$counter = 1
foreach ($activity in $dayOutside) {
    $doc = New-ActivityDocument `
        -Id "activity_day_outside_$counter" `
        -TimeSlot "day" `
        -WeatherCondition "good" `
        -Text $activity.text `
        -Icon $activity.icon
    $allActivities += $doc
    $counter++
}

# Day activities - Inside (bad weather)
Write-Host "📝 Päiväaktiviteetit (sisällä, huono sää)..." -ForegroundColor Yellow
$counter = 1
foreach ($activity in $dayInside) {
    $doc = New-ActivityDocument `
        -Id "activity_day_inside_$counter" `
        -TimeSlot "day" `
        -WeatherCondition "bad" `
        -Text $activity.text `
        -Icon $activity.icon
    $allActivities += $doc
    $counter++
}

# Day activities - Social
Write-Host "📝 Päiväaktiviteetit (sosiaalinen)..." -ForegroundColor Yellow
$counter = 1
foreach ($activity in $daySocial) {
    $doc = New-ActivityDocument `
        -Id "activity_day_social_$counter" `
        -TimeSlot "day" `
        -WeatherCondition "any" `
        -Text $activity.text `
        -Icon $activity.icon
    $allActivities += $doc
    $counter++
}

# Evening activities - Inside
Write-Host "📝 Iltaaktiviteetit (sisällä)..." -ForegroundColor Yellow
$counter = 1
foreach ($activity in $eveningInside) {
    $doc = New-ActivityDocument `
        -Id "activity_evening_inside_$counter" `
        -TimeSlot "evening" `
        -WeatherCondition "any" `
        -Text $activity.text `
        -Icon $activity.icon
    $allActivities += $doc
    $counter++
}

# Evening activities - Outside (warm evening)
Write-Host "📝 Iltaaktiviteetit (ulkona, lämmin ilta)..." -ForegroundColor Yellow
$counter = 1
foreach ($activity in $eveningOutside) {
    $doc = New-ActivityDocument `
        -Id "activity_evening_outside_$counter" `
        -TimeSlot "evening" `
        -WeatherCondition "good" `
        -Text $activity.text `
        -Icon $activity.icon
    $allActivities += $doc
    $counter++
}

# Save to individual JSON files
Write-Host ""
Write-Host "💾 Tallennetaan $($allActivities.Count) aktiviteetti-dokumenttia..." -ForegroundColor Yellow

for ($i = 0; $i -lt $allActivities.Count; $i++) {
    $filename = "activity-mom-{0:D3}.json" -f ($i + 1)
    $allActivities[$i] | ConvertTo-Json -Depth 5 | Out-File -FilePath $filename -Encoding UTF8 -NoNewline
}

Write-Host "✅ Luotu $($allActivities.Count) JSON-tiedostoa!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Yhteenveto:" -ForegroundColor Cyan
Write-Host "   Aamuaktiviteetit (sisällä): $($morningInside.Count)" -ForegroundColor White
Write-Host "   Päiväaktiviteetit (ulkona):  $($dayOutside.Count)" -ForegroundColor White
Write-Host "   Päiväaktiviteetit (sisällä): $($dayInside.Count)" -ForegroundColor White
Write-Host "   Päiväaktiviteetit (sosiaalinen): $($daySocial.Count)" -ForegroundColor White
Write-Host "   Iltaaktiviteetit (sisällä):  $($eveningInside.Count)" -ForegroundColor White
Write-Host "   Iltaaktiviteetit (ulkona):   $($eveningOutside.Count)" -ForegroundColor White
Write-Host ""
Write-Host "🧠 LOGIIKKA:" -ForegroundColor Cyan
Write-Host "   - AAMU (8:00): Aina sisällä (herätys)" -ForegroundColor White
Write-Host "   - PÄIVÄ (12:00, 16:00): Ulkona jos hyvä sää, muuten sisällä tai sosiaalinen" -ForegroundColor White
Write-Host "   - ILTA (20:00): Yleensä sisällä, joskus ulkona jos lämmin" -ForegroundColor White
Write-Host ""
Write-Host "☁️ Säälogiikka API:ssa:" -ForegroundColor Yellow
Write-Host "   - isCold tai isRaining → bad weather → sisäaktiviteetit" -ForegroundColor White
Write-Host "   - isGood → good weather → ulkoaktiviteetit" -ForegroundColor White
Write-Host ""
Write-Host "📝 Seuraavaksi:" -ForegroundColor Cyan
Write-Host "   1. Lisää nämä Messages containeriin (tai uuteen Activities containeriin)" -ForegroundColor White
Write-Host "   2. Päivitä API valitsemaan satunnainen aktiviteetti sään mukaan" -ForegroundColor White
Write-Host "   3. Testaa!" -ForegroundColor White
