# Kudu ZIP Deploy - Ohita GitHub Actions

## Vaihe 1: Avaa Kudu Console
1. **Mene selaimessa:** 
   ```
   https://reminderapp-functions-hrhddjfeb0bpa0ee.scm.swedencentral-01.azurewebsites.net
   ```
2. **Kirjaudu sisään** samalla tunnuksella kuin Azure Portal

## Vaihe 2: ZIP Push Deploy
1. **Tools** → **Zip Push Deploy**
2. **Vedä** `dotnet-functions.zip` tiedosto sivulle
3. **Odota** että deployment valmistuu (voi kestää 2-3 minuuttia)

## Vaihe 3: Restart Function App
1. **Palaa Azure Portal** → `reminderapp-functions`
2. **Overview** → **Restart**
3. **Odota** 1-2 minuuttia

## Vaihe 4: Testaa
1. **Avaa:** `test-reminderapi-only.html`
2. **Pitäisi näkyä:** .NET API vastaus JSON-muodossa

## Jos Kudu ei toimi - Plan B: Azure CLI

```powershell
# Asenna Azure CLI jos ei ole
# winget install Microsoft.AzureCLI

# Kirjaudu
az login

# Deploy ZIP
az functionapp deployment source config-zip --resource-group ReminderApp --name reminderapp-functions --src dotnet-functions.zip
```

## Miksi tämä toimii paremmin kuin GitHub Actions?

- **Suora deployment** ilman GitHub Actions kompleksisuutta
- **Ei riippuvuuksia** publish profilesta tai secreteista  
- **Nopea** - ei build-vaihetta, vain deploy
- **Luotettava** - sama mekanismi kuin GitHub Actions käyttää sisäisesti
