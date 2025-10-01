# Poista WEBSITE_RUN_FROM_PACKAGE ja deployaa Functions

$publishProfilePath = "publish-profile.xml"
[xml]$publishProfile = Get-Content $publishProfilePath
$zipDeployProfile = $publishProfile.publishData.publishProfile | Where-Object { $_.publishMethod -eq "ZipDeploy" }

$username = $zipDeployProfile.userName
$password = $zipDeployProfile.userPWD
$kuduUrl = $zipDeployProfile.publishUrl -replace ':443', ''
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${username}:${password}"))

Write-Host "🔧 Poistetaan WEBSITE_RUN_FROM_PACKAGE asetus..." -ForegroundColor Cyan

# Hae nykyiset asetukset
$settings = Invoke-RestMethod -Uri "https://$kuduUrl/api/settings" `
    -Method Get `
    -Headers @{ Authorization = "Basic $base64Auth" }

# Poista WEBSITE_RUN_FROM_PACKAGE
if ($settings.PSObject.Properties['WEBSITE_RUN_FROM_PACKAGE']) {
    Write-Host "✅ Löytyi, poistetaan..." -ForegroundColor Yellow
    
    Invoke-RestMethod -Uri "https://$kuduUrl/api/settings/WEBSITE_RUN_FROM_PACKAGE" `
        -Method Delete `
        -Headers @{ Authorization = "Basic $base64Auth" } | Out-Null
    
    Write-Host "✅ Asetus poistettu!" -ForegroundColor Green
    Write-Host "⏱️ Odota 15 sekuntia että Function App restartaa..." -ForegroundColor Cyan
    Start-Sleep -Seconds 15
} else {
    Write-Host "ℹ️ Asetusta ei löytynyt (OK)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Deployataan deploy-functions.zip..." -ForegroundColor Green

$result = Invoke-RestMethod -Uri "https://$kuduUrl/api/zipdeploy" `
    -Method Post `
    -InFile "deploy-functions.zip" `
    -ContentType "application/zip" `
    -Headers @{ Authorization = "Basic $base64Auth" }

Write-Host "✅ Deployment onnistui!" -ForegroundColor Green
Write-Host "⏱️ Odota 10 sekuntia että Function App käynnistyy..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "🧪 Testataan CORS..." -ForegroundColor Cyan
$corsTest = Invoke-WebRequest -Uri "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom" `
    -Headers @{'Origin'='https://lively-forest-0b274f703.1.azurestaticapps.net'} `
    -Method GET

$corsHeader = $corsTest.Headers['Access-Control-Allow-Origin']
Write-Host ""
if ($corsHeader -and $corsHeader -eq "https://lively-forest-0b274f703.1.azurestaticapps.net") {
    Write-Host "✅✅✅ CORS TOIMII! Header: $corsHeader" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Avaa PWA uudelleen incognito-ikkunassa!" -ForegroundColor Green
} else {
    Write-Host "❌ CORS header yhä virheellinen: $corsHeader" -ForegroundColor Red
}

