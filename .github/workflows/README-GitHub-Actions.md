# GitHub Actions - Azure Functions Deployment

## 🚀 **Automaattinen Deployment Setup**

GitHub Actions workflow deployaa automaattisesti Azure Functions:iin kun pushaat koodia main/master branch:iin.

---

## 🔐 **GitHub Secrets Setup**

### **Vaihe 1: Luo Azure Service Principal**

```bash
# Azure CLI:ssä
az ad sp create-for-rbac --name "GitHub-ReminderApp" --role contributor --scopes /subscriptions/YOUR_SUBSCRIPTION_ID/resourceGroups/ReminderApp_RG --sdk-auth
```

**Tallenna output JSON!**

### **Vaihe 2: Hae Function App Publish Profile**

```bash
# Azure CLI:ssä
az functionapp deployment list-publishing-profiles --name reminderapp-functions --resource-group ReminderApp_RG --xml
```

**Tai Azure Portaalista:**
1. Function App → **Deployment Center**
2. **FTP credentials**
3. **Download publish profile**

### **Vaihe 3: Lisää GitHub Secrets**

**Repository settings → Secrets and variables → Actions**

Lisää seuraavat secrets:

| Secret Name | Arvo | Kuvaus |
|-------------|------|--------|
| `AZURE_CREDENTIALS` | Service Principal JSON | Azure autentikointi |
| `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` | Publish Profile XML | Function App deployment credentials |

---

## 🔄 **Workflow Toiminta**

### **Trigger:**
- ✅ Push to `main` or `master` branch
- ✅ Manual trigger (`workflow_dispatch`)

### **Vaiheet:**
1. **Checkout** - Hakee koodin
2. **Setup Node.js 20** - Asentaa Node.js
3. **Install dependencies** - `npm ci`
4. **Azure Login** - Kirjautuu Azureen
5. **Deploy Functions** - Deployaa functionit
6. **Test APIs** - Testaa deployment onnistuminen

---

## 📊 **Deployment Status**

### **Katso workflow status:**
1. GitHub repository → **Actions** tab
2. Klikkaa viimeisintä workflow run:ia
3. Katso logs jokaisesta vaiheesta

### **Azure Portaalista:**
1. Function App → **Deployment Center**
2. **Logs** näet deployment historian

---

## 🧪 **Testaus**

### **Automaattinen testaus:**
- ✅ ReminderAPI endpoint testaus
- ✅ ConfigAPI endpoint testaus
- ✅ HTTP status code tarkistus

### **Manuaalinen testaus:**
```bash
# Testaa API:t
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ConfigAPI?clientID=test"
```

---

## 🎯 **Käyttö**

### **Normaali workflow:**
1. **Tee muutoksia** lokaalisti
2. **Commit ja push** main branch:iin
3. **GitHub Actions** ajetaan automaattisesti
4. **Deployment** tapahtuu Azureen
5. **API testaus** varmistaa toimivuuden

### **Manuaalinen deployment:**
1. GitHub → **Actions**
2. Valitse **Deploy Azure Functions**
3. Klikkaa **Run workflow**

---

## ⚠️ **Huomiot**

### **Environment Protection:**
- Deployment tapahtuu `production` environment:issa
- Tarvitset approval:n jos environment protection on päällä

### **Branch Protection:**
- Suositellaan branch protection main branch:ille
- Require status checks pass

### **Security:**
- Älä koskaan tallenna credentials koodiin
- Käytä aina GitHub secrets
- Service Principal saa vain tarvittavat permissions

---

## 🔧 **Troubleshooting**

### **Deployment epäonnistuu:**
1. Tarkista Azure credentials
2. Tarkista publish profile
3. Katso workflow logs yksityiskohtaisesti

### **API testit epäonnistuvat:**
1. Odota 1-2 min deployment jälkeen
2. Tarkista Azure Portal function status
3. Testaa manuaalisesti

### **Azure Login epäonnistuu:**
1. Tarkista Service Principal JSON format
2. Varmista subscription access
3. Tarkista role permissions

---

## 📝 **Muutokset**

### **Päivitä Function App URL:**
Jos Function App URL muuttuu, päivitä:
- `.github/workflows/azure-functions-deploy.yml` rivit 52 ja 61
- `ReminderPWA/appsettings.json` ja `appsettings.Production.json`

### **Lisää uusia API endpointteja:**
Lisää testaus workflow:hin:
```yaml
- name: Test NewAPI
  run: |
    response=$(curl -s -o /dev/null -w "%{http_code}" "YOUR_NEW_API_URL")
    if [ "$response" -eq 200 ]; then
      echo "✅ NewAPI test passed"
    else
      echo "❌ NewAPI test failed"
      exit 1
    fi
```

---

## 🎉 **Valmis!**

Kun secrets on konfiguroitu, jokainen push main branch:iin deployaa automaattisesti Azure Functions:iin! 🚀

**Testaa tekemällä pieni muutos ja pushaamalla se!** ✅
