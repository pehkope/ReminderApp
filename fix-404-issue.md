# Korjaa 404 virhe - Function App ei vastaa

## 🚨 **404 Virhe jatkuu**

### 🔍 **Todennäköiset syyt:**

1. **Function App ei ole olemassa**
2. **Function App on pysäytetty**
3. **Resource Group on poistettu**
4. **Väärä URL**

---

## ✅ **Vaiheittainen ratkaisu:**

### **Vaihe 1: Tarkista Azure Portal (Pakollinen)**

1. Mene **[Azure Portal](https://portal.azure.com)**
2. Etsi `ReminderApp_RG` resource group
3. Katso mitä resursseja siellä on

**Etsi nämä:**
- ✅ `reminderapp-functions` (Function App)
- ✅ `reminderapp-cosmos` (Cosmos DB)
- ✅ `reminderappstorage123` (Storage Account)

---

### **Vaihe 2: Jos Function App löytyy:**

**Tarkista tila:**
- Klikkaa `reminderapp-functions`
- Katso **Overview** - State pitäisi olla `Running`
- Jos `Stopped` → Klikkaa **Start**

**Tarkista Functions:**
- Vasemmalla **Functions** välilehti
- Sinun pitäisi nähdä `ReminderAPI` ja `ConfigAPI`

---

### **Vaihe 3: Jos Function App EI löydy:**

**Luo uudelleen:**

1. Azure Portaalista klikkaa **Create a resource**
2. Etsi **Function App**
3. Täytä:
   - **Resource Group:** `ReminderApp_RG`
   - **Function App name:** `reminderapp-functions`
   - **Runtime stack:** `Node.js`
   - **Version:** `20 LTS`
   - **Region:** `Sweden Central`
   - **Storage account:** Valitse `reminderappstorage123`
   - **Operating System:** `Linux`

---

### **Vaihe 4: Konfiguroi Cosmos DB**

Kun Function App on luotu:

1. Mene Function App:iin → **Configuration**
2. Klikkaa **+ New application setting**
3. Lisää nämä:

```
COSMOS_ENDPOINT = [cosmos-endpoint]
COSMOS_KEY = [cosmos-key]
COSMOS_DATABASE = ReminderAppDB
COSMOS_CONTAINER = Configurations
FUNCTIONS_WORKER_RUNTIME = node
WEBSITE_NODE_DEFAULT_VERSION = ~20
```

**Hanki Cosmos tiedot:**
- Mene `reminderapp-cosmos` → **Keys**
- Kopioi **URI** ja **PRIMARY KEY**

---

### **Vaihe 5: Deployaa function koodi**

1. Mene Function App:iin → **Deployment Center**
2. Valitse **Upload** välilehti
3. **Luo ZIP tiedosto:**
   ```powershell
   Compress-Archive -Path "azure-functions-cosmos-config.js","host.json","package.json","package-lock.json",".funcignore" -DestinationPath "deploy.zip" -Force
   ```
4. **Upload** deploy.zip
5. Klikkaa **Deploy**

---

### **Vaihe 6: Testaa**

Kun deployment on valmis:
```powershell
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"
```

---

## 🔍 **Mitä Azure Portal näyttää?**

**Kerro minulle:**
- Onko `ReminderApp_RG` resource group olemassa?
- Onko `reminderapp-functions` Function App siellä?
- Mikä on Function App:n tila? (`Running`/`Stopped`)
- Onko Functions välilehdessä functioneita?

**Tämä auttaa minua antamaan tarkemman ratkaisun!** 🎯

**Todennäköisesti Function App pitää luoda uudelleen!** 🔄

**Mitä näet Azure Portaalissa?** 🤔
