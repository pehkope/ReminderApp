# Add mom's personalized messages to Cosmos DB
# Run this in Azure Cloud Shell (PowerShell mode)

param(
    [string]$ResourceGroup = "ReminderAppDB",
    [string]$AccountName = "reminderappdb",
    [string]$DatabaseName = "ReminderAppDB",
    [string]$ContainerName = "Messages"
)

Write-Host "💬 Lisätään mom:n personoidut viestit Cosmos DB:hen..." -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "o"

# Morning greetings (8:00)
$morningGreetings = @(
    @{
        id = "morning_greeting_mom_1"
        text = "Hyvää huomenta, rakas äiti! ☀️"
        variants = @(
            "Hyvää huomenta! 🌅",
            "Aurinkoista aamua, äiti! ☀️",
            "Hei ja hyvää aamua! 😊"
        )
    },
    @{
        id = "morning_greeting_mom_2"
        text = "Toivottavasti nukuit hyvin! 😊"
        variants = @(
            "Hyvää aamua! Toivottavasti lepäsit hyvin 💤",
            "Hyvää huomenta! Uusi päivä on alkanut 🌅",
            "Terve äiti! Toivottavasti yö oli rauhallinen 🌙"
        )
    }
)

# Noon greetings (12:00)
$noonGreetings = @(
    @{
        id = "noon_greeting_mom_1"
        text = "Hei äiti! 😊"
        variants = @(
            "Mukavaa lounasaikaa! 🍽️",
            "Hei, on lounas-aika! 😊",
            "Terve äiti! Muista syödä hyvin 🍽️"
        )
    }
)

# Afternoon greetings (16:00)
$afternoonGreetings = @(
    @{
        id = "afternoon_greeting_mom_1"
        text = "Iltapäivää, äiti! 🌤️"
        variants = @(
            "Hyvää iltapäivää! ☕",
            "Hei äiti! Päivällinen-aika lähestyy 🍽️",
            "Terve! Toivottavasti päivä on mennyt hyvin 😊"
        )
    }
)

# Evening greetings (20:00)
$eveningGreetings = @(
    @{
        id = "evening_greeting_mom_1"
        text = "Hyvää iltaa, rakas äiti! 🌙"
        variants = @(
            "Hyvää iltaa! 🌙",
            "Rauhallista iltaa, äiti! ✨",
            "Hei äiti! Päivä lähestyy loppuaan 🌆"
        )
    },
    @{
        id = "evening_greeting_mom_2"
        text = "Huomenna uusi päivä alkaa! Nuku hyvin 💙"
        variants = @(
            "Rauhallista yötä! Huomenna taas uusi päivä 💤",
            "Hyvää yötä! Nuku rauhassa 🌙",
            "Rentouttavaa iltaa ja hyvää yötä! 💙"
        )
    }
)

# Activity suggestions - Good weather
$activitiesGood = @(
    @{
        id = "activity_outdoor_good_1"
        text = "Kaunis päivä! Kävelylenkki piristäisi 🚶‍♀️"
        variants = @(
            "Hieno sää - ulos vaan! 🌞",
            "Täydellinen ilma kävelylle!",
            "Aurinkoa ja lämmintä - nauti ulkona!"
        )
    },
    @{
        id = "activity_outdoor_good_2"
        text = "Voisit istua hetkeksi pihalla ja nauttia säästä ☀️"
        variants = @(
            "Lämmin ilma - nauti ulkona! 🌸",
            "Kaunis päivä - hyvä hetki olla ulkona 🌺",
            "Istu hetkeksi ulos ja nauti auringosta ☀️"
        )
    }
)

# Activity suggestions - Cold weather
$activitiesCold = @(
    @{
        id = "activity_indoor_cold_1"
        text = "Kylmää ulkona - nauti kuppi kahvia sisällä ☕"
        variants = @(
            "Pakkaspäivä - hyvä päivä lukea kirjaa 📖",
            "Kylmä sää - rentoudu sisällä lämpimän peiton alla 🛋️",
            "Pakkas puree - kuuntele radiota ja nauti lämmöstä 📻"
        )
    },
    @{
        id = "activity_indoor_cold_2"
        text = "Kylmä ilma - hyvä hetki sisäpuuhille ❄️"
        variants = @(
            "Pakkanen puree - pysy lämpimänä sisällä! 🏠",
            "Kylmää ulkona - nauti lämpö sisällä ☕",
            "Pakkaspäivä - ihaile talvimaisemaa ikkunasta 🪟"
        )
    }
)

# Activity suggestions - Rainy weather
$activitiesRain = @(
    @{
        id = "activity_indoor_rain_1"
        text = "Sateinen päivä - hyvä hetki sisäpuuhille ☔"
        variants = @(
            "Sataa - nauti rauhallinen päivä sisällä 🌧️",
            "Sateinen ilma - täydellinen hetki kahville ja hyvää seuraa ☕",
            "Vesisade - ihaile sadetta ikkunasta ja rentoudu 🪟"
        )
    },
    @{
        id = "activity_indoor_rain_2"
        text = "Sataa vettä - pysy kuivana sisällä! 🌧️"
        variants = @(
            "Märkä ilma - nauti lämpö sisällä ☕",
            "Sateinen päivä - kuuntele sateen ropinaa 🌧️",
            "Vesisade - rentoudu sisällä 🏠"
        )
    }
)

