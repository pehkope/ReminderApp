# Azure Functions Deployment Logs

## 🔍 **Kolme tapaa tarkistaa deployment lokit:**

### **Tapa 1: Azure Portal (Helpoin)**

1. Mene **[Azure Portal](https://portal.azure.com)**
2. Avaa `reminderapp-functions` Function App
3. Vasemmalla **Deployment Center**
4. Katso **Logs** välilehti

**Näet:**
- ✅ Deployment historia
- ✅ Onnistuneet deploymentit
- ❌ Virheet ja epäonnistumiset
- 📊 Deployment kesto

---

### **Tapa 2: Function App Logs**

1. Function App:ssa → **Logs** vasemmalla
2. Katso **Application Insights** tai **File System** logs
3. Etsi deployment tapahtumat

**Hae nämä termit:**
- "Deployment"
- "Package deployment"
- "Function startup"
- "Error"

---

### **Tapa 3: Azure CLI (jos toimii)**

```powershell
# Deployment status
az functionapp deployment list-publishing-profiles --name reminderapp-functions --resource-group ReminderApp_RG

# Function execution logs
az functionapp log tail --name reminderapp-functions --resource-group ReminderApp_RG

# Recent deployments
az functionapp deployment list-publishing-credentials --name reminderapp-functions --resource-group ReminderApp_RG
```

---

## 📊 **Lokien tulkinta:**

### **✅ Onnistunut deployment:**
```
2025-09-03T16:45:00.000Z - Deployment successful
2025-09-03T16:45:05.000Z - Function 'ReminderAPI' started
2025-09-03T16:45:06.000Z - Function 'ConfigAPI' started
```

### **❌ Epäonnistunut deployment:**
```
2025-09-03T16:45:00.000Z - Deployment failed
2025-09-03T16:45:01.000Z - Error: Function compilation failed
2025-09-03T16:45:02.000Z - Error: Syntax error in azure-functions-reminder.js
```

### **⚠️ Function execution virheet:**
```
2025-09-03T16:45:10.000Z - Function 'ReminderAPI' failed to execute
2025-09-03T16:45:11.000Z - Error: Cosmos DB connection failed
```

---

## 🎯 **Mitä tehdä jos näet virheitä:**

### **Syntax Error:**
- Tarkista JavaScript syntaksi
- Varmista että kaikki sulut ja hakasulut ovat oikein
- Testaa `node azure-functions-reminder.js` (jos toimii)

### **Cosmos DB Error:**
- Tarkista että containerit on luotu
- Varmista environment variables
- Tarkista Cosmos DB endpoint ja key

### **Package Error:**
- Tarkista `package.json` dependencies
- Varmista että `.funcignore` on oikein
- Tarkista ZIP tiedoston sisältö

---

## 📋 **Lokien katselu Azure Portaalista:**

### **Deployment Center Logs:**
1. Mene Function App:iin
2. **Deployment Center** → **Logs**
3. Klikkaa viimeisintä deploymenttia
4. Näet yksityiskohtaiset lokit

### **Application Logs:**
1. Function App:ssa → **Logs**
2. Valitse aikaikkuna
3. Etsi deployment tapahtumat

---

## 🚀 **Seuraavat vaiheet lokien perusteella:**

**Jos deployment onnistui:**
- ✅ Testaa API endpointit
- ✅ Tarkista function execution count

**Jos deployment epäonnistui:**
- ❌ Korjaa virheet lokeista
- ❌ Redeploy korjattu versio

**Jos function toimii mutta API ei:**
- ⚠️ Tarkista Cosmos DB yhteydet
- ⚠️ Tarkista function koodi

---

## 🔧 **Pika-korjaukset:**

### **Jos Cosmos DB virhe:**
```powershell
# Tarkista Cosmos yhteydet
az cosmosdb show --name reminderapp-cosmos --resource-group ReminderApp_RG --query "{endpoint:documentEndpoint, status:status}"
```

### **Jos syntax error:**
```powershell
# Testaa function tiedosto
node azure-functions-reminder.js  # Jos ei virheitä
node azure-functions-config.js   # Jos ei virheitä
```

---

## 📞 **Apua:**

Jos näet spesifisiä virheitä lokeista, kerro minulle:

1. **Mitä virhettä näet?**
2. **Milloin se tapahtui?**
3. **Mitä olit tekemässä?**

**Aloita Azure Portal Logs tarkistuksella - se kertoo tarkasti mitä tapahtui!** 🎯

**Mitä näet deployment lokeista?** 🤔
