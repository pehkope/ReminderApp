# Windows Terminal Azure Functions Deployment

## ✅ **Windows Terminal on hyvä valinta!**

Windows Terminal tukee moderneja terminaaliominaisuuksia paremmin kuin perinteinen PowerShell konsoli.

## 🚀 **Jatka deploymentia Windows Terminalissa:**

### **Vaihe 1: Avaa Windows Terminal**

1. **Avaa Windows Terminal** (Win + X → Windows Terminal)
2. **Valitse PowerShell** välilehdessä
3. **Siirry projektikansioon:**
   ```powershell
   cd "C:\Users\ppehkonen\source\repos\ReminderApp"
   ```

### **Vaihe 2: Tarkista Azure CLI**

```powershell
# Tarkista Azure CLI versio
az --version

# Kirjaudu Azureen jos tarpeen
az login
```

### **Vaihe 3: Tarkista Function App status**

```powershell
# Tarkista Function App:t
az functionapp list --resource-group ReminderApp_RG --output table

# Tarkista deployment status
az functionapp show --resource-group ReminderApp_RG --name reminderapp-functions --query "{name:name, state:state}"
```

### **Vaihe 4: Tarkista deployatut functionit**

```powershell
# Listaa functionit
az functionapp function list --resource-group ReminderApp_RG --name reminderapp-functions --output table
```

### **Vaihe 5: Jos functioneita ei ole, deployaa uudelleen**

```powershell
# Asenna dependencies
npm ci --only=production

# Luo deployment zip
Compress-Archive -Path "azure-functions-cosmos-config.js","host.json","package.json","package-lock.json",".funcignore" -DestinationPath "deploy.zip" -Force

# Deployaa Azureen
az functionapp deployment source config-zip --resource-group ReminderApp_RG --name reminderapp-functions --src deploy.zip
```

### **Vaihe 6: Testaa API**

```powershell
# Testaa API
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"

# Tai PowerShellillä:
Invoke-WebRequest -Uri "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test" -Method GET
```

---

## 🔧 **Windows Terminal hyödyllisiä ominaisuuksia:**

### **Useita välilehtiä:**
- **Ctrl + Shift + T** = Uusi välilehti
- **Ctrl + Shift + W** = Sulje välilehti

### **Paneelit:**
- **Alt + Shift + -** = Jaettu paneeli vaaka
- **Alt + Shift + +** = Jaettu paneeli pysty

### **Haku:**
- **Ctrl + Shift + F** = Hae terminaalista

### **Komentohistoria:**
- **F7** = Näytä komentohistoria
- **Nuoli ylös/alas** = Selaa historiaa

---

## 🎯 **Miksi Windows Terminal on parempi:**

- ✅ **Parempi PSReadLine tuki**
- ✅ **Moderneja terminaaliominaisuuksia**
- ✅ **Useita shell:eja samaan aikaan**
- ✅ **Parempi fontti ja värit**
- ✅ **Paneeli tuki**

---

## 📊 **Deployment status tarkistus:**

```powershell
# Yksinkertainen status check
az functionapp show --resource-group ReminderApp_RG --name reminderapp-functions --query "{name:name, state:state, url:defaultHostname}" -o table
```

---

## 🚨 **Jos ongelmia edelleen:**

**Vaihtoehto 1: Azure Cloud Shell**
```powershell
# Mene Azure Portal → Cloud Shell
# Käytä PowerShelliä selaimessa
```

**Vaihtoehto 2: Command Prompt**
```cmd
# Käytä Azure CLI:tä Command Promptissa
az functionapp deployment source config-zip --resource-group ReminderApp_RG --name reminderapp-functions --src deploy.zip
```

---

## 🎯 **Seuraavat vaiheet:**

1. ✅ **Avaa Windows Terminal**
2. ✅ **Siirry projekti kansioon**
3. ✅ **Tarkista Function App status**
4. ✅ **Testaa API**
5. 🔄 **Jos API ei toimi, deployaa uudelleen**

**Windows Terminal tekee työskentelystä paljon mukavampaa!** 🚀

Kokeile näitä komentoja Windows Terminalissa! 🤞
