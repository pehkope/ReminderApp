# Setup Azure Blob Storage for Photos
# Luo Storage Account ja containerit valokuville

param(
    [string]$SubscriptionName = "Enel-Virtual-desktop-Infrastructure",
    [string]$ResourceGroup = "ReminderAppDB",
    [string]$Location = "swedencentral",
    [string]$StorageAccountName = "reminderappph", # Must be globally unique, 3-24 chars, lowercase
    [string]$FunctionAppName = "reminderapp-functions"
)

Write-Host "📸 Azure Blob Storage Setup - ReminderApp Photos" -ForegroundColor Cyan
Write-Host ""

# Set subscription
az account set --subscription $SubscriptionName
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Subscription ei löytynyt!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Subscription: $SubscriptionName" -ForegroundColor Green

# 1. Create Storage Account
Write-Host ""
Write-Host "1️⃣ Luodaan Storage Account: $StorageAccountName" -ForegroundColor Yellow

$storageExists = az storage account show --name $StorageAccountName --resource-group $ResourceGroup 2>$null
if ($storageExists) {
    Write-Host "⚠️  Storage Account on jo olemassa, käytetään sitä" -ForegroundColor Yellow
} else {
    az storage account create `
        --name $StorageAccountName `
        --resource-group $ResourceGroup `
        --location $Location `
        --sku Standard_LRS `
        --kind StorageV2 `
        --allow-blob-public-access true

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Storage Account luotu!" -ForegroundColor Green
    } else {
        Write-Host "❌ Storage Account luonti epäonnistui!" -ForegroundColor Red
        exit 1
    }
}

# 2. Get Connection String
Write-Host ""
Write-Host "2️⃣ Haetaan Connection String..." -ForegroundColor Yellow

$connectionString = az storage account show-connection-string `
    --name $StorageAccountName `
    --resource-group $ResourceGroup `
    --query connectionString `
    --output tsv

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Connection String haettu!" -ForegroundColor Green
} else {
    Write-Host "❌ Connection String haku epäonnistui!" -ForegroundColor Red
    exit 1
}

# 3. Create Blob Containers
Write-Host ""
Write-Host "3️⃣ Luodaan Blob Containers..." -ForegroundColor Yellow

# Photos container (public read access for easier testing)
az storage container create `
    --name "photos" `
    --account-name $StorageAccountName `
    --public-access blob `
    --connection-string $connectionString

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container 'photos' luotu!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Container 'photos' saattaa olla jo olemassa" -ForegroundColor Yellow
}

# Thumbnails container
az storage container create `
    --name "thumbnails" `
    --account-name $StorageAccountName `
    --public-access blob `
    --connection-string $connectionString

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Container 'thumbnails' luotu!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Container 'thumbnails' saattaa olla jo olemassa" -ForegroundColor Yellow
}

# 4. Add Connection String to Function App
Write-Host ""
Write-Host "4️⃣ Lisätään Connection String Function App:iin..." -ForegroundColor Yellow

az functionapp config appsettings set `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --settings "AZURE_STORAGE_CONNECTION_STRING=$connectionString"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Connection String lisätty Function App:iin!" -ForegroundColor Green
} else {
    Write-Host "❌ Connection String lisäys epäonnistui!" -ForegroundColor Red
}

# 5. Optional: Add container names (they default to "photos" and "thumbnails")
az functionapp config appsettings set `
    --name $FunctionAppName `
    --resource-group $ResourceGroup `
    --settings "PHOTOS_CONTAINER_NAME=photos" "THUMBNAILS_CONTAINER_NAME=thumbnails"

# 6. Restart Function App
Write-Host ""
Write-Host "5️⃣ Restarting Function App..." -ForegroundColor Yellow
az functionapp restart --name $FunctionAppName --resource-group $ResourceGroup

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Function App restarted!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Blob Storage setup valmis!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Luotu:" -ForegroundColor Cyan
Write-Host "   ✅ Storage Account: $StorageAccountName" -ForegroundColor White
Write-Host "   ✅ Container: photos (julkinen lukuoikeus)" -ForegroundColor White
Write-Host "   ✅ Container: thumbnails" -ForegroundColor White
Write-Host "   ✅ Connection String lisätty Function App:iin" -ForegroundColor White
Write-Host ""
Write-Host "📸 Voit nyt:" -ForegroundColor Yellow
Write-Host "   1. Ladata kuvia Azure Portal → Storage Account → Containers → photos → Upload" -ForegroundColor White
Write-Host "   2. Käyttää Photo Upload API:a (kun valmis)" -ForegroundColor White
Write-Host "   3. Lisätä kuva-metadata Cosmos DB:hen Photos-containeriin" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Storage Account URL:" -ForegroundColor Cyan
Write-Host "   https://$StorageAccountName.blob.core.windows.net/photos/" -ForegroundColor Blue
