# 📊 "Anneli-automaatti" - Täysin suomenkielinen rakenne

## 🎯 **DUPLIKAATIT POISTETTU, KAIKKI SUOMEKSI**

Käytetään yhtä **"Anneli-automaatti"** Google Sheets -tiedostoa täysin suomenkielisellä rakenteella.

---

## 📋 **VÄLILEHDET (EI DUPLIKAATTEJA):**

### **✅ NYKYISET VÄLILEHDET (suomennettu):**

#### **1. 🔧 Config**
- **Mikä:** Perusasetukset ja API-tiedot
- **Säilytetään:** Tekninen nimi yhteensopivuuden vuoksi
- **Sisältö:** ClientID, UsePhotos, API-avaimet

#### **2. 📧 Viestit**  
- **Mikä:** Tärkeät tapaamiset ja menot
- **Aiemmin:** Sekä "Messages" että "Viestit" → **VAIN "Viestit"**
- **Sisältö:** Lääkäriajat, perhetapaamiset, tärkeät päivämäärät

#### **3. ✅ Kuittaukset**
- **Mikä:** OK-painikkeiden kuittausten tallentaminen  
- **Aiemmin:** Sekä "Acknowledgments" että "Kuittaukset" → **VAIN "Kuittaukset"**
- **Sisältö:** Ruoka/lääke-kuittaukset aikaleimalla

#### **4. 🖼️ Kuvat**
- **Mikä:** Valokuvien hallinta ja rotaatio
- **Aiemmin:** "Photos" → **"Kuvat"**
- **Sisältö:** Google Drive linkit, kuvatekstit, kontaktikuvat

#### **5. 📅 Tapaamiset**
- **Mikä:** Kalenteritapahtumat ja menot
- **Aiemmin:** "Appointments" → **"Tapaamiset"**  
- **Sisältö:** Strukturoidut tapaamiset ajan/paikan kanssa

---

## 🆕 **UUDET VÄLILEHDET:**

### **6. 🍽️ Ruoka-ajat**
**Sarakkeet:**
| A: ClientID | B: Aika | C: Ateria | D: Ehdotus | E: Kellonaika |
|-------------|---------|-----------|------------|---------------|
| mom | AAMU | Aamupala | Kaurapuuro marjojen kanssa | klo 8:30 |
| mom | PÄIVÄ | Lounas | Lämmin keitto ja leipää | klo 12:00 |

### **7. 💊 Lääkkeet**  
**Sarakkeet:**
| A: ClientID | B: Aika | C: Lääkkeen nimi | D: Annostus | E: Kellonaika | F: Tyyppi |
|-------------|---------|------------------|-------------|---------------|-----------|
| mom | AAMU | Magnesium | 2 tablettia | klo 8:00 | RAVINTOLISÄ |
| mom | AAMU | Verenpainelääke | 1 tabletti | klo 8:30 | LÄÄKE |

---

## 🔄 **KOODIN RAKENNE:**

### **📡 Google Apps Script:**
```javascript
const SHEET_NAMES = {
  CONFIG: "Config",           // Tekninen nimi säilytetty
  VIESTIT: "Viestit",        // Yhdistetty viestien hallinta  
  KUITTAUKSET: "Kuittaukset", // Yhdistetty kuittausten hallinta
  KUVAT: "Kuvat",            // Suomennettu Photos → Kuvat
  TAPAAMISET: "Tapaamiset",  // Suomennettu Appointments → Tapaamiset
  RUOKA_AJAT: "Ruoka-ajat",  // Uusi ruokamuistutukset
  LÄÄKKEET: "Lääkkeet"       // Uusi lääkemuistutukset
};

// EI ENÄÄ duplikaatteja: Messages, Acknowledgments, Photos, Appointments
```

### **🎯 Funktioiden toiminta:**
- **getImportantMessage_()** → Lukee **"Viestit"** välilehdeltä
- **getFoodReminders_()** → Lukee **"Ruoka-ajat"** välilehdeltä
- **getMedicineReminders_()** → Lukee **"Lääkkeet"** välilehdeltä
- **Task kuittaukset** → Tallentaa **"Kuittaukset"** välilehdelle
- **Kuvien hallinta** → Lukee **"Kuvat"** välilehdeltä

