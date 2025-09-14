# 🔐 Unique Keys - Azure Portal Step-by-Step

## 📋 CLIENTS CONTAINER (ainoa joka tarvitsee unique keyja)

### **Vaihe 1: Container Creation**
```
1. Azure Portal → Cosmos DB → Data Explorer  
2. ➕ New Container
3. Database ID: ReminderAppDB
4. Container ID: Clients
5. Partition key: /clientId
6. Throughput: 400 RU/s (shared)
```

### **Vaihe 2: Unique Keys (Optional)**
```  
7. 🔽 Klikkaa "Advanced" tai näet "Unique keys" osion
8. ➕ "Add unique key"
```

### **Unique Key Inputs:**
```
Unique key path #1: /contacts/phone
Unique key path #2: /settings/email  
Unique key path #3: /externalId
```

### **Portal näyttää:**
```
┌─────────────────────────────┐
│ Unique keys                 │
├─────────────────────────────┤
│ ➕ Add unique key           │
│                             │
│ Path: /contacts/phone       │
│ [Remove]                    │
│                             │
│ ➕ Add unique key           │
│                             │
│ Path: /settings/email       │
│ [Remove]                    │
│                             │
│ ➕ Add unique key           │
│                             │
│ Path: /externalId           │
│ [Remove]                    │
└─────────────────────────────┘
```

### **Vaihe 3: Create Container**
```
9. 🎯 Review + Create
10. ✅ OK - Container luotu unique keyjen kanssa
```

---

## 💡 **MITÄ UNIQUE KEYS TEKEVÄT:**

### **Clients containerissa:**
```json
// ✅ SALLITTU - eri clientId
{
  "id": "mom", 
  "clientId": "mom",
  "contacts": { "phone": "+358123456789" }
}

{
  "id": "dad",
  "clientId": "dad", 
  "contacts": { "phone": "+358987654321" }  // eri numero
}

// ❌ ESTETTY - sama phone numero
{
  "id": "test",
  "clientId": "test",
  "contacts": { "phone": "+358123456789" }  // sama numero kuin mom!
}
```

---

## 🚨 **TÄRKEÄÄ UNIQUE KEYJEN KANSSA:**

### **1. Ei voi muuttaa jälkeenpäin**
- Unique keys määritetään container luonnin yhteydessä
- Jos haluat muuttaa → täytyy luoda uusi container

### **2. Tyhjät arvot sallitaan**
```json
// ✅ OK - phone puuttuu
{
  "id": "user1",
  "clientId": "user1"
  // contacts/phone ei ole → ei unique constraint
}
```

### **3. Polku täytyy olla tarkka**
```
✅ /contacts/phone        (toimii)
❌ /contacts/phoneNumber  (eri polku)
❌ /phone                 (väärä polku)
```

---

## 🤔 **PITÄÄKÖ UNIQUE KEYJA KÄYTTÄÄ?**

### **Clients containeriin - EHKÄ:**
```
👍 HYÖTY: Estää vahingossa saman puhelinnumeron/emailin
👎 HAITTA: Lisää monimutkaisuutta, error handling
```

### **Muihin containereihin - EI:**
```
Syy: clientId partition riittää eristämään data
```

---

## 🎯 **SUOSITUS REMINDERAPP:LLE:**

### **ALOITA ILMAN UNIQUE KEYJA:**
```
1. Luo kaikki containerit ilman unique keyja
2. Testaa että data toimii
3. Jos tulevaisuudessa tarvitset → luo uusi container unique keyjen kanssa
```

### **TAI - Jos haluat turvallisuutta:**
```
Clients container: /contacts/phone
Muut containerit: ei unique keyja
```

---

## 📝 **KÄYTÄNNÖN TEMPLATE:**

```
Container: Clients
├── Partition key: /clientId
├── Unique key #1: /contacts/phone  (optional)
├── Unique key #2: /settings/email  (optional)  
└── Throughput: 400 RU/s

Containers: Foods, Medications, Photos, jne.
├── Partition key: /clientId
├── Unique keys: EI MITÄÄN
└── Throughput: 400 RU/s (shared)
```

**Yksinkertaisin: Älä käytä unique keyja ollenkaan aluksi!** ✅
