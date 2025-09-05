# Vaihtoehtoiset Azure Functions Deployment Metodit

## 🚨 **Perinteinen deployment ei toimi**

Koska sekä GitHub Actions että Azure Portal epäonnistuvat, kokeillaan muita metodeja.

---

## 🔧 **Metodi 1: Manual ZIP Upload**

### **Vaihe 1: Luo ZIP Azure Portaalista**
```powershell
# Luo minimal deployment paketti
Compress-Archive -Path "minimal-test-function.js","host.json","package.json","package-lock.json" -DestinationPath "portal-deploy.zip" -Force
```

### **Vaihe 2: Upload Azure Portaaliin**
1. Azure Portal → `reminderapp-functions`
2. **Deployment Center** (vasen valikko)
3. **Upload** (nappi ylhäällä)
4. Valitse `portal-deploy.zip`
5. Klikkaa **Upload**

### **Vaihe 3: Testaa**
```
https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/MinimalTest
```

---

## 🔧 **Metodi 2: VS Code Azure Extension**

### **Edellytykset:**
- VS Code asennettu
- Azure Account extension
- Azure Functions extension

### **Vaiheet:**
1. Avaa tämä kansio VS Code:ssa
2. Azure extension (vasen reuna)
3. Functions → `reminderapp-functions`
4. **Deploy to Function App** (oikealla painike)
5. Valitse kansio jossa `minimal-test-function.js` on
6. Deploy

---

## 🔧 **Metodi 3: Azure CLI Local Deployment**

### **Testaa ensin local:**
```bash
# Asenna Azure Functions Core Tools jos ei ole
npm install -g azure-functions-core-tools@4

# Testaa local
func start --javascript
```

### **Deploy Azure:hin:**
```bash
# Kirjaudu ensin
az login

# Deploy
func azure functionapp publish reminderapp-functions --typescript false
```

---

## 🔧  **Metodi 4: Kudu Console (Advanced)**

### **Vaiheet:**
1. Azure Portal → `reminderapp-functions`
2. **Advanced Tools** → **Go** (avaa Kudu)
3. **Debug console** → **CMD**
4. **site/wwwroot/** kansio
5. Upload tiedostot manuaalisesti:
   - `minimal-test-function.js`
   - `host.json`
   - `package.json`

---

## 🎯 **Jos yksikään metodi ei toimi:**

### **Function App uudelleenluonti:**
```bash
# Poista vanha
az functionapp delete --name reminderapp-functions --resource-group ReminderApp_RG

# Luo uusi
az functionapp create --name reminderapp-functions --resource-group ReminderApp_RG --consumption-plan-location "Sweden Central" --runtime node --runtime-version 20 --functions-version 4 --storage-account reminderappstorage123
```

---

## 📊 **Testaa jokaisen metodin jälkeen:**

**Minimal function test:**
```
https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/MinimalTest
```

**Odotettu vastaus:**
```json
{
  "success": true,
  "message": "Minimal test function works!!!",
  "function": "MinimalTest"
}
```

---

## 🚀 **Suositeltu järjestys:**

1. **Manual ZIP Upload** (helpoin)
2. **VS Code Extension** (kätevä)
3. **Azure CLI Local** (jos VS Code toimii)
4. **Kudu Console** (viimeinen vaihtoehto)

---

## 📱 **Mitä menetelmää kokeillaan ensin?**

**Manual ZIP Upload on nopein testata!** 🤔

**Vai haluatko kokeilla VS Code:a?** 💻

**Kerro mikä metodi kiinnostaa!** 🎯

**Testataan deployment tällä tavalla!** ✅

