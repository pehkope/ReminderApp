# Tarkista Function App tilanne Azure Portaalista

## ✅ **Function App on käynnissä**

### 🔍 **Seuraava tarkistus:**

Koska saat 404 virheen mutta Function App on käynnissä, tarkista **Functions** välilehti:

---

## 📋 **Vaiheittainen tarkistus:**

### **Vaihe 1: Avaa Function App**

1. Mene **[Azure Portal](https://portal.azure.com)**
2. Avaa `reminderapp-functions` Function App
3. Vasemmalla valikko **Functions**

### **Vaihe 2: Tarkista functionit**

**Sinun pitäisi nähdä:**
- ✅ `ReminderAPI` function
- ✅ `ConfigAPI` function
- ✅ Status: `Enabled`

### **Vaihe 3: Jos functioneita EI ole:**

**Deployaa Azure Portaalista:**

1. Function App:ssa → **Deployment Center**
2. **Upload** välilehti
3. **Luo ZIP:**
   ```powershell
   Compress-Archive -Path "azure-functions-cosmos-config.js","host.json","package.json","package-lock.json",".funcignore" -DestinationPath "deploy.zip" -Force
   ```
4. **Upload deploy.zip**
5. Klikkaa **Deploy**
6. Odota 2-3 minuuttia

### **Vaihe 4: Testaa function**

Kun functionit ovat deployattuina:

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

**Tuloksen pitäisi olla:**
- ✅ **HTTP 200**
- ✅ **JSON response**

### **Vaihe 5: Tarkista lokit**

Jos edelleen ongelmia:
1. Function App:ssa → **Logs** vasemmalla
2. Katso deployment ja execution lokit

---

## 🎯 **Mitä näet Functions välilehdessä?**

**Kerro minulle:**
- Näetkö `ReminderAPI` ja `ConfigAPI` functionit?
- Mikä on niiden status? (Enabled/Disabled)
- Onko virheitä Logs:ssa?

---

## 🚀 **Jos functioneita ei ole:**

**Helppo deployment:**
1. Mene **Deployment Center** → **Upload**
2. Upload `deploy.zip`
3. Klikkaa **Deploy**

---

## 🧪 **Testaus:**

Kun functionit ovat deployattuina:
```powershell
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"
```

**Odotettu:** HTTP 200 + JSON

---

## 📊 **Todennäköiset syyt:**

1. **Ei functioneita deployattu** - ratkaisu: redeploy
2. **Function koodi virheellinen** - tarkista lokit
3. **Route configuration väärä** - tarkista function.json
4. **Cosmos DB yhteysongelma** - tarkista configuration

---

## 🎯 **Seuraavat vaiheet:**

1. **Tarkista Functions välilehti**
2. **Redeploy jos tarpeen**
3. **Testaa function portaalista**
4. **Tarkista lokit**

**Aloita Functions välilehden tarkistuksella!** 🎯

**Näetkö functioneita siellä?** 🤔

**Todennäköisesti tarvitaan vain redeployment!** 🔄
