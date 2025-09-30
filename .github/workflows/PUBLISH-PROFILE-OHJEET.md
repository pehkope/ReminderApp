# 🔑 Publish Profile -ohjeet GitHub Actionsille

## ❌ Ongelma

GitHub Actions deployment kaatuu virheeseen:
```
Login failed with Error: Using auth-type: SERVICE_PRINCIPAL. 
Not all values are present. Ensure 'client-id' and 'tenant-id' are supplied.
```

## ✅ Ratkaisu: Publish Profile

Vaihdettu yksinkertaisempaan autentikointiin. Tarvitset vain yhden secretin!

---

## 📋 Vaiheet

### 1️⃣ Lataa Publish Profile Azure Portalista

1. Mene Azure Portaliin: https://portal.azure.com
2. Etsi **Function App**: `reminderapp-functions`
3. Klikkaa **"Get publish profile"** (yläpalkissa)
4. Tallenna tiedosto: `reminderapp-functions.PublishSettings`

![Get Publish Profile](https://learn.microsoft.com/en-us/azure/app-service/media/deploy-github-actions/publish-profile-download.png)

---

### 2️⃣ Lisää GitHub Secret

1. Mene GitHub-repositorioon:  
   `https://github.com/KÄYTTÄJÄNIMI/ReminderApp/settings/secrets/actions`

2. Klikkaa **"New repository secret"**

3. Täytä:
   - **Name:** `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`
   - **Value:** Avaa ladattu `.PublishSettings` tiedosto ja kopioi **KOKO sisältö** (XML)

4. Klikkaa **"Add secret"**

---

### 3️⃣ Testaa deployment

1. Push uusi commit:
   ```bash
   git add -A
   git commit -m "test: Trigger GitHub Actions"
   git push
   ```

2. Seuraa GitHub Actionsia:  
   `https://github.com/KÄYTTÄJÄNIMI/ReminderApp/actions`

3. Deployment pitäisi nyt onnistua! ✅

---

## 🔍 Troubleshooting

### "Invalid publish profile"
- Varmista että kopioit **KOKO tiedoston sisällön**
- XML alkaa: `<publishData>`
- XML loppuu: `</publishData>`

### "Resource not found"
- Tarkista Function App nimi: `reminderapp-functions`
- Varmista että Function App on olemassa Azuressa

### "Deployment failed"
- Tarkista build logi GitHub Actionsissa
- Testaa build lokaalisti: `dotnet build ReminderApp.Functions`

---

## 📚 Lisätietoa

- [Azure Functions GitHub Actions](https://learn.microsoft.com/en-us/azure/azure-functions/functions-how-to-github-actions)
- [Publish Profile vs Service Principal](https://github.com/Azure/functions-action#using-publish-profile-as-deployment-credential-recommended)
