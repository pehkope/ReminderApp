# Ratkaisu 404 virheeseen - Function App toimii mutta API ei

## ✅ **Hyvä! Function App on käynnissä**

### 🔍 **Todennäköiset syyt 404 virheelle:**

1. **Function ei ole deployattu** Function App:iin
2. **Function koodissa on virhe**
3. **Route configuration väärä**
4. **Function ei ole aktivoitunut**

---

## 🛠️ **Ratkaisut:**

### **Vaihtoehto 1: Tarkista Azure Portal (Helpoin)**

1. Mene **[Azure Portal](https://portal.azure.com)**
2. Avaa **reminderapp-functions** Function App
3. Vasemmalla **Functions** välilehti

**Sinun pitäisi nähdä:**
- ✅ `ReminderAPI` function
- ✅ `ConfigAPI` function
- ✅ Status: Enabled

### **Jos functioneita ei ole:**

**Deployaa uudelleen Azure Portaalista:**
1. Mene Function App:iin
2. **Deployment Center** vasemmalla
3. **Upload** välilehti
4. **Luo ZIP:**
   ```powershell
   # Windowsissa
   Compress-Archive -Path "azure-functions-cosmos-config.js","host.json","package.json","package-lock.json",".funcignore" -DestinationPath "deploy.zip" -Force
   ```
5. **Upload** `deploy.zip`
6. **Deploy**

---

### **Vaihtoehto 2: Testaa function suoraan**

Azure Portaalista:
1. Avaa **ReminderAPI** function
2. Klikkaa **Code + Test**
3. Klikkaa **Test/Run**
4. Lisää body:
   ```json
   {
     "clientID": "test"
   }
   ```
5. Klikkaa **Run**

**Sinun pitäisi saada:**
- ✅ HTTP 200 response
- ✅ JSON data takaisin

---

### **Vaihtoehto 3: Tarkista lokit**

Azure Portaalista:
1. Mene Function App:iin
2. **Logs** vasemmalla
3. Katso onko virheitä

**Etsi:**
- Deployment errors
- Function execution errors
- Authentication errors

---

### **Vaihtoehto 4: Redeploy CLI:llä**

Jos Azure Portal ei toimi:

```powershell
# Luo uusi deployment
npm ci --only=production

Compress-Archive -Path "azure-functions-cosmos-config.js","host.json","package.json","package-lock.json",".funcignore" -DestinationPath "deploy-new.zip" -Force

# Cloud Shellissa tai toisessa terminaalissa
az functionapp deployment source config-zip --resource-group ReminderApp_RG --name reminderapp-functions --src deploy-new.zip
```

---

## 🧪 **Testaa kun korjattu:**

### **API test:**
```powershell
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"
```

### **Browser test:**
Avaa selain ja mene:
```
https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test
```

**Odotettu tulos:**
- ✅ HTTP 200
- ✅ JSON response

---

## 🔍 **Mahdolliset ongelmat:**

### **Function koodi:**
- Tarkista `azure-functions-cosmos-config.js`
- Varmista että route on oikein: `route: "ReminderAPI"`

### **Dependencies:**
- Tarkista `package.json`
- Varmista että `@azure/functions` on asennettu

### **Configuration:**
- Tarkista Function App:n **Configuration**
- Varmista että `COSMOS_ENDPOINT` ja `COSMOS_KEY` ovat oikein

---

## 🎯 **Seuraavat vaiheet:**

1. **Tarkista Azure Portal Functions** välilehti
2. **Testaa function suoraan** portalista
3. **Tarkista lokit** virheiden varalta
4. **Redeploy jos tarpeen**

**Aloita Azure Portal tarkistuksella - näet heti onko functioneita deployattu!** 🎯

**Mitä näet Functions välilehdessä?** 🤔

**Todennäköisesti tarvitaan vain redeployment!** 🔄
