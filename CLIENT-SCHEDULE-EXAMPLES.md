# 📅 Asiakaskohtaiset Viesti-aikataulut

Jokainen asiakas voi määrittää oman aikataulunsa viesteille. Tämä mahdollistaa joustavan kustomoinnin eri asiakkaiden tarpeisiin.

---

## 🎯 **Miten se toimii?**

Viestit haetaan **aikavyöhykkeen (timeOfDay)** ja **säätilan (weatherCondition)** mukaan:

- **timeOfDay:** `morning`, `noon`, `afternoon`, `evening`
- **weatherCondition:** `sunny`, `cloudy`, `rain`, `cold`, `any`

Järjestelmä määrittää aikavyöhykkeen asiakkaan henkilökohtaisten aikojen mukaan:

```
Aamu (morning):    [morningHour - 2h] → [morningHour + 2h]
Keskipäivä (noon): [noonHour - 2h]    → [noonHour + 2h]
Iltapäivä (afternoon): [afternoonHour - 2h] → [afternoonHour + 2h]
Ilta (evening):    Kaikki muu aika
```

---

## 👩 **Esimerkki 1: Äiti (mom) - Default-aikataulu**

```json
{
  "id": "client_mom",
  "clientId": "mom",
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

**Viestien ajat:**
- 🌅 **Aamu (morning):** klo 6-10 → Viesti klo 8 aikoihin
- ☀️ **Keskipäivä (noon):** klo 10-14 → Viesti klo 12 aikoihin
- 🌆 **Iltapäivä (afternoon):** klo 14-18 → Viesti klo 16 aikoihin
- 🌙 **Ilta (evening):** klo 18-06 → Viesti klo 20 aikoihin

---

## 👨 **Esimerkki 2: Isä (dad) - Aikaisempi aikataulu**

```json
{
  "id": "client_dad",
  "clientId": "dad",
  "name": "Isä",
  "displayName": "Rakas Isä",
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

**Viestien ajat:**
- 🌅 **Aamu (morning):** klo 5-9 → Viesti klo 7 aikoihin
- ☀️ **Keskipäivä (noon):** klo 9-13 → Viesti klo 11 aikoihin
- 🌆 **Iltapäivä (afternoon):** klo 13-17 → Viesti klo 15 aikoihin
- 🌙 **Ilta (evening):** klo 17-05 → Viesti klo 19 aikoihin

---

## 👴 **Esimerkki 3: Isoisä (grandpa) - Myöhäinen aikataulu**

```json
{
  "id": "client_grandpa",
  "clientId": "grandpa",
  "name": "Isoisä",
  "displayName": "Rakas Isoisä",
  "settings": {
    "messageSchedule": {
      "morningHour": 9,
      "noonHour": 13,
      "afternoonHour": 17,
      "eveningHour": 21
    }
  }
}
```

**Viestien ajat:**
- 🌅 **Aamu (morning):** klo 7-11 → Viesti klo 9 aikoihin
- ☀️ **Keskipäivä (noon):** klo 11-15 → Viesti klo 13 aikoihin
- 🌆 **Iltapäivä (afternoon):** klo 15-19 → Viesti klo 17 aikoihin
- 🌙 **Ilta (evening):** klo 19-07 → Viesti klo 21 aikoihin

---

## 🔧 **Miten lisätä uusi asiakas?**

### **1. Luo JSON-tiedosto:**

```json
{
  "id": "client_<clientId>",
  "clientId": "<clientId>",
  "type": "client",
  "name": "Nimi",
  "displayName": "Näyttönimi",
  "timezone": "Europe/Helsinki",
  "language": "fi",
  "settings": {
    "useWeather": true,
    "usePhotos": true,
    "useTelegram": true,
    "useSMS": false,
    "useFoodReminders": true,
    "foodReminderType": "detailed",
    "simpleReminderText": "Muista syödä",
    "mealTimes": {
      "08:00": "Aamupala",
      "12:00": "Lounas",
      "15:00": "Päivällinen",
      "19:00": "Iltapala"
    },
    "messageSchedule": {
      "morningHour": 8,
      "noonHour": 12,
      "afternoonHour": 16,
      "eveningHour": 20
    },
    "showCompletedTasks": true
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "updatedAt": "2025-10-07T12:00:00Z"
}
```

### **2. Lataa Cosmos DB:hen:**

Käytä Azure Portaalia tai REST API:a ladataksesi asetus Clients-containeriin.

### **3. Luo viestit Messages-containeriin:**

Luo viestit clientId:llä (esim. `"clientId": "dad"`) ja sopivilla `timeOfDay` + `weatherCondition` yhdistelmillä.

---

## ✅ **Yhteenveto:**

- ✅ Jokainen asiakas voi määrittää omat viesti-aikansa
- ✅ Aikataulu määrittyy `messageSchedule`-objektin perusteella
- ✅ Fallback default-aikoihin (8, 12, 16, 20) jos asetuksia ei ole
- ✅ Helppo lisätä uusia asiakkaita ja kustomoida heidän kokemuksiaan!

