# GitHub Actions Setup for Azure Functions

## 🔑 **Azure Credentials Setup**

### **Vaihe 1: Luo Service Principal**

Avaa PowerShell tai Azure CLI ja suorita:

```powershell
# Kirjaudu Azureen
az login

# Luo Service Principal
az ad sp create-for-rbac --name "ReminderAppGitHubActions" --role contributor --scopes /subscriptions/YOUR_SUBSCRIPTION_ID --sdk-auth
```

**Tallenna output JSON - tarvitset sen seuraavassa vaiheessa!**

---

### **Vaihe 2: Hae Publish Profile**

```powershell
# Hae Function App:n publish profile
az functionapp deployment list-publishing-profiles --name reminderapp-functions --resource-group ReminderApp_RG --xml
```

**Tai Azure Portaalista:**
1. Mene Function App:iin
2. **Deployment Center** → **FTPS credentials**
3. Kopioi **Publish Profile**

---

### **Vaihe 3: Lisää GitHub Secrets**

1. Mene **GitHub repositoryyn**
2. **Settings** → **Secrets and variables** → **Actions**
3. Klikkaa **New repository secret**

**Lisää seuraavat secretit:**

#### **AZURE_CREDENTIALS**
- **Value:** Liitä Service Principal JSON (vaihe 1)
- **Format:**
```json
{
  "clientId": "...",
  "clientSecret": "...",
  "subscriptionId": "...",
  "tenantId": "..."
}
```

#### **AZURE_FUNCTIONAPP_PUBLISH_PROFILE**
- **Value:** Liitä publish profile XML (vaihe 2)

---

## 🚀 **Workflow Käynnistäminen**

### **Automaattinen deployment:**
- **Push** `main` branchiin → automaattinen deployment
- **Pull Request** `main` branchiin → testaa deployment

### **Manuaalinen deployment:**
1. Mene **GitHub Actions** välilehteen
2. Valitse **Deploy to Azure Functions** workflow
3. Klikkaa **Run workflow**

---

## 📊 **Workflow Toiminnot**

Workflow tekee seuraavat:

1. ✅ **Checkout** - hakee uusimman koodin
2. ✅ **Node.js setup** - asentaa Node.js 20
3. ✅ **Dependencies** - asentaa npm paketit
4. ✅ **Package creation** - luo deployment zip (ilman tarpeettomia tiedostoja)
5. ✅ **Azure login** - kirjautuu Azureen
6. ✅ **Deploy** - deployaa Azure Functions:iin
7. ✅ **Test** - testaa API endpointit
8. ✅ **Cleanup** - siivoaa väliaikaiset tiedostot

---

## 🔍 **Monitorointi**

### **GitHub Actions:**
- Mene **Actions** välilehteen
- Katso workflow ajot
- Klikkaa ajoa nähdäksesi lokit

### **Azure Portal:**
- Mene Function App:iin
- **Deployment Center** → **Logs**
- Näet deployment historian

---

## 🎯 **Konfiguraatio**

**Muokkaa tarvittaessa:**
- `.github/workflows/azure-functions-deploy.yml`
- Muuta branch nimet (`main`, `master`)
- Muuta Node.js versio
- Lisää testejä

---

## 🚨 **Troubleshooting**

### **"Authentication failed"**
- Tarkista **AZURE_CREDENTIALS** secret
- Varmista että Service Principal on contributor-roolissa

### **"Deployment failed"**
- Tarkista **AZURE_FUNCTIONAPP_PUBLISH_PROFILE**
- Varmista Function App nimi ja resource group

### **"Package too large"**
- Workflow sulkee pois tarpeettomat tiedostot automaattisesti
- Jos ongelma jatkuu, tarkista `.funcignore`

---

## 💰 **Kustannukset**

- **GitHub Actions:** Ilmainen (2000 min/kuukausi)
- **Azure Functions:** Maksullinen käytön mukaan
- **Ei muita kustannuksia**

---

## 🎉 **Valmis!**

Kun secrets on konfiguroitu:

1. **Push koodi** → automaattinen deployment
2. **Katso Actions** välilehdestä progress
3. **Testaa API:t** deployment jälkeen

**GitHub Actions hoitaa kaiken automaattisesti!** 🚀

**Oletko valmis konfiguroimaan secrets?** 🤔
