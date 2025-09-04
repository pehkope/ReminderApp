# Luo Function App Azure Portalin kautta

## 🚀 **Helppo tapa luoda Function App**

**Klikkaa tätä linkkiä:** [Luo Function App](https://portal.azure.com/#create/Microsoft.FunctionApp)

### 📝 **Täytä seuraavat tiedot:**

**Basics-välilehti:**
- **Subscription:** Valitse Azure subscriptionisi
- **Resource Group:** `ReminderApp_RG`
- **Function App name:** `reminderapp-functions`
- **Runtime stack:** `Node.js`
- **Version:** `18 LTS`
- **Region:** `Sweden Central`

**Hosting-välilehti:**
- **Storage account:** `reminderappstorage123` (valitse juuri luotu)
- **Operating System:** `Windows` tai `Linux` (Linux suositellaan)

**Monitoring-välilehti:**
- **Application Insights:** `No` (voi jättää pois)

### ✅ **Klikkaa "Review + create"**

Kun Function App on luotu, jatka seuraaviin vaiheisiin:

1. **Konfiguroi Cosmos DB yhteydet**
2. **Deployaa function koodi**
3. **Testaa API**

---

## 🔗 **Vaihtoehtoisesti:**

Jos haluat käyttää CLI:tä, suorita tämä komento uudessa terminaalissa:

```powershell
az functionapp create --resource-group ReminderApp_RG --consumption-plan-location "Sweden Central" --runtime node --runtime-version 18 --functions-version 4 --name reminderapp-functions --storage-account reminderappstorage123
```

**Nykyinen status:**
✅ Cosmos DB: `reminderapp-cosmos`
✅ Storage Account: `reminderappstorage123`
🔄 Function App: Odotetaan luomista
