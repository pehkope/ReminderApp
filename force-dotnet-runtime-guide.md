# PAKOTA .NET Runtime Azure Function App:iin

## Ongelma
- Deployment Center näyttää Node.js
- GitHub Actions deployment failaa
- Azure ei ole vaihtanut runtimea .NET:iin

## Ratkaisu: Pakota Runtime Vaihto

### Vaihe 1: Azure Portal - Configuration
1. Mene Azure Portal → `reminderapp-functions`
2. **Configuration** → **Application settings**
3. **Muuta/Lisää seuraavat:**

```
FUNCTIONS_WORKER_RUNTIME = dotnet-isolated
FUNCTIONS_EXTENSION_VERSION = ~4
WEBSITE_USE_PLACEHOLDER = 0
WEBSITE_CONTENTAZUREFILECONNECTIONSTRING = [poista tämä jos on]
WEBSITE_CONTENTSHARE = [poista tämä jos on]
```

4. **POISTA** kaikki Node.js viittaukset:
   - `WEBSITE_NODE_DEFAULT_VERSION` (jos on)
   - `npm_config_*` (jos on)

5. **Save** + **Continue**

### Vaihe 2: Restart + Stop/Start
1. **Overview** → **Restart**
2. Odota 2 minuuttia
3. **Stop** → Odota 30 sekuntia → **Start**

### Vaihe 3: Tarkista Deployment Center
1. **Deployment Center**
2. Pitäisi näyttää: **".NET"** eikä "Node.js"
3. Jos vielä Node.js → toista Vaihe 1-2

### Vaihe 4: Testaa Workflow
1. GitHub → Actions → **Run workflow** manuaalisesti
2. Seuraa logeja
3. Ei pitäisi tulla credential erroria

## Jos Ei Toimi - Plan B: Uusi Function App

```bash
# Luo uusi Function App .NET:lle
az functionapp create \
  --name reminderapp-dotnet \
  --resource-group ReminderApp \
  --consumption-plan-location "Sweden Central" \
  --runtime dotnet-isolated \
  --runtime-version 8 \
  --functions-version 4
```

Sitten:
1. Luo uusi publish profile
2. Päivitä GitHub secret
3. Muuta workflow `app-name: 'reminderapp-dotnet'`

## Tarkista Runtime
Kun valmis, testaa:
```
curl https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/health
```

Pitäisi palauttaa: `"runtime": "dotnet-isolated"`
