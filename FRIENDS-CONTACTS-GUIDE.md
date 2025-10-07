# 👥 Ystävät ja Yhteyshenkilöt

ReminderApp tallentaa asiakkaan ystävät, perheenjäsenet ja hoitajat yhteen paikkaan. Helppo pitää yhteyttä ja muistaa kehen soittaa!

---

## 🎯 **TAVOITE:**

- 📞 **Helppo soittaminen** - Nimi + numero yhdessä paikassa
- 💬 **Muistiinpanot** - "Soita tiistaisin klo 14"
- 🗓️ **Säännölliset tapaamiset** - "Käy kahvilla joka 2. viikko"
- 👨‍👩‍👧‍👦 **Kategorisointi** - Perhe, Ystävät, Hoitajat

---

## 📋 **YHTEYSHENKILÖTYYPIT:**

### **Perhe (Family):**
- `Poika` / `Tytär`
- `Puoliso`
- `Sisar` / `Veli`
- `Lapsenlapsi`

### **Ystävät (Friends):**
- `Ystävä` / `Friend`

### **Hoitajat (Caregivers):**
- `Hoitaja`
- `Sairaanhoitaja`

### **Muut:**
- `Naapuri`
- Vapaateksti

---

## 📝 **TIETOMALLI:**

```csharp
public class ContactPerson
{
    public string Id { get; set; }              // "friend_ulla"
    public string Name { get; set; }            // "Ulla Mäkinen"
    public string Relationship { get; set; }    // "Ystävä"
    public string Phone { get; set; }           // "+358405551234"
    public string Email { get; set; }           // "ulla@example.com"
    public bool IsPrimary { get; set; }         // Pääyhteyshenkilö hätätapauksiin
    public bool CanReceiveAlerts { get; set; }  // Saa hälytykset?
    public string TelegramChatId { get; set; }  // Telegram-integraatio
    public string Notes { get; set; }           // "Soita tiistaisin klo 14"
}
```

---

## 💡 **ESIMERKIT:**

### **Esimerkki 1: Äidin ystävät**

```json
{
  "clientId": "mom",
  "fullName": "Anna Virtanen",
  "contacts": [
    {
      "id": "contact_matti",
      "name": "Matti Virtanen",
      "relationship": "Poika",
      "phone": "+358401234567",
      "isPrimary": true,
      "canReceiveAlerts": true,
      "notes": "Pääyhteyshenkilö"
    },
    {
      "id": "friend_ulla",
      "name": "Ulla Mäkinen",
      "relationship": "Ystävä",
      "phone": "+358405551234",
      "isPrimary": false,
      "canReceiveAlerts": false,
      "notes": "Entinen työkaveri, soita tiistaisin klo 14"
    },
    {
      "id": "friend_arvo",
      "name": "Arvo Nieminen",
      "relationship": "Ystävä",
      "phone": "+358405559876",
      "isPrimary": false,
      "canReceiveAlerts": false,
      "notes": "Naapuri, käy kahvilla joka toinen viikko"
    },
    {
      "id": "friend_maija",
      "name": "Maija Virtanen",
      "relationship": "Ystävä",
      "phone": "+358405552468",
      "isPrimary": false,
      "canReceiveAlerts": false,
      "notes": "Kirkkokaveri, soita perjantaisin"
    }
  ]
}
```

---

## 🛠️ **HELPER-METODIT:**

### **1. Hae ystävät:**

```csharp
var client = await _cosmosDbService.GetClientAsync("mom");
var friends = client.GetFriends();

// Palauttaa:
// - Ulla Mäkinen
// - Arvo Nieminen
// - Maija Virtanen
// - Hannele Virtanen
```

### **2. Hae perheenjäsenet:**

```csharp
var family = client.GetFamilyContacts();

// Palauttaa:
// - Matti Virtanen (Poika)
// - Liisa Korhonen (Tytär)
```

### **3. Hae hoitajat:**

```csharp
var caregivers = client.GetCaregivers();

// Palauttaa:
// - Sairaanhoitaja Leena
```

### **4. Hae pääyhteyshenkilö (hätätapauksiin):**

