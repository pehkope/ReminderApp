# Add EXTENDED personalized messages for mom to Cosmos DB
# RUN: .\add-mom-messages-extended.ps1
# PALJON enemmän viestejä eri tilanteisiin!

param(
    [string]$ResourceGroup = "reminder-app-rg",
    [string]$AccountName = "reminderapp-cosmos",
    [string]$DatabaseName = "ReminderAppDB",
    [string]$ContainerName = "Messages"
)

Write-Host "💬 Lisätään LAAJENNETUT personoidut viestit mom:lle Cosmos DB:hen..." -ForegroundColor Cyan
Write-Host ""

$timestamp = Get-Date -Format "o"

# MORNING GREETINGS (8:00) - 8 different greetings
$morningGreetings = @(
    @{
        id = "morning_greeting_mom_1"
        text = "Hyvää huomenta, rakas äiti! ☀️"
        variants = @(
            "Hyvää huomenta! 🌅",
            "Aurinkoista aamua, äiti! ☀️",
            "Hei ja hyvää aamua! 😊",
            "Hyvää huomenta kultaseni! 💛"
        )
    },
    @{
        id = "morning_greeting_mom_2"
        text = "Toivottavasti nukuit hyvin! 😊"
        variants = @(
            "Hyvää aamua! Toivottavasti lepäsit hyvin 💤",
            "Hyvää huomenta! Uusi päivä on alkanut 🌅",
            "Terve äiti! Toivottavasti yö oli rauhallinen 🌙",
            "Hyvää aamua! Virkistäviä unia takana? 😊"
        )
    },
    @{
        id = "morning_greeting_mom_3"
        text = "Uusi päivä on täynnä mahdollisuuksia! 🌟"
        variants = @(
            "Kaunis aamu edessä! ✨",
            "Tänään on hyvä päivä! 😊",
            "Aloitetaan päivä iloisella mielellä! 💕"
        )
    },
    @{
        id = "morning_greeting_mom_4"
        text = "Hyvää aamua! Muista aloittaa rauhallisesti 🧘‍♀️"
        variants = @(
            "Ei hoppu! Ota aamu rennosti 😊",
            "Rauhallista aloitusta päivään! ☕",
            "Hyvää huomenta! Nautitaan aamusta 🌅"
        )
    },
    @{
        id = "morning_greeting_mom_5"
        text = "Olet tärkeä! Toivotamme ihanan päivän! 💖"
        variants = @(
            "Ajattelemme sinua! Kaunista päivää! 💕",
            "Olet rakas! Hyvää aamua! ❤️",
            "Välitämme sinusta! Aurinkoista päivää! ☀️"
        )
    },
    @{
        id = "morning_greeting_mom_6"
        text = "Hyvää huomenta! Katsotaan mitä kaunista päivä tuo! 🌸"
        variants = @(
            "Terve äiti! Joka päivä on lahja! 🎁",
            "Hyvää aamua! Nautitaan yhdessä! 😊",
            "Huomenta! Hienoja hetkiä edessä! ✨"
        )
    },
    @{
        id = "morning_greeting_mom_7"
        text = "Hyvää aamua! Muista juoda vettä ja venytellä! 💧"
        variants = @(
            "Huomenta! Pieni venyttely piristää! 🤸‍♀️",
            "Hyvää aamua! Juoda vettä ja liikkua vähän! 🚶‍♀️",
            "Terve! Aloita päivä pienellä liikkeellä! 💪"
        )
    },
    @{
        id = "morning_greeting_mom_8"
        text = "Hyvää huomenta! Sinä olet mahtava! 🌟"
        variants = @(
            "Huomenta! Pärjäät loistavasti! 💪",
            "Hyvää aamua! Olet ihailtava! ❤️",
            "Terve äiti! Olet vahva ja ihana! 💖"
        )
    }
)

