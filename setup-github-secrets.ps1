# GitHub Actions - Azure Credentials Setup Script
# Tämä scripti auttaa luomaan tarvittavat GitHub secrets Azure Functions deploymentille

Write-Host "🚀 GitHub Actions Azure Credentials Setup" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Yellow

# Tarkista Azure CLI
Write-Host "`n📋 Tarkistetaan Azure CLI..." -ForegroundColor Cyan
try {
    $azVersion = az --version | Select-Object -First 1
    Write-Host "✅ Azure CLI löytyi: $azVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI ei löytynyt! Asenna se ensin:" -ForegroundColor Red
    Write-Host "https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Tarkista kirjautuminen
Write-Host "`n🔐 Tarkistetaan Azure kirjautuminen..." -ForegroundColor Cyan
try {
    $account = az account show --query "{name:name, id:id}" -o json | ConvertFrom-Json
    Write-Host "✅ Kirjautunut tilille: $($account.name)" -ForegroundColor Green
    Write-Host "   Subscription ID: $($account.id)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Et ole kirjautunut Azureen!" -ForegroundColor Red
    Write-Host "Kirjaudu sisään: az login" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🔑 Luodaan Service Principal GitHub Actions:lle..." -ForegroundColor Cyan

# Luo Service Principal
$spJson = az ad sp create-for-rbac --name "GitHub-ReminderApp-$(Get-Random)" --role contributor --scopes "/subscriptions/$($account.id)/resourceGroups/ReminderApp_RG" --sdk-auth -o json

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Service Principal luotu onnistuneesti!" -ForegroundColor Green

    # Tallenna JSON tiedostoon
    $spJson | Out-File -FilePath "azure-credentials.json" -Encoding UTF8
    Write-Host "📄 Credentials tallennettu: azure-credentials.json" -ForegroundColor Green

    Write-Host "`n📋 KOPIOI tämä JSON GitHub secret:iin AZURE_CREDENTIALS:" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Yellow
    Write-Host $spJson -ForegroundColor White
    Write-Host "----------------------------------------" -ForegroundColor Yellow

} else {
    Write-Host "❌ Service Principal luonti epäonnistui!" -ForegroundColor Red
    exit 1
}

Write-Host "`n📄 Haetaan Function App Publish Profile..." -ForegroundColor Cyan

# Hae publish profile
try {
    $publishProfile = az functionapp deployment list-publishing-profiles --name reminderapp-functions --resource-group ReminderApp_RG --xml

    if ($publishProfile) {
        # Tallenna XML tiedostoon
        $publishProfile | Out-File -FilePath "functionapp-publish-profile.xml" -Encoding UTF8
        Write-Host "✅ Publish Profile haettu onnistuneesti!" -ForegroundColor Green
        Write-Host "📄 Profile tallennettu: functionapp-publish-profile.xml" -ForegroundColor Green

        Write-Host "`n📋 KOPIOI tämä XML GitHub secret:iin AZURE_FUNCTIONAPP_PUBLISH_PROFILE:" -ForegroundColor Yellow
        Write-Host "----------------------------------------" -ForegroundColor Yellow
        Write-Host $publishProfile -ForegroundColor White
        Write-Host "----------------------------------------" -ForegroundColor Yellow

    } else {
        Write-Host "⚠️  Publish Profile ei löytynyt!" -ForegroundColor Yellow
        Write-Host "Hae se Azure Portaalista: Function App → Deployment Center → FTP credentials" -ForegroundColor Cyan
    }

} catch {
    Write-Host "⚠️  Publish Profile haku epäonnistui!" -ForegroundColor Yellow
    Write-Host "Hae se Azure Portaalista: Function App → Deployment Center → FTP credentials" -ForegroundColor Cyan
}

Write-Host "`n🎯 GitHub Secrets Setup Valmis!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Yellow

Write-Host "`n📝 Seuraavat vaiheet:" -ForegroundColor Cyan
Write-Host "1. Mene GitHub repositoryyn" -ForegroundColor White
Write-Host "2. Settings → Secrets and variables → Actions" -ForegroundColor White
Write-Host "3. Lisää seuraavat secrets:" -ForegroundColor White
Write-Host "   - AZURE_CREDENTIALS (yllä oleva JSON)" -ForegroundColor White
Write-Host "   - AZURE_FUNCTIONAPP_PUBLISH_PROFILE (yllä oleva XML)" -ForegroundColor White
Write-Host "4. Testaa tekemällä push main branch:iin!" -ForegroundColor White

Write-Host "`n✅ Kaikki valmista! 🎉" -ForegroundColor Green

# Näytä luodut tiedostot
Write-Host "`n📁 Luodut tiedostot:" -ForegroundColor Cyan
if (Test-Path "azure-credentials.json") {
    Write-Host "✅ azure-credentials.json" -ForegroundColor Green
}
if (Test-Path "functionapp-publish-profile.xml") {
    Write-Host "✅ functionapp-publish-profile.xml" -ForegroundColor Green
}

Write-Host "`n⚠️  Tärkeää: Älä committaa näitä tiedostoja repositoryyn!" -ForegroundColor Red
Write-Host "   Lisää ne .gitignore:iin jos tarpeen." -ForegroundColor Yellow
