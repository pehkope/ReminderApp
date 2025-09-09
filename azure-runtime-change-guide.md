# Azure Function App Runtime Vaihto: Node.js → .NET

## Ongelma
- .NET koodi on deployattu GitHubin kautta
- Mutta Azure Function App ajaa vielä Node.js runtimea
- Tämä estää .NET funktioiden käynnistymisen

## Ratkaisu: Vaihda Runtime Azure Portalissa

### Vaihe 1: Mene Azure Portaliin
1. Avaa [Azure Portal](https://portal.azure.com)
2. Etsi: `reminderapp-functions`
3. Klikkaa Function App:ia

### Vaihe 2: Muuta Configuration
1. Vasen menu → **Configuration**
2. **Application settings** välilehti
3. Etsi asetus: `FUNCTIONS_WORKER_RUNTIME`
4. **Muuta arvo:**
   - Vanha: `node`
   - Uusi: `dotnet-isolated`
5. Klikkaa **Save** ylhäältä
6. Klikkaa **Continue** vahvistuksessa

### Vaihe 3: Restart Function App
1. Vasen menu → **Overview**
2. Ylhäältä → **Restart**
3. Odota 2-3 minuuttia

### Vaihe 4: Testaa
Avaa: `test-health-check.html` ja testaa:
- Health Check → Pitäisi palauttaa: `"runtime": "dotnet-isolated"`
- ReminderAPI → Pitäisi palauttaa äidin data

## Jos ei toimi
1. Tarkista **Deployment logs**:
   - Vasen menu → **Deployment Center**
   - **Logs** välilehti
   - Etsi virheet

2. Tarkista **Function logs**:
   - Vasen menu → **Functions**
   - Pitäisi näkyä: `HealthCheck`, `ReminderApi`

## Vaihtoehtoinen ratkaisu
Jos runtime vaihto ei toimi, voidaan luoda uusi Function App:
```bash
# PowerShell
az functionapp create --name reminderapp-dotnet-functions --resource-group ReminderApp --consumption-plan-location "Sweden Central" --runtime dotnet-isolated --functions-version 4
```

## Tärkeää
- Vanha Node.js koodi säilyy GitHubissa
- Voidaan palata takaisin muuttamalla runtime takaisin `node`
- .NET ja Node.js eivät voi ajaa samassa Function App:issa samanaikaisesti