# NOON GREETINGS (12:00) - 6 different greetings
$noonGreetings = @(
    @{
        id = "noon_greeting_mom_1"
        text = "Hei äiti! Mukavaa lounasaikaa! 🍽️"
        variants = @(
            "Hei, on lounas-aika! 😊",
            "Terve äiti! Muista syödä hyvin 🍽️",
            "Lounasaika! Nauti ruoasta! 🥗"
        )
    },
    @{
        id = "noon_greeting_mom_2"
        text = "Päivä on jo puolessa välissä! Hyvää jatkoa! ☀️"
        variants = @(
            "Puolipäivä! Jaksat hyvin! 💪",
            "Kello on 12! Pieni tauko tekee hyvää! ☕",
            "Keskipäivä! Ota hetki itsellesi! 😊"
        )
    },
    @{
        id = "noon_greeting_mom_3"
        text = "Hyvää päivää! Toivottavasti aamu on mennyt hyvin! 😊"
        variants = @(
            "Terve! Miten aamu sujui? 🌅",
            "Hei äiti! Mukava päivä tähän asti? 😊",
            "Päivää! Oliko aamu rauhallinen? ☕"
        )
    },
    @{
        id = "noon_greeting_mom_4"
        text = "Lounasaikaa! Muista nauttia ruoasta rauhassa 🍴"
        variants = @(
            "Syödään hyvin! Ei kiirettä! 😊",
            "Lounas odottaa! Ota aikaa! 🍽️",
            "Ruoka-aika! Nautitaan rauhassa! 🥘"
        )
    },
    @{
        id = "noon_greeting_mom_5"
        text = "Hei! Muista juoda vettä ja levätä hetki! 💧"
        variants = @(
            "Terve! Pieni tauko piristää! 🧘‍♀️",
            "Hei äiti! Vettä ja lepoa! 💦",
            "Päivää! Nestettä ja hetki rauhaa! 😌"
        )
    },
    @{
        id = "noon_greeting_mom_6"
        text = "Kaunis keskipäivä! Olet tehnyt hyvin! 🌟"
        variants = @(
            "Hyvä! Olet pärjännyt loistavasti! 💪",
            "Mahtavaa! Jatka samaan malliin! ❤️",
            "Hienoa! Olet tehnyt hyvää työtä! 😊"
        )
    }
)

# AFTERNOON GREETINGS (16:00) - 6 different greetings
$afternoonGreetings = @(
    @{
        id = "afternoon_greeting_mom_1"
        text = "Iltapäivää, äiti! 🌤️"
        variants = @(
            "Hyvää iltapäivää! ☕",
            "Hei äiti! Päivällinen-aika lähestyy 🍽️",
            "Terve! Toivottavasti päivä on mennyt hyvin 😊"
        )
    },
    @{
        id = "afternoon_greeting_mom_2"
        text = "Iltapäivä on hieno aika nauttia hetkestä! ☕"
        variants = @(
            "Kahvihetki! Nauti rauhassa! 😊",
            "Iltapäivätee kutsuu! 🫖",
            "Pieni välipala piristää! 🍪"
        )
    },
    @{
        id = "afternoon_greeting_mom_3"
        text = "Hei äiti! Miten päivä on sujunut? 😊"
        variants = @(
            "Terve! Toivottavasti mukava päivä! 🌞",
            "Päivää! Onko ollut hyvä päivä? 💕",
            "Hei! Kaikki hyvin? 😊"
        )
    },
    @{
        id = "afternoon_greeting_mom_4"
        text = "Iltapäivä! Kohta päivällinen-aika! 🍽️"
        variants = @(
            "Ilta lähestyy! Pian ruoka-aika! 🥘",
            "Iltapäivä! Päivällinen tulossa! 🍲",
            "Hei! Kohta syödään! 🍴"
        )
    },
    @{
        id = "afternoon_greeting_mom_5"
        text = "Iltapäivä! Muista levätä jos väsyttää! 🛋️"
        variants = @(
            "Terve! Pieni lepo tekee hyvää! 😌",
            "Hei! Saa ottaa rennosti! 🧘‍♀️",
            "Iltapäivä! Nautitaan rauhasta! 💆‍♀️"
        )
    },
    @{
        id = "afternoon_greeting_mom_6"
        text = "Hyvää iltapäivää! Olet tehnyt hienosti tänään! 🌟"
        variants = @(
            "Iltapäivää! Pärjäät loistavasti! 💪",
            "Terve! Hienoa työtä tänään! ❤️",
            "Hei! Olet mahtava! 😊"
        )
    }
)

