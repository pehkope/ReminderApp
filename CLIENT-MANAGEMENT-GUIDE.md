# 👥 Asiakashallinta - Client Management Guide

ReminderApp tukee **useita asiakkaita (multi-tenant)** jokaisella omilla asetuksillaan, yhteyshenkilöillä ja aikatauluilla.

---

## 🎯 **Client-rakenteen perusidea:**

```
clientId (tekninen ID)  →  "mom", "dad", "uncle_john"
fullName (oikea nimi)   →  "Anna Virtanen", "Pekka Korhonen"
preferredName (kutsumanimi) →  "Anna", "Pekka"
contacts (yhteyshenkilöt)  →  Lista perheenjäseniä/hoitajia
```

---

## 📋 **Client-tietomalli:**

### **Perustiedot:**
- **`clientId`** - Tekninen tunniste (käytetään API-kutsuissa)
- **`fullName`** - Asiakkaan koko nimi
- **`preferredName`** - Kutsumanimi viesteissä
- **`gender`** - Sukupuoli (male/female/other) - vaikuttaa viesteihin
- **`dateOfBirth`** - Syntymäaika (ISO 8601)

### **Yhteyshenkilöt (`contacts`):**
```json
{
  "id": "contact_1",
  "name": "Matti Virtanen",
  "relationship": "Poika",
  "phone": "+358401234567",
  "email": "matti@example.com",
  "isPrimary": true,
  "canReceiveAlerts": true,
  "telegramChatId": "123456789",
  "notes": "Pääyhteyshenkilö"
}
```

**Yhteyshenkilötyypit (`relationship`):**
- `Poika` / `Tytär`
- `Puoliso`
- `Hoitaja`
- `Ystävä`
- `Naapuri`
- Muu vapaa teksti

### **Osoite (`address`):**
```json
{
  "street": "Esimerkkikatu 123",
  "city": "Helsinki",
  "postalCode": "00100",
  "country": "Finland"
}
```

### **Hätätiedot (`emergencyInfo`):**
```json
{
  "allergies": ["Penisilliini"],
  "medications": ["Aspirin 100mg aamuisin"],
  "medicalConditions": ["Diabetes type 2"],
  "emergencyNotes": "Muistihäiriöitä, tarvitsee päivittäistä tukea"
}
```

### **Asetukset (`settings`):**
- **Ominaisuuksien käyttö:** `useWeather`, `usePhotos`, `useTelegram`, `useSMS`
- **Ruokamuistutukset:** `useFoodReminders`, `foodReminderType`, `mealTimes`
- **Viesti-aikataulu:** `messageSchedule` (morning/noon/afternoon/evening hours)
- **UI-käyttäytyminen:** `showCompletedTasks`

---

## 📝 **Esimerkkejä:**

### **Esimerkki 1: Äiti (mom) - Nainen, muistihäiriöitä**

```json
{
  "clientId": "mom",
  "fullName": "Anna Virtanen",
  "preferredName": "Anna",
  "gender": "female",
  "contacts": [
    {
      "name": "Matti Virtanen",
      "relationship": "Poika",
      "phone": "+358401234567",
      "isPrimary": true
    },
    {
      "name": "Liisa Korhonen",
      "relationship": "Tytär",
      "phone": "+358409876543",
      "isPrimary": false
    }
  ],
  "settings": {
    "messageSchedule": {
      "morningHour": 8,
      "noonHour": 12,
      "afternoonHour": 16,
      "eveningHour": 20
    }
  }
}
```

### **Esimerkki 2: Isä (dad) - Mies, diabetes**

```json
{
  "clientId": "dad",
  "fullName": "Pekka Korhonen",
  "preferredName": "Pekka",
  "gender": "male",
  "contacts": [
    {
      "name": "Timo Korhonen",
      "relationship": "Poika",
      "phone": "+358501112222",
      "isPrimary": true
    },
    {
      "name": "Sairaanhoitaja Leena",
      "relationship": "Hoitaja",
      "phone": "+358505556666",
      "isPrimary": false
    }
  ],
  "emergencyInfo": {
    "allergies": ["Penisilliini"],
    "medications": [
      "Metformin 500mg x2 päivässä",
      "Atorvastatin 20mg iltaisin"
    ],
    "medicalConditions": ["Diabetes type 2"]
  },
  "settings": {
    "messageSchedule": {
      "morningHour": 7,
      "noonHour": 11,
      "afternoonHour": 15,
      "eveningHour": 19
    }
  }
}
```

---

## 🚀 **Miten lisätä uusi asiakas:**

### **1. Luo Client JSON-tiedosto:**

Kopioi `client_mom_settings.json` tai `client_dad_example.json` ja muokkaa:

```bash
cp client_mom_settings.json client_newclient.json
```

**Muuta ainakin:**
- `clientId` (uniikki tekninen ID)
- `fullName`, `preferredName`
- `gender`
- `dateOfBirth`
- `contacts` (lisää yhteyshenkilöt)
- `address`
- `emergencyInfo`
- `settings.messageSchedule`

### **2. Lataa Cosmos DB:hen:**

Käytä Azure Portaalia tai REST API:a ladataksesi `Clients`-containeriin.

**PowerShell-esimerkki:**
```powershell
# Hae Cosmos DB avain
$keys = az cosmosdb keys list --name reminderapp-cosmos2025 --resource-group ReminderApp-RG | ConvertFrom-Json
$primaryKey = $keys.primaryMasterKey

# Lataa JSON REST API:lla
# (katso upload-messages-cosmos.ps1 esimerkkinä)
```

### **3. Luo viestit asiakkaalle:**

Luo `Messages`-containeriin viestit jotka viittaavat uuteen `clientId`:hen:

```json
{
  "id": "morning_sunny_newclient_1",
  "clientId": "newclient",
  "timeOfDay": "morning",
  "weatherCondition": "sunny",
  "greeting": "Hyvää huomenta [nimi]!",
  "activitySuggestion": "..."
}
```

### **4. Testaa API:a:**

```bash
curl "https://reminderapp-functions-xxx.azurewebsites.net/ReminderAPI?clientID=newclient"
```

---

## 🔒 **Tietoturva:**

- **Henkilökohtaiset tiedot** ovat Cosmos DB:ssä
- **Partition key** = `clientId` (eriyttää asiakkaat toisistaan)
- **Yhteyshenkilöiden tiedot** (puh, email) ovat arkaluonteisia
- **Hätätiedot** (lääkkeet, allergiat) erityisen tärkeitä

---

## 📊 **Yhteenveto:**

✅ **Multi-tenant rakenne** - Useat asiakkaat samassa järjestelmässä  
✅ **Asiakaskohtaiset yhteyshenkilöt** - Perheenjäsenet ja hoitajat  
✅ **Hätätiedot** - Lääkkeet, allergiat, sairaudet  
✅ **Osoitetiedot** - Fyysinen sijainti  
✅ **Joustavat asetukset** - Jokainen asiakas voi kustomoida  

---

## 🎓 **Lisätiedot:**

- `CLIENT-SCHEDULE-EXAMPLES.md` - Aikataulujen kustomointi
- `client_mom_settings.json` - Täydellinen esimerkki (nainen)
- `client_dad_example.json` - Täydellinen esimerkki (mies)

