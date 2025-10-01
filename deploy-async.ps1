# Async ZIP deploy Function App:iin

$publishProfilePath = "publish-profile.xml"
[xml]$publishProfile = Get-Content $publishProfilePath
$zipDeployProfile = $publishProfile.publishData.publishProfile | Where-Object { $_.publishMethod -eq "ZipDeploy" }

$username = $zipDeployProfile.userName
$password = $zipDeployProfile.userPWD
$kuduUrl = $zipDeployProfile.publishUrl -replace ':443', ''
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${username}:${password}"))

Write-Host "🚀 Deployataan deploy-functions.zip (async)..." -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "https://$kuduUrl/api/zipdeploy?isAsync=true" `
        -Method Post `
        -InFile "deploy-functions.zip" `
        -ContentType "application/octet-stream" `
        -Headers @{ Authorization = "Basic $base64Auth" }
    
    $location = $response.Headers['Location']
    Write-Host "✅ Deployment aloitettu!" -ForegroundColor Green
    Write-Host "📍 Seuranta: $location" -ForegroundColor Cyan
    
    # Odota deployment valmistumista
    Write-Host "⏱️ Odotetaan deployment valmistumista..." -ForegroundColor Cyan
    $maxWait = 120 # 2 minuuttia
    $waited = 0
    
    do {
        Start-Sleep -Seconds 5
        $waited += 5
        
        try {
            $status = Invoke-RestMethod -Uri $location `
                -Method Get `
                -Headers @{ Authorization = "Basic $base64Auth" }
            
            if ($status.status -eq "Success") {
                Write-Host "✅ Deployment valmis!" -ForegroundColor Green
                break
            } elseif ($status.status -eq "Failed") {
                Write-Host "❌ Deployment epäonnistui!" -ForegroundColor Red
                Write-Host "Virhe: $($status.message)" -ForegroundColor Red
                exit 1
            } else {
                Write-Host "⏳ Status: $($status.status)... ($waited s / $maxWait s)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "⏳ Deployment käynnissä... ($waited s / $maxWait s)" -ForegroundColor Yellow
        }
    } while ($waited -lt $maxWait)
    
    if ($waited -ge $maxWait) {
        Write-Host "⚠️ Timeout! Deployment kestää kauan, mutta jatkuu taustalla." -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "⏱️ Odota 10 sekuntia että Function App käynnistyy..." -ForegroundColor Cyan
    Start-Sleep -Seconds 10
    
} catch {
    Write-Host "❌ Virhe deployment:ssa: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

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
    Write-Host "🔗 https://lively-forest-0b274f703.1.azurestaticapps.net" -ForegroundColor Cyan
} else {
    Write-Host "❌ CORS header yhä virheellinen: '$corsHeader'" -ForegroundColor Red
    Write-Host "ℹ️ Kokeile odottaa hetki ja avaa PWA incognito-ikkunassa" -ForegroundColor Yellow
}

