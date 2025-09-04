# Deployaa Azure Functions Azure Portaalista

## 🚨 **Function Execution Count = 0**

### 🔍 **Mitä tämä tarkoittaa:**

- ✅ Function App on käynnissä
- ❌ **Ei yhtään function suorituskertaa**
- ❌ Function ei ole deployattu tai ei toimi

---

## ✅ **Ratkaisu: Redeploy Azure Portaalista**

### **Vaihe 1: Luo deployment ZIP**

```powershell
# Luo ZIP tiedosto projekti kansiossa
Compress-Archive -Path "azure-functions-cosmos-config.js","host.json","package.json","package-lock.json",".funcignore" -DestinationPath "deploy.zip" -Force

# Varmista että tiedostot ovat mukana
Get-ChildItem deploy.zip
```

### **Vaihe 2: Deployaa Azure Portaalista**

1. Mene **[Azure Portal](https://portal.azure.com)**
2. Avaa `reminderapp-functions` Function App
3. Vasemmalla **Deployment Center**
4. **Upload** välilehti
5. Klikkaa **Choose File**
6. Valitse `deploy.zip` tiedosto
7. Klikkaa **Deploy**

### **Vaihe 3: Odota deployment**

- Deployment kestää 2-5 minuuttia
- Näet progressin Deployment Center:ssä
- Status muuttuu "Success" kun valmis

### **Vaihe 4: Tarkista functionit**

Kun deployment on valmis:

1. Mene **Functions** välilehteen
2. Sinun pitäisi nähdä:
   - ✅ `ReminderAPI` function
   - ✅ `ConfigAPI` function
   - ✅ Status: `Enabled`

### **Vaihe 5: Testaa function**

1. Klikkaa **ReminderAPI** function
2. **Code + Test** välilehti
3. **Test/Run** nappi
4. Lisää test data:
   ```json
   {
     "clientID": "test"
   }
   ```
5. Klikkaa **Run**

**Tulos pitäisi olla:**
- ✅ **HTTP 200**
- ✅ **JSON response**

---

## 📊 **Tarkista execution count**

Kun function toimii:

1. Mene **Functions** välilehdelle
2. Katso **Invocation count** sarake
3. Sen pitäisi olla **1** tai enemmän

---

## 🧪 **Testaa ulkoisesti**

Kun function toimii portaalista:
```powershell
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"
```

**Odotettu:** HTTP 200 + JSON

---

## 🔍 **Jos edelleen ongelmia:**

### **Tarkista lokit:**
1. Function App:ssa → **Logs** vasemmalla
2. Katso deployment lokit

### **Tarkista konfiguraatio:**
1. Function App:ssa → **Configuration**
2. Varmista että nämä ovat oikein:
   - `COSMOS_ENDPOINT`
   - `COSMOS_KEY`
   - `COSMOS_DATABASE = ReminderAppDB`
   - `COSMOS_CONTAINER = Configurations`
   - `FUNCTIONS_WORKER_RUNTIME = node`

---

## 🎯 **Seuraavat vaiheet:**

1. ✅ Luo `deploy.zip`
2. ✅ Deployaa Azure Portaalista
3. ✅ Odota 2-5 minuuttia
4. ✅ Tarkista Functions välilehti
5. ✅ Testaa function portaalista
6. ✅ Testaa API ulkoisesti

**Aloita ZIP:n luomisesta!** 🎯

**Kun deployment on valmis, execution count muuttuu 1:ksi!** 🔄

**Onnistuuko deployment Azure Portaalista?** 🤔
