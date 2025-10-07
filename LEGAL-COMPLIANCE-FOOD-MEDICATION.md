# ⚖️ LAINMUKAISUUS - Ruoka- ja Lääkemuistutukset

**KRIITTINEN DOKUMENTTI** - Oikeudelliset vaatimukset ruoka- ja lääkemuistutuksille

---

## 🚨 **LAIN VAATIMUKSET:**

### **LÄÄKKEET:**

**❌ KIELLETTY:**
```
"Ota Aspirin 100mg"
"Muista lääke X"
"Aika ottaa lääkkeet: Aspirin ja Metformin"
```

**✅ SALLITTU:**
```
"💊 Muista lääkkeet"
"Lääkeaika"
"Tarkista lääkkeet"
```

**LAKI:** 
- ⚠️ **JÄRJESTELMÄ EI OLE LÄÄKEVIRASTON HYVÄKSYMÄ**
- ⚠️ **EI SAA NEUVOA MITÄ LÄÄKKEITÄ OTTAA**
- ⚠️ **RANGAISTUS** jos rikotaan lääkelainsäädäntöä
- ✅ **Vain yleiset muistutukset** sallittu

---

### **RUOKA:**

**❌ KIELLETTY:**
```
"Syö proteiinirahkaa"
"Ota aamupala: leipä + juusto"
"Muista syödä hedelmät"
```

**✅ SALLITTU:**
```
"🍽️ Muista syödä"
"Ruoka-aika"
"Muista ravitsemus"
```

**SYY:**
- ⚠️ **EI TIEDETÄ MITÄ RUOKAA ON KEITTIÖSSÄ**
- ⚠️ **EI VOIDA MÄÄRÄTÄ MITÄ SYÖDÄ**
- ✅ **Vain yleiset muistutukset** sallittu

---

## ✅ **TOTEUTUS (OIKEIN):**

### **1. DailyTask - RUOKA:**

```csharp
// YLEINEN MUISTUTUS (ei spesifistä ruokaa!)
tasks.Add(new DailyTask
{
    Id = $"food_{mealTime}_{today}",
    Type = "RUOKA",
    Time = "08:00",
    Description = "🍽️ Muista syödä",  // ✅ YLEINEN
    RequiresAck = true
});
```

**PWA näyttää:**
```
┌─────────────────────────────────┐
│  🍽️ RUOKA                       │
│  Muista syödä                   │
│  [✓ KUITATTU]                   │
└─────────────────────────────────┘
```

---

### **2. DailyTask - LÄÄKKEET:**

```csharp
// YLEINEN MUISTUTUS (ei spesifisiä lääkkeitä!)
tasks.Add(new DailyTask
{
    Id = $"medication_{today}",
    Type = "LÄÄKKEET",
    Time = "08:00",
    Description = "💊 Muista lääkkeet",  // ✅ YLEINEN
    RequiresAck = true
});
```

**PWA näyttää:**
```
┌─────────────────────────────────┐
│  💊 LÄÄKKEET                    │
│  Muista lääkkeet                │
│  [✓ KUITATTU]                   │
└─────────────────────────────────┘
```

---

## ⚙️ **ASIAKASKOHTAISET ASETUKSET:**

### **Mom (Ruoka + Lääkkeet käytössä):**

```json
{
  "clientId": "mom",
  "settings": {
    "useFoodReminders": true,
    "useMedicationReminders": true,
    "medicationReminderTime": "08:00"
  }
}
```

**PWA näyttää:**
```
08:00 - 🍽️ Muista syödä [✓ KUITATTU]
08:00 - 💊 Muista lääkkeet [✓ KUITATTU]
```

---

### **Dad (Vain ruoka, ei lääkkeitä):**

```json
{
  "clientId": "dad",
  "settings": {
    "useFoodReminders": true,
    "useMedicationReminders": false
  }
}
```

**PWA näyttää:**
```
07:00 - 🍽️ Muista syödä [✓ KUITATTU]
(Ei lääkemuistutusta)
```

---

### **Grandma (Ei mitään muistutuksia):**

```json
{
  "clientId": "grandma",
  "settings": {
    "useFoodReminders": false,
    "useMedicationReminders": false
  }
}
```