```csharp
var primaryContact = client.GetPrimaryContact();

// Palauttaa:
// - Matti Virtanen (isPrimary = true)
```

---

## 📱 **PWA UI - YHTEYSTIEDOT-SIVU:**

### **Layout:**

```
┌─────────────────────────────────────────┐
│  ← Takaisin          👥 YHTEYSTIEDOT    │
├─────────────────────────────────────────┤
│                                         │
│  🔍 Hae: [_____________________]        │
│                                         │
├─────────────────────────────────────────┤
│  PERHE                                  │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ 👨 Matti Virtanen               │   │
│  │ Poika                           │   │
│  │ 📞 +358401234567    [SOITA]    │   │
│  │ ⭐ Pääyhteyshenkilö             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👩 Liisa Korhonen               │   │
│  │ Tytär                           │   │
│  │ 📞 +358409876543    [SOITA]    │   │
│  │ 💬 Käy viikonloppuisin          │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  YSTÄVÄT                                │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ 👵 Ulla Mäkinen                 │   │
│  │ Ystävä                          │   │
│  │ 📞 +358405551234    [SOITA]    │   │
│  │ 💬 Soita tiistaisin klo 14      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👴 Arvo Nieminen                │   │
│  │ Ystävä                          │   │
│  │ 📞 +358405559876    [SOITA]    │   │
│  │ 💬 Kahvi joka 2. viikko         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👵 Maija Virtanen               │   │
│  │ Ystävä                          │   │
│  │ 📞 +358405552468    [SOITA]    │   │
│  │ 💬 Soita perjantaisin           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👵 Hannele Virtanen             │   │
│  │ Ystävä                          │   │
│  │ 📞 +358405553690    [SOITA]    │   │
│  │ 💬 Lounas kerran kuussa         │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

### **Toiminnot:**

1. **[SOITA]** -nappi
   - Desktop: Näytä numero isona
   - Mobile: `tel:+358405551234` link → avaa puhelinsovelma

2. **Haku:**
   - Etsi nimellä: "Ulla" → näyttää Ulla Mäkinen
   - Etsi muistiinpanoista: "tiistai" → näyttää kaikki tiistai-maininnat

3. **Järjestäminen:**
   - Perhe: Ensin primary, sitten aakkosellinen
   - Ystävät: Aakkosjärjestys
   - Hoitajat: Aakkosjärjestys

---

## 🔔 **MUISTUTUSEHDOTUKSET (TULEVAISUUS):**

### **Automaattiset ehdotukset PWA:ssa:**

```
💡 Muistutus:
"🕐 Tiistai klo 14:00 - Hyvä aika soittaa Ullalle!"
[SOITA ULLALLE]  [EI NYT]
```

```
💡 Ehdotus:
"☕ 2 viikkoa siitä kun kävit Arvon kanssa kahvilla. 
Ehdota uusi tapaaminen?"
[SOITA ARVOLLE]  [MYÖHEMMIN]
```

```
💡 Muistutus:
"📅 Perjantai - Soita Maijalle!"
[SOITA MAIJALLE]  [OHITA]
```

---

## 📊 **API ENDPOINT (TULEVAISUUS):**

### **GET /api/contacts/{clientId}**

```json
{
  "success": true,
  "clientId": "mom",
  "contacts": {
    "family": [
      {
        "name": "Matti Virtanen",
        "relationship": "Poika",
        "phone": "+358401234567",
        "isPrimary": true
      }
    ],
    "friends": [
      {
        "name": "Ulla Mäkinen",
        "relationship": "Ystävä",
        "phone": "+358405551234",
        "notes": "Soita tiistaisin klo 14"
      },
      {
        "name": "Arvo Nieminen",
        "relationship": "Ystävä",
        "phone": "+358405559876",
        "notes": "Kahvi joka 2. viikko"
      }
    ],
    "caregivers": []
  }
}
```

---

## 🎨 **OMINAISUUDET (TULEVAISUUS):**

### **1. Puheluhistoria:**
```
📞 Viimeisin puhelu: 2 päivää sitten
📊 Puheluita yhteensä: 15 kertaa
⏱️ Keskimääräinen kesto: 8 min
```

### **2. Tapaamishistoria:**
```
☕ Viimeisin tapaaminen: 1 viikko sitten
📅 Seuraava tapaaminen: Ei vielä sovittu
💡 Ehdotus: Ehdota uusi aika!
```

### **3. Syntymäpäivät:**
```
🎂 Ullan syntymäpäivä: 15.3. (5 kk päästä)
🎉 Arvon syntymäpäivä: 22.10. (15 päivää!)
💐 Ehdotus: Lähetä onnittelukortti Arvolle
```

### **4. Suosikit:**
```
⭐ Merkitse suosikiksi
→ Näkyy etusivulla "Soita suosikkiystävälle" -napissa
```

---

## 🔐 **TIETOTURVA:**

- ✅ **Yhteystiedot ovat henkilökohtaisia** - Näkyvät vain kyseisen asiakkaan tiedoissa
- ✅ **Puhelinnumerot suojattu** - Ei näytetä lokissa tai virheviestissä
- ✅ **Autentikointi** - Vaatii sisäänkirjautumisen (kun toteutettu)
- ✅ **GDPR-yhteensopiva** - Asiakas/perhe voi pyytää poistamaan yhteystietoja

---

## 📝 **MITEN LISÄTÄ YSTÄVÄ:**

### **Tapa 1: JSON (nyt):**

1. Avaa `client_mom_settings.json`
2. Lisää `contacts`-taulukkoon:
```json
{
  "id": "friend_newname",
  "name": "Nimi Sukunimi",
  "relationship": "Ystävä",
  "phone": "+358401234567",
  "email": "email@example.com",
  "isPrimary": false,
  "canReceiveAlerts": false,
  "telegramChatId": "",
  "notes": "Muistiinpanot tähän"
}
```
3. Lataa Cosmos DB:hen

### **Tapa 2: Admin UI (tulevaisuus):**

```
1. Kirjaudu Admin-paneeliin
2. Valitse asiakas (esim. mom)
3. Siirry "Yhteystiedot" -välilehdelle
4. Klikkaa [+ LISÄÄ YSTÄVÄ]
5. Täytä lomake:
   - Nimi: Ulla Mäkinen
   - Suhde: Ystävä
   - Puhelin: +358405551234
   - Muistiinpanot: Soita tiistaisin
