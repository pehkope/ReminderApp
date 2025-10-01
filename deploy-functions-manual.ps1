# Manuaalinen Functions deployment Kudu API:lla
# Tämä käyttää Publish Profile credentialeja

$publishProfilePath = "publish-profile.xml"

if (!(Test-Path $publishProfilePath)) {
    Write-Host "❌ Publish Profile tiedostoa ei löydy!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Lataa Publish Profile:"
    Write-Host "1. Avaa: https://portal.azure.com/#@datamigos.fi/resource/subscriptions/93c14d87-4d35-4028-b2fc-bee98e5a94cb/resourceGroups/ReminderApp/providers/Microsoft.Web/sites/reminderapp-functions/vstscd"
    Write-Host "2. Klikkaa 'Download publish profile'"
    Write-Host "3. Tallenna tiedosto tähän kansioon nimellä 'publish-profile.xml'"
    exit 1
}

Write-Host "📦 Luetaan Publish Profile..." -ForegroundColor Cyan
[xml]$publishProfile = Get-Content $publishProfilePath
$zipDeployProfile = $publishProfile.publishData.publishProfile | Where-Object { $_.publishMethod -eq "ZipDeploy" }

$username = $zipDeployProfile.userName
$password = $zipDeployProfile.userPWD
$publishUrl = $zipDeployProfile.publishUrl

$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${username}:${password}"))
$zipFile = "deploy-functions.zip"

Write-Host "🚀 Deployataan $zipFile Function App:iin..." -ForegroundColor Green
Write-Host "📍 URL: https://$publishUrl/api/zipdeploy"

$result = Invoke-RestMethod -Uri "https://$publishUrl/api/zipdeploy" `
    -Method Post `
    -InFile $zipFile `
    -ContentType "application/zip" `
    -Headers @{ Authorization = "Basic $base64Auth" }

Write-Host "✅ Deployment onnistui!" -ForegroundColor Green
Write-Host "⏱️ Odota 10 sekuntia että Function App käynnistyy..."
Start-Sleep -Seconds 10

Write-Host "🧪 Testataan CORS..." -ForegroundColor Cyan
$corsTest = Invoke-WebRequest -Uri "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom" `
    -Headers @{'Origin'='https://lively-forest-0b274f703.1.azurestaticapps.net'} `
    -Method GET

$corsHeader = $corsTest.Headers['Access-Control-Allow-Origin']
if ($corsHeader -and $corsHeader -ne "null") {
    Write-Host "✅ CORS toimii! Header: $corsHeader" -ForegroundColor Green
} else {
    Write-Host "❌ CORS header yhä virheellinen: $corsHeader" -ForegroundColor Red
}

