# 🚀 Azure Portal - Nopea JSON-data lisäys

## 📋 Tilanne:
- ✅ Cosmos DB luotu
- ✅ JSON-tiedostot valmiina 
- ⏳ **SEURAAVAKSI:** Lisää data Azure Portal:n kautta

---

## 🎯 **5 MINUUTIN OHJE:**

### **Vaihe 1: Avaa Azure Portal**
1. **Azure Portal** → [https://portal.azure.com](https://portal.azure.com)
2. **Subscription:** Enel-Virtual-desktop-Infrastructure
3. **Resource Group:** ReminderAppDB (tai oikea nimi)
4. **Cosmos DB Account:** etsi Cosmos DB -resurssi

### **Vaihe 2: Avaa Data Explorer**
1. **Cosmos DB** → **Data Explorer** (vasemmalta valikosta)
2. **Database:** ReminderAppDB
3. **Containers:** Clients, Photos, Foods, Medications, jne.

---

## 📂 **LISÄÄ JSON-DATA (Container kerrallaan):**

### **1. CLIENTS CONTAINER** 
**Mene:** Data Explorer → ReminderAppDB → **Clients** → **Items** → **New Item**

**Lisää 3 clientia erikseen:**

#### Mom (detailed food):
```json
// Kopioi client-mom.json:n sisältö
```

#### Dad (simple food):  
```json
// Kopioi client-dad.json:n sisältö
```

#### Test (no food):
```json
// Kopioi client-test.json:n sisältö  
```

### **2. PHOTOS CONTAINER**
**Mene:** Data Explorer → ReminderAppDB → **Photos** → **Items**

**Lisää 3 photoa erikseen** (`photos.json`:stä):
- photo_mom_001 (järvimaisema)
- photo_mom_002 (syksy metsässä)  
- photo_mom_003 (auringonlasku)

### **3. FOODS CONTAINER**
**Mene:** Data Explorer → ReminderAppDB → **Foods** → **Items**

**Lisää 2 foods** (`foods.json`:stä):
- food_mom_breakfast_20250914
- food_mom_lunch_20250914

### **4. MEDICATIONS CONTAINER** 
**Mene:** Data Explorer → ReminderAppDB → **Medications** → **Items**

**Lisää 2 medications** (`medications.json`:stä):
- med_mom_morning_20250914
- med_mom_evening_20250914

---

## 🧪 **TESTAA HETI DATA LISÄÄMISEN JÄLKEEN:**

### **API-kutsut:**
```bash
# MOM - detailed food reminders
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom"

# DAD - simple food reminders
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=dad"

# TEST - no food reminders
curl "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test"
```

### **Odotettavat muutokset vastauksissa:**

#### **ENNEN** (in-memory):
```json
{
  "storage": "in-memory",
  "dailyTasks": [],
  "settings": { "useFoodReminders": true }
}
```

#### **JÄLKEEN** (cosmos):
```json
{
  "storage": "cosmos",
  "settings": {
    "useFoodReminders": true,
    "foodReminderType": "detailed"  // mom
  },
  "dailyTasks": [
    {
      "time": "08:00",
      "text": "Kaurapuuro marjojen kanssa 🫐, Voileipä ja kahvi ☕",
      "type": "food"
    }
  ]
}
```

---

## ✅ **SUCCESS MERKIT:**

1. **`"storage": "cosmos"`** ← EI enää "in-memory"
2. **Client-kohtaiset asetukset** ← useFoodReminders, foodReminderType
3. **Eri dailyTasks per asiakas:**
   - **MOM**: yksityiskohtaisia ruokaehdotuksia
   - **DAD**: "🍽️ Aika syödä 🍽️" (3x päivässä)
   - **TEST**: ei food-taskeja, vain lääkkeet

---

## 🔧 **Jos API palauttaa virheitä:**

1. **Tarkista Connection String** Azure Functions:issa:
   - Function App → Configuration → Application settings  
   - `COSMOS_CONNECTION_STRING` pitää olla asetettu
   
2. **Restart Function App** connection string muutoksen jälkeen

3. **Tarkista Container nimet** että ne täsmäävät:
   - Clients, Photos, Foods, Medications, Messages, Appointments, Completions

---

**⏱️ Arvioitu aika: 5-10 minuuttia**  
**🎯 Lopputulos: Toimiva Cosmos DB integraatio 3:lla eri food-asetuksella!**