6. Tallenna
```

---

## 📚 **ESIMERKKIDATA:**

### **Äidin tyypillinen ystäväverkosto:**

```
PERHE (2):
- Matti Virtanen (Poika) ⭐
- Liisa Korhonen (Tytär)

YSTÄVÄT (4):
- Ulla Mäkinen (Entinen työkaveri)
- Arvo Nieminen (Naapuri)
- Maija Virtanen (Kirkkokaveri)
- Hannele Virtanen (Vanha ystävä)

HOITAJAT (0):
(Ei vielä hoitajia)

YHTEENSÄ: 6 yhteyshenkilöä
```

---

## 💡 **VINKIT:**

### **Muistiinpanot-esimerkkejä:**

- ✅ **Aika:** "Soita tiistaisin klo 14"
- ✅ **Taajuus:** "Käy kahvilla joka toinen viikko"
- ✅ **Paikka:** "Tapaa Stockmannin kahvilassa"
- ✅ **Aiheet:** "Tykkää puhua puutarha-asioista"
- ✅ **Muistutus:** "Muista kysyä lapsenlapsen kuulumisia"

### **Relationship-vaihtoehtoja:**

```
PERHE:
- Poika, Tytär
- Puoliso, Aviomies, Vaimo
- Sisar, Veli
- Lapsenlapsi
- Sisko, Veli (sisarus)

YSTÄVÄT:
- Ystävä
- Entinen työkaveri
- Naapuri
- Kirkkokaveri
- Harrastuskaveri

HOITAJAT:
- Hoitaja
- Sairaanhoitaja
- Kotihoitaja
- Lääkäri
- Fysioterapeutti
```

---

**Status:** ✅ Toteutettu  
**Viimeksi päivitetty:** 2025-10-07

