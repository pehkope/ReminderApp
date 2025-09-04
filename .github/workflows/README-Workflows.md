# GitHub Actions Workflows - Projektien Järjestely

## 📋 **Projektien rakenne:**

```
ReminderApp Repository
├── ReminderPWA/                    # Blazor PWA App
│   ├── Components/
│   ├── Pages/
│   ├── wwwroot/
│   └── staticwebapp.config.json
├── GasProxyFunctions/              # .NET Azure Functions
│   ├── Program.cs
│   ├── host.json
│   └── publish/
├── azure-functions-*.js            # Node.js Functions
├── .github/workflows/
│   ├── azure-static-web-apps.yml   → ReminderPWA
│   ├── remindergasproxy-*.yml      → GasProxyFunctions
│   └── azure-functions-deploy.yml  → Node.js Functions
└── package.json
```

---

## 🔄 **Workflow:t ja niiden tarkoitus:**

### **1. `azure-static-web-apps.yml`**
**Mitä tekee:** Deployaa ReminderPWA:n Azure Static Web Apps:iin
- **Trigger:** Push to `main`/`master` tai PR:t
- **Prosessi:**
  1. Setup .NET 8
  2. Build Blazor app (`cd ReminderPWA`)
  3. Publish to `../publish`
  4. Copy `staticwebapp.config.json`
  5. Deploy Azure Static Web Apps:iin
- **Kohde:** `ReminderPWA/` kansio
- **Output:** `publish/wwwroot/`

### **2. `remindergasproxy-f9exfrbyfsend9bh.yml`**
**Mitä tekee:** Deployaa GasProxyFunctions .NET Azure Functions:iin
- **Trigger:** Push to `master`
- **Prosessi:**
  1. Setup .NET 8
  2. Publish Functions (`cd GasProxyFunctions`)
  3. Deploy ZIP:lle `GasProxyFunctions/publish`
- **Kohde:** `GasProxyFunctions/` kansio
- **Output:** .NET Azure Functions

### **3. `azure-functions-deploy.yml`**
**Mitä tekee:** Deployaa Node.js Azure Functions:iin
- **Trigger:** Push to `main`/`master` tai manual
- **Prosessi:**
  1. Setup Node.js 20
  2. Install npm packages
  3. Azure login
  4. ZIP deploy: `deploy.zip`
  5. Restart Function App
  6. Test API:t
- **Kohde:** Root taso (azure-functions-*.js tiedostot)
- **Output:** Node.js Azure Functions

---

## 🎯 **Miten välttää konflikteja:**

### **1. Path-based filtering:**
```yaml
# Esimerkki: Triggeröi vain kun ReminderPWA tiedostoja muutetaan
on:
  push:
    paths:
      - 'ReminderPWA/**'
```

### **2. Branch-based filtering:**
```yaml
# Esimerkki: Eri branchit eri projekteille
on:
  push:
    branches:
      - main-pwa        # ReminderPWA
      - main-functions  # Functions
```

### **3. Manual trigger:**
```yaml
# Esimerkki: Manual trigger workflow:lle
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment'
        required: true
        default: 'production'
```

---

## 🚀 **Suositeltu järjestely:**

### **Vaihtoehto 1: Eri repositoryt (Suositeltu)**
```
reminderapp-pwa/           # ReminderPWA repository
├── ReminderPWA/
└── .github/workflows/

reminderapp-functions/     # Functions repository
├── azure-functions-*.js
└── .github/workflows/

reminderapp-gas/           # Gas proxy repository
├── GasProxyFunctions/
└── .github/workflows/
```

### **Vaihtoehto 2: Path filtering (Nykyinen)**
Päivitä workflow:t seuraavasti:

```yaml
# azure-static-web-apps.yml
on:
  push:
    paths:
      - 'ReminderPWA/**'
      - '.github/workflows/azure-static-web-apps.yml'
```

```yaml
# azure-functions-deploy.yml
on:
  push:
    paths:
      - 'azure-functions-*.js'
      - 'host.json'
      - 'package.json'
      - '.github/workflows/azure-functions-deploy.yml'
```

---

## 🔧 **Konfliktien ratkaiseminen:**

### **Jos Static Web App deployment epäonnistuu:**
1. Tarkista että `staticwebapp.config.json` on mukana
2. Varmista `app_location: "/publish"`
3. Tarkista että `publish/wwwroot/` on olemassa

### **Jos Functions deployment epäonnistuu:**
1. Tarkista että oikeat tiedostot ovat ZIP:issä
2. Varmista Function App konfiguraatio
3. Tarkista environment variables

### **Jos useampi workflow triggeröityy:**
1. Lisää path filtering workflow:hin
2. Tai käytä eri brancheja eri projekteille
3. Tai siirrä projektit eri repositoryihin

---

## 📊 **Monitoring:**

### **Workflow status:**
- GitHub → **Actions** tab
- Näet kaikki workflow ajot
- Klikkaa workflow:ta nähdäksesi logs

### **Deployment status:**
- **Azure Portal** → Resurssit
- **Static Web Apps** → Deployment history
- **Function Apps** → Deployment Center

---

## 🎉 **Yhteenveto:**

**Nykyinen setup toimii mutta voi aiheuttaa konflikteja.** Suositellaan:

1. **Path filtering** workflow:hin ✅
2. **Tai eri repositoryt** projekteille ✅
3. **Selkeä dokumentaatio** mitä kukin tekee ✅

**Mikä vaihtoehto haluat käyttää?** 🤔

**Path filtering on nopeampi korjata, eri repositoryt ovat pitkäaikainen ratkaisu!** 🚀
