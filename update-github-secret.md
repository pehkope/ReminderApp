# Päivitä GitHub Secret Uudella Publish Profilella

## Vaihe 1: Kopioi Publish Profile
**Kopioi tämä KOKO teksti** (mitä sinä laitoit):

```xml
<publishData><publishProfile profileName="reminderapp-functions - Web Deploy" publishMethod="MSDeploy" publishUrl="reminderapp-functions-hrhddjfeb0bpa0ee.scm.swedencentral-01.azurewebsites.net:443" msdeploySite="reminderapp-functions" userName="$reminderapp-functions" userPWD="XBBrElajoueRzd9jNdoxhYvbnpTy83lM84HgtLRe0ouYjAY1qGmsw4e2xrvC" destinationAppUrl="https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="reminderapp-functions - FTP" publishMethod="FTP" publishUrl="ftps://waws-prod-sec-007.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="REDACTED" userPWD="REDACTED" destinationAppUrl="https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net" SQLServerDBConnectionString="REDACTED" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile><publishProfile profileName="reminderapp-functions - Zip Deploy" publishMethod="ZipDeploy" publishUrl="reminderapp-functions-hrhddjfeb0bpa0ee.scm.swedencentral-01.azurewebsites.net:443" userName="$reminderapp-functions" userPWD="XBBrElajoueRzd9jNdoxhYvbnpTy83lM84HgtLRe0ouYjAY1qGmsw4e2xrvC" destinationAppUrl="https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="https://portal.azure.com" webSystem="WebSites"><databases /></publishProfile></publishData>
```

## Vaihe 2: Päivitä GitHub Secret

1. **Mene GitHub repositorioon:** https://github.com/pehkope/ReminderApp
2. **Settings** välilehti
3. **Secrets and variables** → **Actions**
4. Etsi secret: `AZUREAPPSERVICE_PUBLISHPROFILE_D4D1DD18FDFB4E5DAA3C7FD52B4EB42C`
5. Klikkaa **Update** (kynä-ikoni)
6. **Liitä KOKO publish profile** tekstikenttään
7. **Update secret**

## Vaihe 3: Käynnistä Deployment

1. **Actions** välilehti GitHubissa
2. Valitse workflow: **"Build and deploy .NET project to Azure Function App"**
3. **Run workflow** → **Run workflow**
4. Seuraa deployment logeja

## Vaihe 4: Testaa

Kun deployment on valmis:
1. Avaa: `test-health-check.html`
2. Klikkaa **"Test Health Check"**
3. Pitäisi näkyä: `"runtime": "dotnet-isolated"`

## Jos Edelleen 401 Error

Tarkista Azure Portalissa että:
- `FUNCTIONS_WORKER_RUNTIME` = `dotnet-isolated`
- `FUNCTIONS_EXTENSION_VERSION` = `~4`
- Function App on restartattu