# Encouragement messages
$encouragements = @(
    @{
        id = "encouragement_food_1"
        text = "Hyvä ruoka antaa voimia päivään! 💪"
        context = "food"
        variants = @(
            "Muista syödä hyvin - se on tärkeää! ❤️",
            "Herkullinen ateria tekee hyvää! 😊",
            "Nauti ruoasta rauhassa 🍽️"
        )
    },
    @{
        id = "encouragement_medication_1"
        text = "Lääkkeet ovat tärkeä osa terveyttäsi 💊"
        context = "medication"
        variants = @(
            "Muista ottaa lääkkeet - ne auttavat sinua! 💙",
            "Lääkkeiden otto on tärkeää 💊",
            "Hyvä kun muistat lääkkeet! ❤️"
        )
    },
    @{
        id = "encouragement_general_1"
        text = "Olet rakas ja tärkeä! ❤️"
        context = "general"
        variants = @(
            "Muistathan että välitämme sinusta! 💙",
            "Olet tärkeä meille! ❤️",
            "Ajattelemme sinua! 💕"
        )
    }
)

# Function to create message document
function New-MessageDocument {
    param(
        [string]$Id,
        [string]$Category,
        [string]$TimeSlot = "",
        [string]$WeatherCondition = "",
        [string]$Context = "",
        [string]$Text,
        [array]$Variants
    )
    
    $doc = @{
        id = $Id
        clientId = "mom"
        type = "message"
        category = $Category
        text = $Text
        variants = $Variants
        isActive = $true
        createdAt = $timestamp
        updatedAt = $timestamp
    }
    
    if ($TimeSlot) { $doc.timeSlot = $TimeSlot }
    if ($WeatherCondition) { $doc.weatherCondition = $WeatherCondition }
    if ($Context) { $doc.context = $Context }
    
    return $doc
}

# Create all message documents
$allMessages = @()

# Morning greetings
foreach ($msg in $morningGreetings) {
    $doc = New-MessageDocument -Id $msg.id -Category "greeting" -TimeSlot "morning" -Text $msg.text -Variants $msg.variants
    $allMessages += $doc
}

# Noon greetings
foreach ($msg in $noonGreetings) {
    $doc = New-MessageDocument -Id $msg.id -Category "greeting" -TimeSlot "noon" -Text $msg.text -Variants $msg.variants
    $allMessages += $doc
}

# Afternoon greetings
foreach ($msg in $afternoonGreetings) {
    $doc = New-MessageDocument -Id $msg.id -Category "greeting" -TimeSlot "afternoon" -Text $msg.text -Variants $msg.variants
    $allMessages += $doc
}

# Evening greetings
foreach ($msg in $eveningGreetings) {
    $doc = New-MessageDocument -Id $msg.id -Category "greeting" -TimeSlot "evening" -Text $msg.text -Variants $msg.variants
    $allMessages += $doc
}

# Activities - Good weather
foreach ($msg in $activitiesGood) {
    $doc = New-MessageDocument -Id $msg.id -Category "activity" -WeatherCondition "good" -Text $msg.text -Variants $msg.variants
    $allMessages += $doc
}

# Activities - Cold weather
foreach ($msg in $activitiesCold) {
    $doc = New-MessageDocument -Id $msg.id -Category "activity" -WeatherCondition "cold" -Text $msg.text -Variants $msg.variants
    $allMessages += $doc
}

# Activities - Rainy weather
foreach ($msg in $activitiesRain) {
    $doc = New-MessageDocument -Id $msg.id -Category "activity" -WeatherCondition "rainy" -Text $msg.text -Variants $msg.variants
    $allMessages += $doc
}

# Encouragements
foreach ($msg in $encouragements) {
    $doc = New-MessageDocument -Id $msg.id -Category "encouragement" -Context $msg.context -Text $msg.text -Variants $msg.variants
    $allMessages += $doc
}

# Save each message to separate JSON file
Write-Host "📝 Luodaan $($allMessages.Count) JSON-tiedostoa..." -ForegroundColor Yellow
$fileCount = 0

foreach ($msg in $allMessages) {
    $fileCount++
    $filename = "message-mom-{0:D3}.json" -f $fileCount
    $msg | ConvertTo-Json -Depth 5 | Out-File -FilePath $filename -Encoding UTF8 -NoNewline
}

Write-Host "✅ Luotu $fileCount JSON-tiedostoa!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Yhteenveto:" -ForegroundColor Cyan
Write-Host "   - Tervehdykset: $($morningGreetings.Count + $noonGreetings.Count + $afternoonGreetings.Count + $eveningGreetings.Count)" -ForegroundColor White
Write-Host "   - Aktiviteetit: $($activitiesGood.Count + $activitiesCold.Count + $activitiesRain.Count)" -ForegroundColor White
Write-Host "   - Kannustukset: $($encouragements.Count)" -ForegroundColor White
Write-Host ""
Write-Host "📝 Lisää viestit Azure Portalissa:" -ForegroundColor Cyan
Write-Host "   1. https://portal.azure.com" -ForegroundColor White
Write-Host "   2. Cosmos DB → reminderappdb → Data Explorer" -ForegroundColor White
Write-Host "   3. Messages container → New Item" -ForegroundColor White
Write-Host "   4. Kopioi message-mom-001.json sisältö → Save" -ForegroundColor White
Write-Host "   5. Toista kaikille $fileCount viestille" -ForegroundColor White
Write-Host ""
Write-Host "⏱️  Aikaa menee ~5-10 minuuttia" -ForegroundColor Gray