# EVENING GREETINGS (20:00) - 8 different greetings
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
    },
    @{
        id = "evening_greeting_mom_3"
        text = "Ilta on aikaa rentoutua ja levätä 🌆"
        variants = @(
            "Terve! Rauhallinen ilta edessä! 😌",
            "Hei! Ota rennosti illalla! 🛋️",
            "Ilta! Rentoutumisen aika! ✨"
        )
    },
    @{
        id = "evening_greeting_mom_4"
        text = "Hyvää iltaa! Päivä on ollut hyvä! 😊"
        variants = @(
            "Ilta! Olet pärjännyt hienosti! 💪",
            "Terve! Mukava päivä takana! ❤️",
            "Hei! Olet tehnyt hyvin tänään! 🌟"
        )
    },
    @{
        id = "evening_greeting_mom_5"
        text = "Iltaa! Muista ottaa iltapala ennen nukkumaan menoa! 🥛"
        variants = @(
            "Ilta! Pieni iltapala tekee hyvää! 🍪",
            "Terve! Muista syödä jotain kevyttä! 🧃",
            "Hei! Iltapalakin tärkeä! 🍎"
        )
    },
    @{
        id = "evening_greeting_mom_6"
        text = "Rauhallista iltaa! Valmistaudutaan yölle! 🌙"
        variants = @(
            "Ilta! Kohti rauhallista yötä! 💤",
            "Terve! Pian nukkumaan! 😴",
            "Hei! Leppoisa ilta ja hyvä yö! 🌟"
        )
    },
    @{
        id = "evening_greeting_mom_7"
        text = "Hyvää iltaa! Kiitos hienosta päivästä! 💕"
        variants = @(
            "Ilta! Olet tehnyt loistavasti! 😊",
            "Terve! Hyvä päivä takana! ❤️",
            "Hei! Olemme ylpeitä sinusta! 💖"
        )
    },
    @{
        id = "evening_greeting_mom_8"
        text = "Iltaa! Muista että sinua rakastetaan! ❤️"
        variants = @(
            "Ilta! Olet meille tärkeä! 💙",
            "Terve! Välitämme sinusta! 💕",
            "Hei! Olet rakas! 💖"
        )
    }
)

# OUTDOOR ACTIVITIES - Good weather (12 variants)
$activitiesOutdoorGood = @(
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
    },
    @{
        id = "activity_outdoor_good_3"
        text = "Upea ilma! Lyhyt kävelyretki lähimetsään? 🌲"
        variants = @(
            "Loistava sää! Pieni lenkki tekee hyvää! 🚶‍♀️",
            "Täydellinen päivä ulkoiluun! 🌤️",
            "Hieno ilma! Ulos nauttimaan luonnosta! 🌳"
        )
    },
    @{
        id = "activity_outdoor_good_4"
        text = "Aurinkoa! Voisit käydä parvekkeella/pihalla! ☀️"
        variants = @(
            "Lämmin päivä! Raikas ilma piristää! 🌞",
            "Kaunis sää! Hetki ulkona tekee hyvää! 🌸",
            "Aurinkoista! Nauti ulkona hetki! 🌺"
        )
    },
    @{
        id = "activity_outdoor_good_5"
        text = "Ihana ilma! Lyhyt kävelylenkki naapuriin? 👋"
        variants = @(
            "Hyvä sää! Voisit käydä naapurissa! 😊",
            "Kaunis päivä! Pieni kävelykierros! 🚶‍♀️",
            "Lämmin ilma! Tapaa tuttuja ulkona! 💕"
        )
    },
    @{
        id = "activity_outdoor_good_6"
        text = "Upea sää! Puutarha kutsuu! 🌻"
        variants = @(
            "Loistava ilma! Voisit katsella kukkia! 🌸",
            "Kaunis päivä! Nauti luonnosta! 🌺",
            "Hieno sää! Hetki ulkona virkistää! 🌷"
        )
    }
)

