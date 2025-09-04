# Azure Functions Deployment Vaihtoehdot

## 🎯 **Helpoimmat menetelmät:**

### **1. Helppo PowerShell Skripti (Suositus)**

Loin tiedoston `deploy-functions-simple.ps1` joka tekee kaiken automaattisesti:

```powershell
# Suorita tämä projektin juuressa:
.\deploy-functions-simple.ps1
```

**Mitä skripti tekee:**
- ✅ Tarkistaa Azure CLI:n
- ✅ Asentaa Functions Core Tools jos puuttuu
- ✅ Kirjaudu Azureen
- ✅ Asentaa npm paketit
- ✅ Deployaa function
- ✅ Testaa API

---

### **2. Manuaaliset komennot**

Jos haluat tehdä itse:

```powershell
# 1. Asenna dependencies
npm install

# 2. Kirjaudu Azureen
az login

# 3. Deployaa
func azure functionapp publish reminderapp-functions-hrhddjfeb0bpa0ee

# 4. Testaa
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"
```

---

### **3. Azure Portal Upload**

**Helpoin aloittelijalle:**

1. Mene **Azure Portal** → **reminderapp-functions-hrhddjfeb0bpa0ee**
2. Klikkaa **Deployment Center** vasemmalla
3. Valitse **"Upload"** välilehti
4. **Luo ZIP-tiedosto:**
   ```powershell
   # Luo deployment zip
   Compress-Archive -Path * -DestinationPath deploy.zip -Force
   ```
5. **Upload zip** Azureen
6. Klikkaa **"Deploy"**

---

### **4. VS Code Extension**

**Jos käytät Visual Studio Code:a:**

1. Asenna **"Azure Functions"** extension
2. Avaa komento: `Ctrl+Shift+P`
3. Hae: **"Azure Functions: Deploy to Function App"**
4. Valitse **reminderapp-functions-hrhddjfeb0bpa0ee**
5. Klikkaa **"Deploy"**

---

### **5. GitHub Actions (Automaattinen)**

**Luodaan automaattinen deployment:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Azure Functions

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm install

    - name: Deploy to Azure
      uses: Azure/functions-action@v1
      with:
        app-name: reminderapp-functions-hrhddjfeb0bpa0ee
        package: .
        publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

---

## 📊 **Vertailu:**

| Menetelmä | Helppous | Nopeus | Luotettavuus |
|-----------|----------|--------|--------------|
| PowerShell skripti | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Azure Portal | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| VS Code | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Manuaaliset komennot | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| GitHub Actions | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🚀 **Suositus aloittelijalle:**

**Käytä PowerShell skriptiä:**
```powershell
.\deploy-functions-simple.ps1
```

**Edistyneemmälle käyttäjälle:**
**VS Code extension** tai **manuaaliset komennot**

---

## 📝 **Deployment vaatimukset:**

- ✅ Azure CLI asennettu
- ✅ Azure Functions Core Tools
- ✅ Node.js 20+
- ✅ Azure-tili ja resurssit luotu
- ✅ Function App: `reminderapp-functions-hrhddjfeb0bpa0ee`

---

## 🎯 **Kun deployment on valmis:**

Testaa API:t:

```powershell
# Perus API
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"

# Konfiguraatio API
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ConfigAPI?clientID=test"
```

**Mikä menetelmä sopii sinulle parhaiten?** 🤔

**Suosittelen aloittamaan PowerShell skriptistä!** 🎯