---

## 📱 **TABLET-NÄKYMÄ:**

### **🎯 Päänäkymässä näkyy:**
```
SEURAAVAKSI (AAMU)
┌─────────────────────────────────┐
│ 🍽️ RUOKA: Aamupala - Kaurapuuro │ [OK] → Kuittaukset
│    marjojen kanssa klo 8:30      │
├─────────────────────────────────┤  
│ 💊 LÄÄKKEET: Muista ottaa aamun  │ [OK] → Kuittaukset
│    lääke klo 8:30                │
├─────────────────────────────────┤
│ 💊 LÄÄKKEET: Magnesium 2         │ [OK] → Kuittaukset
│    tablettia klo 8:00            │
├─────────────────────────────────┤
│ ☀️ PUUHAA: Aamun lehden         │ (ei OK-nappia)
│    lukemista                     │
└─────────────────────────────────┘
```

### **📋 Lääkedirektiivin mukaisuus:**
- **F: LÄÄKE** → Näkyy: `💊 Muista ottaa aamun lääke klo 8:30`
- **F: RAVINTOLISÄ** → Näkyy: `💊 Magnesium 2 tablettia klo 8:00`
- **F: VITAMIINI** → Näkyy: `💊 Vitamiini D 1 kapseli lounaan kanssa`

---

## 🚀 **MIGRAATIO-OHJEET:**

### **1. 📊 Jos sinulla on vanhat englanninkieliset välilehdet:**

#### **Poista duplikaatit:**
- ❌ **"Messages"** → Siirrä data → **"Viestit"** → Poista "Messages"
- ❌ **"Acknowledgments"** → Siirrä data → **"Kuittaukset"** → Poista "Acknowledgments"  
- ❌ **"Photos"** → Siirrä data → **"Kuvat"** → Poista "Photos"
- ❌ **"Appointments"** → Siirrä data → **"Tapaamiset"** → Poista "Appointments"

#### **Luo uudet:**
- 🆕 **"Ruoka-ajat"** välilehti sarakkeineen
- 🆕 **"Lääkkeet"** välilehti sarakkeineen

### **2. 📝 Kopioi sarakkeet:**

**Ruoka-ajat:**
```
A1: ClientID    B1: Aika    C1: Ateria    D1: Ehdotus    E1: Kellonaika
```

**Lääkkeet:**
```
A1: ClientID  B1: Aika  C1: Lääkkeen nimi  D1: Annostus  E1: Kellonaika  F1: Tyyppi
```

### **3. ✅ Testaa toiminta:**
```javascript
// Google Apps Script Console
getFoodReminders_(sheet, "mom", "AAMU", 8)
getMedicineReminders_(sheet, "mom", "AAMU", 8)
```

---

## 💡 **HYÖDYT:**

### **🎯 Selkeys:**
- ✅ Ei duplikaatti-välilehtiä  
- ✅ Yhtenäinen suomenkielinen nimeäminen
- ✅ Looginen rakenne

### **🔧 Tekninen:**
- ✅ Yksi API kutsu hakee kaiken
- ✅ Kuittaukset keskitetysti yhdessä paikassa
- ✅ Helppo hallinta Google Sheets:ssä

### **👥 Käyttäjäystävällisyys:**
- ✅ Suomenkieliset välilehtien nimet
- ✅ Tuttu "Anneli-automaatti" pohja
- ✅ Ei sekaannusta englanti/suomi sekoituksesta

---

## 🧪 **LOPPUTULOS:**

**"Anneli-automaatti" Google Sheets sisältää:**
1. **Config** (tekninen)
2. **Viestit** (tärkeät menot)  
3. **Kuittaukset** (OK-painikkeet)
4. **Kuvat** (valokuvat)
5. **Tapaamiset** (kalenteri)
6. **Ruoka-ajat** (uusi)
7. **Lääkkeet** (uusi)

**Tablet näyttää kaikki RUOKA/LÄÄKKEET/PUUHAA tehtävät keskitetysti! 🚀**