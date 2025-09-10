# Azure Function App: Korjaa Publish Profile .NET:lle

## Ongelma
- GitHub Actions saa 401 Unauthorized
- Vanha publish profile oli Node.js:lle
- .NET tarvitsee uuden publish profilen

## Ratkaisu 1: Päivitä Runtime ja Luo Uusi Profile

### Vaihe 1: Azure Portal - Muuta Runtime
1. Mene [Azure Portal](https://portal.azure.com)
2. Etsi: `reminderapp-functions`
3. Vasen menu → **Configuration**
4. **Application settings** välilehti
5. **Muuta/Lisää:**
   - `FUNCTIONS_WORKER_RUNTIME` = `dotnet-isolated`
   - `FUNCTIONS_EXTENSION_VERSION` = `~4`
6. **Save** + **Continue**

### Vaihe 2: Restart Function App
1. Vasen menu → **Overview**
2. Ylhäältä → **Restart**
3. Odota 2 minuuttia

### Vaihe 3: Luo Uusi Publish Profile
1. Vasen menu → **Overview**
2. Ylhäältä → **Get publish profile**
3. Tallenna `.PublishSettings` tiedosto

### Vaihe 4: Päivitä GitHub Secret
1. GitHub → Repository → **Settings**
2. **Secrets and variables** → **Actions**
3. Etsi: `AZUREAPPSERVICE_PUBLISHPROFILE_D4D1DD18FDFB4E5DAA3C7FD52B4EB42C`
4. **Update** → Liitä uusi publish profile sisältö
5. **Update secret**

## Ratkaisu 2: Luo Kokonaan Uusi Function App (Varmuus)

Jos edellinen ei toimi, luodaan uusi:

```bash
# PowerShell/Terminal
az functionapp create \
  --name reminderapp-dotnet-functions \
  --resource-group ReminderApp \
  --consumption-plan-location "Sweden Central" \
  --runtime dotnet-isolated \
  --runtime-version 8 \
  --functions-version 4
```

Sitten:
1. Luo uusi publish profile
2. Luo uusi GitHub secret
3. Päivitä workflow `app-name: 'reminderapp-dotnet-functions'`

## Tarkista Publish Profile Sisältö

Oikea .NET publish profile sisältää:
```xml
<publishProfile>
  <publishMethod>MSDeploy</publishMethod>
  <publishUrl>reminderapp-functions.scm.azurewebsites.net</publishUrl>
  <!-- Ei Node.js viittauksia -->
</publishProfile>
```

## Testaa Deployment
Kun uusi profile on päivitetty:
1. GitHub → Actions → **Run workflow** manuaalisesti
2. Seuraa lokeja
3. Testaa: `test-health-check.html`

## Odotettu Tulos
- Health Check → `"runtime": "dotnet-isolated"`
- ReminderAPI → JSON data äidille