**PWA näyttää:**
```
(Ei ruoka- tai lääkemuistutuksia)
Vain PUUHAA ja tervehdykset!
```

---

## 🔒 **TURVALLISUUS:**

### **Kooditarkastus:**

```csharp
// ✅ OIKEIN (Yleinen)
Description = "💊 Muista lääkkeet"

// ❌ VÄÄRIN (Spesifinen - LAINVASTAINEN!)
Description = "💊 Ota Aspirin 100mg"
```

### **Compliance-tarkistus:**

```powershell
# Etsi vaaralliset tekstit koodista
Get-ChildItem -Recurse -Include *.cs | 
  Select-String -Pattern "Ota lääke|Aspirin|Metformin|syö rahka|syö leipä" -CaseSensitive:$false

# Tuloksena pitäisi olla: (ei tuloksia)
```

---

## 📝 **CODE REVIEW CHECKLIST:**

Ennen tuotantoon viemistä tarkista:

- [ ] ✅ Ruoka-muistutus on yleinen: "Muista syödä"
- [ ] ✅ Lääke-muistutus on yleinen: "Muista lääkkeet"
- [ ] ✅ EI mainita spesifisiä lääkkeitä: Aspirin, Metformin, jne.
- [ ] ✅ EI mainita spesifisiä ruokia: proteiinirahka, leipä, jne.
- [ ] ✅ Asiakaskohtaiset asetukset: useFoodReminders, useMedicationReminders
- [ ] ✅ MessageCard-viestit eivät sisällä ruoka/lääke-ohjeita
- [ ] ✅ Dokumentaatio ajantasalla
- [ ] ✅ Laki-kommentit koodissa

---

## 📚 **DOKUMENTIT:**

```
ReminderApp/
├── LEGAL-COMPLIANCE-FOOD-MEDICATION.md  ← Tämä dokumentti
├── MEDICATION-SCHEDULE-FUTURE.md        ← Tulevaisuuden lääkeaikataulu
├── CLIENT-MANAGEMENT-GUIDE.md           ← Asiakashallinta
└── AUTHENTICATION-AUTHORIZATION-SPEC.md ← Autentikointi
```

---

## 🚨 **VAROITUKSET:**

### **EI SAA LISÄTÄ:**

1. **Lääkelista** - "Muista lääkkeet: Aspirin, Metformin"
2. **Ruokalista** - "Syö: leipä, juusto, rahka"
3. **Annostusohjeet** - "Ota 1 tabletti aamulla"
4. **Määräykset** - "Ota lääke ruoan kanssa"
5. **Spesifit ohjeet** - Mikään joka voisi tulkita lääketieteelliseksi neuvonnaksi

---

## ✅ **TURVALLISIA VAIHTOEHTOJA:**

### **Ruoka:**
- "Muista syödä"
- "Ruoka-aika"
- "Muista ravitsemus"
- "Syömisen aika"

### **Lääkkeet:**
- "Muista lääkkeet"
- "Lääkeaika"
- "Tarkista lääkkeet"
- "Lääkkeiden aika"

---

## 📞 **VASTUUT:**

### **Järjestelmä:**
- ✅ Yleinen muistutus
- ✅ Kuitattava kenttä
- ✅ Aikaleima

### **Käyttäjä/Perhe:**
- ✅ Tietää mitä ruokaa on keittiössä
- ✅ Tietää mitä lääkkeitä ottaa
- ✅ Vastuussa toteutuksesta

### **Hoitohenkilökunta (jos mukana):**
- ✅ Voi nähdä kuitaukset
- ✅ Voi seurata noudattamista
- ❌ EI SAA määrätä lääkkeitä järjestelmän kautta

---

## 🔍 **AUDITOINTI:**

Jos viranomainen tarkastaa järjestelmän:

1. **Lääketekstit:** Vain "Muista lääkkeet" ✅
2. **Ruokatekstit:** Vain "Muista syödä" ✅
3. **Ei lääketieteellistä neuvontaa** ✅
4. **Ei ruokaohjeita** ✅
5. **Vain muistutuksia** ✅

**TULOS:** Järjestelmä on lainmukainen! ⚖️✅

---

**Status:** ✅ Compliant  
**Viimeksi päivitetty:** 2025-10-07  
**Seuraava tarkistus:** Ennen jokaista uutta ominaisuutta

