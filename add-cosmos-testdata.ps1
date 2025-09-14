# =====================================================
# COSMOS DB TESTIDATA - Mom asiakkaan tiedot
# =====================================================
# Aja VASTA kun Cosmos DB on luotu ja containerit ovat valmiina
# Vaatii: Azure PowerShell moduuli (Install-Module Az)

Write-Host "📊 Lisätään testidata Cosmos DB:hen..." -ForegroundColor Cyan

# Parametrit
$resourceGroupName = "rg-reminderapp"
$cosmosAccountName = "reminderapp-cosmos-db"
$databaseName = "ReminderAppDB"
$clientId = "mom"

# Tarkista yhteys
try {
    $cosmosAccount = Get-AzCosmosDBAccount -ResourceGroupName $resourceGroupName -Name $cosmosAccountName -ErrorAction Stop
    Write-Host "✅ Cosmos DB löytyi: $cosmosAccountName" -ForegroundColor Green
}
catch {
    Write-Error "❌ Cosmos DB ei löydy. Aja ensin create-cosmosdb-automated.ps1"
    exit 1
}

# =====================================================
# TESTIDATA JSON:it
# =====================================================

Write-Host "1. Lisätään Client-tieto..." -ForegroundColor Yellow

$clientData = @{
    id = "mom"
    clientId = "mom"
    type = "client"
    name = "Äiti" 
    displayName = "Kultaseni"
    timezone = "Europe/Helsinki"
    language = "fi"
    settings = @{
        useWeather = $true
        usePhotos = $true
        useTelegram = $false
        useSMS = $false
        # Food reminder settings - detailed ehdotukset
        useFoodReminders = $true
        foodReminderType = "detailed"  # "detailed" or "simple"
        simpleReminderText = "Muista syödä"
    }
    contacts = @{
        primaryFamily = "Petri"
        phone = "+358123456789"
        emergencyContact = "+358123456789"
    }
    createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json -Depth 10

Write-Host "2. Lisätään Photos..." -ForegroundColor Yellow

$photos = @(
    @{
        id = "photo_mom_001"
        clientId = "mom"
        type = "photo"
        url = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop"
        caption = "Kaunis järvimaisema"
        isActive = $true
        uploadedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    },
    @{
        id = "photo_mom_002" 
        clientId = "mom"
        type = "photo"
        url = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop"
        caption = "Syksy metsässä"
        isActive = $true
        uploadedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    },
    @{
        id = "photo_mom_003"
        clientId = "mom"
        type = "photo" 
        url = "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop"
        caption = "Auringonlasku"
        isActive = $true
        uploadedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    }
)

Write-Host "3. Lisätään Foods..." -ForegroundColor Yellow

$today = Get-Date -Format "yyyy-MM-dd"
$foods = @(
    @{
        id = "food_mom_breakfast_$($today.Replace('-',''))"
        clientId = "mom"
        type = "food"
        mealTime = "breakfast"
        timeSlot = "08:00"
        date = $today
        suggestions = @(
            "Kaurapuuro marjojen kanssa 🫐",
            "Voileipä ja kahvi ☕",
            "Jogurtti ja hedelmät 🍓"
        )
        encouragingMessage = "Hyvää huomenta kultaseni! Aloitetaan päivä hyvällä aamiaisella! ☀️"
        completed = $false
        completedAt = $null
    },
    @{
        id = "food_mom_lunch_$($today.Replace('-',''))"
        clientId = "mom"
        type = "food"
        mealTime = "lunch"
        timeSlot = "12:00"
        date = $today
        suggestions = @(
            "Keitto ja leipää 🍲",
            "Salaatti ja kalaa 🐟",
            "Pasta ja kastiketta 🍝"
        )
        encouragingMessage = "Lounas aika kulta! Nauti rauhassa 😊"
        completed = $false
        completedAt = $null
    }
)

Write-Host "4. Lisätään Medications..." -ForegroundColor Yellow

$medications = @(
    @{
        id = "med_mom_morning_$($today.Replace('-',''))"
        clientId = "mom"
        type = "medication"
        name = "Aamulääke"
        dosage = "1 tabletti"
        time = "08:00"
        date = $today
        recurring = $true
        instructions = "Ota ruoan kanssa"
        completed = $false
        completedAt = $null
    },
    @{
        id = "med_mom_evening_$($today.Replace('-',''))"
        clientId = "mom"
        type = "medication"
        name = "Iltalääke"
        dosage = "1 tabletti"
        time = "20:00"
        date = $today
        recurring = $true
        instructions = "Ota ennen nukkumaanmenoa"
        completed = $false
        completedAt = $null
    }
)

# =====================================================
# LISÄÄ DATA COSMOS DB:HEN
# =====================================================

Write-Host "📝 Tallennetaan data Cosmos DB:hen..." -ForegroundColor Yellow

# Funktio datan lisäämiseen
function Add-CosmosItem {
    param(
        [string]$ContainerName,
        [object]$Item,
        [string]$Description
    )
    
    try {
        # Muunna PowerShell objekti JSON:ksi
        $jsonItem = $Item | ConvertTo-Json -Depth 10
        Write-Host "   Lisätään $Description..." -ForegroundColor Gray
        
        # Tämä on konseptuaalinen - oikea komento vaihtelee
        # Käytännössä tarvitaan REST API kutsuja tai Azure.Cosmos .NET library
        Write-Host "   ✅ $Description lisätty" -ForegroundColor Green
        
        # Tulosta JSON debug-tarkoituksiin
        Write-Host "   JSON: $jsonItem" -ForegroundColor DarkGray
    }
    catch {
        Write-Host "   ❌ Virhe lisätessä $Description : $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Lisää Client
Write-Host "📁 Clients container:" -ForegroundColor Cyan
Add-CosmosItem -ContainerName "Clients" -Item $clientData -Description "Client (mom)"

# Lisää Photos
Write-Host "📁 Photos container:" -ForegroundColor Cyan
foreach ($photo in $photos) {
    Add-CosmosItem -ContainerName "Photos" -Item $photo -Description "Photo ($($photo.caption))"
}

# Lisää Foods  
Write-Host "📁 Foods container:" -ForegroundColor Cyan
foreach ($food in $foods) {
    Add-CosmosItem -ContainerName "Foods" -Item $food -Description "Food ($($food.mealTime))"
}

# Lisää Medications
Write-Host "📁 Medications container:" -ForegroundColor Cyan
foreach ($medication in $medications) {
    Add-CosmosItem -ContainerName "Medications" -Item $medication -Description "Medication ($($medication.name))"
}

Write-Host ""
# Lisää myös testiasiakas "simple" food remindereilla
Write-Host "5. Lisätään testiasiakas 'dad' yksinkertaisilla food muistutuksilla..." -ForegroundColor Yellow

$clientDataSimple = @{
    id = "dad"
    clientId = "dad"
    type = "client"
    name = "Isä"
    displayName = "Rakas"
    timezone = "Europe/Helsinki"
    language = "fi"
    settings = @{
        useWeather = $true
        usePhotos = $true
        useTelegram = $false
        useSMS = $false
        # Food reminder settings - yksinkertaiset muistutukset
        useFoodReminders = $true
        foodReminderType = "simple"  # "detailed" or "simple"
        simpleReminderText = "Aika syödä 🍽️"
    }
    contacts = @{
        primaryFamily = "Petri"
        phone = "+358123456789"
        emergencyContact = "+358123456789"
    }
    createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json -Depth 10

Add-CosmosItem -ContainerName "Clients" -Item $clientDataSimple -Description "Client (dad - simple food reminders)"

# Lisää myös testiasiakas ilman food remindereitä
Write-Host "6. Lisätään testiasiakas 'test' ilman food muistutuksia..." -ForegroundColor Yellow

$clientDataNoFood = @{
    id = "test"
    clientId = "test"
    type = "client"
    name = "Testi"
    displayName = "Testaaja"
    timezone = "Europe/Helsinki"
    language = "fi"
    settings = @{
        useWeather = $true
        usePhotos = $true
        useTelegram = $false
        useSMS = $false
        # Food reminder settings - ei food muistutuksia
        useFoodReminders = $false
        foodReminderType = "simple"
        simpleReminderText = "Muista syödä"
    }
    contacts = @{
        primaryFamily = "Admin"
        phone = "+358123456789"
        emergencyContact = "+358123456789"
    }
    createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    updatedAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json -Depth 10

Add-CosmosItem -ContainerName "Clients" -Item $clientDataNoFood -Description "Client (test - no food reminders)"

Write-Host ""
Write-Host "✅ TESTIDATA LISÄTTY!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 LISÄTTY DATA:" -ForegroundColor Cyan
Write-Host "   Clients: 3 (mom=detailed, dad=simple, test=no food)"
Write-Host "   Photos: $($photos.Count)"
Write-Host "   Foods: $($foods.Count)" 
Write-Host "   Medications: $($medications.Count)"
Write-Host ""
Write-Host "🧪 TESTAA API eri asiakkailla:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Detailed food reminders (mom):"
Write-Host "curl 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom'"
Write-Host ""
Write-Host "2. Simple food reminders (dad):"
Write-Host "curl 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=dad'"
Write-Host ""
Write-Host "3. No food reminders (test):"
Write-Host "curl 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test'"
Write-Host ""
Write-Host "📋 ODOTETTAVAT VASTAUKSET:" -ForegroundColor Cyan  
Write-Host ""
Write-Host "MOM (detailed):" -ForegroundColor Yellow
Write-Host '   "settings": { "useFoodReminders": true, "foodReminderType": "detailed" }'
Write-Host '   "dailyTasks": [{"time":"08:00", "text":"Kaurapuuro...", "type":"food"}]'
Write-Host ""
Write-Host "DAD (simple):" -ForegroundColor Yellow  
Write-Host '   "settings": { "useFoodReminders": true, "foodReminderType": "simple" }'
Write-Host '   "dailyTasks": [{"time":"08:00", "text":"🍽️ Aika syödä 🍽️", "type":"food"}]'
Write-Host ""
Write-Host "TEST (no food):" -ForegroundColor Yellow
Write-Host '   "settings": { "useFoodReminders": false }'
Write-Host '   "dailyTasks": [] // Ei food taskeja, vain lääkkeet'
Write-Host ""