# INDOOR ACTIVITIES - Cold weather (10 variants)
$activitiesIndoorCold = @(
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
    },
    @{
        id = "activity_indoor_cold_3"
        text = "Pakkasta! Lämmin tee ja hyvä kirja! 📚☕"
        variants = @(
            "Kylmää! Kahvi ja lehti! ☕📰",
            "Pakkas! Radio ja lämpö! 📻🔥",
            "Kylmä! Lämmin juoma ja rentoutumista! 🫖"
        )
    },
    @{
        id = "activity_indoor_cold_4"
        text = "Talvipäivä! Pysytään lämpimänä sisällä! 🏠"
        variants = @(
            "Pakkanen! Nauti kotona! 🛋️",
            "Kylmä! Hyvin lämmitä sisällä! 🔥",
            "Talvi! Mukavaa kotona! ☕"
        )
    },
    @{
        id = "activity_indoor_cold_5"
        text = "Kylmä päivä! Soita läheisille ja juttele! 📞"
        variants = @(
            "Pakkas! Hyvä aika puhelulle! ☎️",
            "Kylmää! Kuulumisten vaihto lämmittää! 💕",
            "Talvi! Pidä yhteyttä läheisiin! 📱"
        )
    }
)

# INDOOR ACTIVITIES - Rainy weather (10 variants)
$activitiesIndoorRain = @(
    @{
        id = "activity_indoor_rain_1"
        text = "Sateinen päivä - hyvä hetki sisäpuuhille ☔"
        variants = @(
            "Sataa - nauti rauhallinen päivä sisällä 🌧️",
            "Sateinen ilma - täydellinen hetki kahville ☕",
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
    },
    @{
        id = "activity_indoor_rain_3"
        text = "Sateinen ilma! Lämmin tee ja radio! ☕📻"
        variants = @(
            "Sataa! Kahvi ja hyvä kirja! ☕📖",
            "Vesisade! Mukavaa sisällä! 🏠",
            "Sade! Rauhallinen päivä kotona! 🛋️"
        )
    },
    @{
        id = "activity_indoor_rain_4"
        text = "Sataa! Hyvä päivä sisäpuuhille! 🌧️"
        variants = @(
            "Sade! Nauti kotona! ☔",
            "Vesisade! Mukava päivä sisällä! 🏠",
            "Märkää! Pysy lämpimänä! ☕"
        )
    },
    @{
        id = "activity_indoor_rain_5"
        text = "Sade! Soita ystävälle ja juttele! 📞"
        variants = @(
            "Sataa! Hyvä aika puhelulle! ☎️",
            "Vesisade! Kuulumisten vaihto! 💕",
            "Sateista! Pidä yhteyttä! 📱"
        )
    }
)

# SOCIAL ACTIVITIES (8 variants)
$activitiesSocial = @(
    @{
        id = "activity_social_1"
        text = "Soita lapsille/lapsenlapsille! He ilahtuvat! 📞💕"
        variants = @(
            "Ota yhteyttä perheeseen! He kaipaavat sinua! ❤️",
            "Soita rakkaallesi! Kuulumisten vaihto lämmittää! 📱",
            "Perhe haluaa kuulla sinusta! Soita! 💙"
        )
    },
    @{
        id = "activity_social_2"
        text = "Naapuri voisi tulla kahville! ☕👋"
        variants = @(
            "Kutsu ystävä kylään! 😊",
            "Soita tuttavalle! Voisitte tavata! 💕",
            "Yhdessä tekeminen on kivaa! 👯‍♀️"
        )
    },
    @{
        id = "activity_social_3"
        text = "Lähetä viesti perheelle! He ilahtuvat! 💌"
        variants = @(
            "Kirjoita viesti läheisille! 💕",
            "Ota yhteyttä! Olet tärkeä! ❤️",
            "Perhe haluaa kuulla sinusta! 📱"
        )
    },
    @{
        id = "activity_social_4"
        text = "Voisitko soittaa ystävälle? ☎️"
        variants = @(
            "Ystävä ilahtuu puhelustasi! 😊",
            "Kuulumisten vaihto piristää! 💕",
            "Soita ja juttele! 📞"
        )
    }
)

# ENCOURAGEMENT MESSAGES (12 variants)
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
        id = "encouragement_food_2"
        text = "Syöminen on tärkeää! Nauti ruoasta! 🍴"
        context = "food"
        variants = @(
            "Hyvä ruoka on tärkeä! 🥗",
            "Muista syödä kunnolla! 🍽️",
            "Nauti ateriasta rauhassa! 😊"
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
        id = "encouragement_medication_2"
        text = "Lääkkeet auttavat jaksamaan! Hyvä kun muistat! 💪"
        context = "medication"
        variants = @(
            "Lääkkeet ovat tärkeitä! 💊",
            "Muista lääkkeet! Ne auttavat! 💙",
            "Hyvä! Lääkkeet otettu! ❤️"
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
    },
    @{
        id = "encouragement_general_2"
        text = "Pärjäät loistavasti! Olet mahtava! 🌟"
        context = "general"
        variants = @(
            "Teet hyvin! Olet vahva! 💪",
            "Jaksat hienosti! Ylpeä sinusta! ❤️",
            "Olet ihailtava! 💖"
        )
    },
    @{
        id = "encouragement_general_3"
        text = "Kiitos että olet! Olet meille rakas! 💕"
        context = "general"
        variants = @(
            "Olet ihana! Kiitos sinusta! ❤️",
            "Rakas äiti! Olet tärkeä! 💙",
            "Välitämme sinusta aina! 💖"
        )
    },
    @{
        id = "encouragement_general_4"
        text = "Joka päivä olet tehnyt hyvin! 🌟"
        context = "general"
        variants = @(
            "Olet tehnyt loistavaa työtä! 💪",
            "Pärjäät mainiosti! ❤️",
            "Olet vahva ja upea! 💖"
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
        [string]$ActivityType = "",
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
    if ($ActivityType) { $doc.activityType = $ActivityType }
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

# Activities - Good weather (outdoor)
foreach ($msg in $activitiesOutdoorGood) {
    $doc = New-MessageDocument -Id $msg.id -Category "activity" -WeatherCondition "good" -ActivityType "outdoor" -Text $msg.text -Variants $msg.variants
    $allMessages += $doc
}

# Activities - Cold weather (indoor)
foreach ($msg in $activitiesIndoorCold) {
    $doc = New-MessageDocument -Id $msg.id -Category "activity" -WeatherCondition "cold" -ActivityType "indoor" -Text $msg.text -Variants $msg.variants
    $allMessages += $doc
}

# Activities - Rainy weather (indoor)
foreach ($msg in $activitiesIndoorRain) {
    $doc = New-MessageDocument -Id $msg.id -Category "activity" -WeatherCondition "rainy" -ActivityType "indoor" -Text $msg.text -Variants $msg.variants
    $allMessages += $doc
}

# Activities - Social
foreach ($msg in $activitiesSocial) {
    $doc = New-MessageDocument -Id $msg.id -Category "activity" -ActivityType "social" -Text $msg.text -Variants $msg.variants
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

Write-Host ""
Write-Host "✅ Luotu $fileCount JSON-tiedostoa!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Yhteenveto:" -ForegroundColor Cyan
Write-Host "   - Aamun tervehdykset: $($morningGreetings.Count) (8 kpl)" -ForegroundColor White
Write-Host "   - Keskipäivän tervehdykset: $($noonGreetings.Count) (6 kpl)" -ForegroundColor White
Write-Host "   - Iltapäivän tervehdykset: $($afternoonGreetings.Count) (6 kpl)" -ForegroundColor White
Write-Host "   - Illan tervehdykset: $($eveningGreetings.Count) (8 kpl)" -ForegroundColor White
Write-Host "   - Ulkoaktiviteetit (hyvä sää): $($activitiesOutdoorGood.Count) (6 kpl)" -ForegroundColor White
Write-Host "   - Sisäaktiviteetit (kylmä): $($activitiesIndoorCold.Count) (5 kpl)" -ForegroundColor White
Write-Host "   - Sisäaktiviteetit (sateinen): $($activitiesIndoorRain.Count) (5 kpl)" -ForegroundColor White
Write-Host "   - Sosiaaliset aktiviteetit: $($activitiesSocial.Count) (4 kpl)" -ForegroundColor White
Write-Host "   - Kannustukset: $($encouragements.Count) (8 kpl)" -ForegroundColor White
Write-Host ""
Write-Host "   YHTEENSÄ: $fileCount viesti-JSON:ia!" -ForegroundColor Green
Write-Host ""
Write-Host "💾 Seuraavaksi: Lisää viestit Cosmos DB:hen" -ForegroundColor Cyan
Write-Host "   1. Aja tämä script: .\add-mom-messages-extended.ps1" -ForegroundColor White
Write-Host "   2. Tai Azure Portal: Data Explorer → Messages → New Items" -ForegroundColor White
Write-Host ""

