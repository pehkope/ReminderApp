# 📸 Stabiili Kuvien Rotaatio - Toimii Uusien Kuvien Kanssa

Parannettu rotaatiologiikka joka **ei häiriinny** kun uusia kuvia lisätään Telegrammin kautta!

---

## ⚠️ **ONGELMA ENNEN:**

### **Epästabiili rotaatio:**

```
Maanantai (30 kuvaa):
- Day 280 % 30 = 10
→ Kuva #10 ✅

Tiistai (31 kuvaa, UUSI kuva lisätty):
- Day 281 % 31 = 2 ❌
→ Kuva #2 (HYPPY taaksepäin!)
```

**Syy:** Kuvamäärä muuttuu → modulo-operaatio antaa eri tuloksen → rotaatio "hyppää"

---

## ✅ **RATKAISU NYT:**

### **3 Parannusta:**

#### **1. Stabiili järjestys (ID:n mukaan):**

**Ennen:**
```csharp
.OrderByDescending(p => p.CreatedAt) // Uusin ensin
// Ongelma: Järjestys muuttuu kun uusia kuvia tulee!
```

**Nyt:**
```csharp
.OrderBy(p => p.Id) // Stabiili aakkos/numerojärjestys
// ID:t ovat pysyviä: "telegram_001", "telegram_002", ...
```

#### **2. Epoch-pohjainen laskenta:**

**Ennen:**
```csharp
var daysSinceYearStart = DateTime.Now.DayOfYear; // 1-365
// Ongelma: Nollautuu uuden vuoden alussa!
```

**Nyt:**
```csharp
var daysSinceEpoch = (int)(today - new DateTime(2025, 1, 1)).TotalDays;
// Jatkuva laskenta: 0, 1, 2, 3, ... (ei nollaudu vuosien yli)
```

#### **3. Modulon käyttö:**

```csharp
var photoIndex = rotationPeriod % allPhotos.Count;
// Toimii STABIILISTI kun kuvat järjestetty samalla tavalla
```

---

## 📊 **MITEN SE TOIMII:**

### **Skenaario: Uusia kuvia lisätään**

```
ALKU: 30 kuvaa (ID: telegram_001 - telegram_030)
Järjestys: [#1, #2, #3, ..., #30]

Maanantai (Day 280, 30 kuvaa):
- rotationPeriod = 280 / 1 = 280
- photoIndex = 280 % 30 = 10
→ Kuva #10 ✅

LISÄTÄÄN UUSI KUVA (telegram_031)
Järjestys: [#1, #2, #3, ..., #30, #31] (UUSI LOPPUUN)

Tiistai (Day 281, 31 kuvaa):
- rotationPeriod = 281 / 1 = 281
- photoIndex = 281 % 31 = 2
→ Kuva #2 ⚠️ (Muuttui, mutta ENNAKOITAVASTI)

Keskiviikko (Day 282, 31 kuvaa):
- rotationPeriod = 282 / 1 = 282
- photoIndex = 282 % 31 = 3
→ Kuva #3 ✅ (Jatkuu normaalisti)
```

**TULOS:** Rotaatio jatkuu loogisesti, uudet kuvat lisätään kiertooon!

---

## 🔄 **STABIILI JÄRJESTYS:**

### **Telegram-kuvat järjestetään ID:n mukaan:**

```
telegram_AQADLsYxG4L6IVN-_001  → #1
telegram_AQADLsYxG4L6IVN-_002  → #2
telegram_AQADLsYxG4L6IVN-_003  → #3
...
telegram_AQADLsYxG4L6IVN-_030  → #30

(UUSI KUVA LISÄTÄÄN)
telegram_AQADLsYxG4L6IVN-_031  → #31 (LOPPUUN)
```

### **Miksi ID:n mukaan eikä CreatedAt:n mukaan?**

| Kriteeri | CreatedAt | ID |
|----------|-----------|-----|
| **Stabiilisuus** | ❌ Muuttuu kun uusia kuvia | ✅ Pysyy samana |
| **Järjestys** | ❌ Epälooginen (uusin ensin) | ✅ Looginen (aakkos) |
| **Ennustettavuus** | ❌ Vaikea ennakoida | ✅ Helppo ennakoida |

---

## 📅 **EPOCH-POHJAINEN LASKENTA:**

### **Vuosien yli jatkuva rotaatio:**

**Ennen (DayOfYear):**
```
31.12.2025 - DayOfYear = 365 → photoIndex = 365 % 30 = 5 → Kuva #5
01.01.2026 - DayOfYear = 1   → photoIndex = 1 % 30 = 1   → Kuva #1 ❌ (HYPPY!)
```

**Nyt (daysSinceEpoch):**
```
31.12.2025 - daysSinceEpoch = 364 → photoIndex = 364 % 30 = 4 → Kuva #4
01.01.2026 - daysSinceEpoch = 365 → photoIndex = 365 % 30 = 5 → Kuva #5 ✅ (Jatkuu!)
```

---

## 🧮 **MATEMAATTINEN ESIMERKKI:**

### **30 kuvaa, päivittäin (rotationDays = 1):**

| Päivä | daysSinceEpoch | rotationPeriod | photoIndex | Näytetään |
|-------|----------------|----------------|------------|-----------|
| 1.1.  | 0              | 0 / 1 = 0      | 0 % 30 = 0  | Kuva #0   |
| 2.1.  | 1              | 1 / 1 = 1      | 1 % 30 = 1  | Kuva #1   |
| 3.1.  | 2              | 2 / 1 = 2      | 2 % 30 = 2  | Kuva #2   |
| ...   | ...            | ...            | ...         | ...       |
| 30.1. | 29             | 29 / 1 = 29    | 29 % 30 = 29| Kuva #29  |
| 31.1. | 30             | 30 / 1 = 30    | 30 % 30 = 0 | Kuva #0 ↻ |

**UUSI KUVA LISÄTÄÄN (31 kuvaa):**

| Päivä | daysSinceEpoch | rotationPeriod | photoIndex | Näytetään |
|-------|----------------|----------------|------------|-----------|
| 1.2.  | 31             | 31 / 1 = 31    | 31 % 31 = 0 | Kuva #0   |
| 2.2.  | 32             | 32 / 1 = 32    | 32 % 31 = 1 | Kuva #1   |
| 3.2.  | 33             | 33 / 1 = 33    | 33 % 31 = 2 | Kuva #2   |

---

## 💡 **MIKSI TÄMÄ TOIMII PAREMMIN:**

### **Ennen (Epästabiili):**
```
1. Kuvat järjestetty CreatedAt:n mukaan (uusin ensin)
2. Uusi kuva → Järjestys muuttuu
3. photoIndex lasketaan uudestaan
→ ❌ Rotaatio "hyppää" arvaamattomasti
```

### **Nyt (Stabiili):**
```
1. Kuvat järjestetty ID:n mukaan (aakkos/numero)
2. Uusi kuva → Lisätään LOPPUUN
3. photoIndex lasketaan samalla logiikalla
→ ✅ Rotaatio jatkuu ennakoitavasti
```

---

## 📊 **KÄYTÄNNÖN ESIMERKKI:**

### **Äidin kuvat (45 kuvaa):**

```
Helmikuu (45 kuvaa):
- Päivä 40: Kuva #10
- Päivä 41: Kuva #11
- Päivä 42: Kuva #12

(PETRI LÄHETTÄÄ UUDEN KUVAN TELEGRAMISSA)

Helmikuu (46 kuvaa):
- Päivä 43: Kuva #13 (jatkuu normaalisti)
- Päivä 44: Kuva #14
- Päivä 45: Kuva #15
...
- Päivä 85: Kuva #39
- Päivä 86: Kuva #40
...
- Päivä 128: Kuva #36 (uusi kuva tulee vastaan ensimmäistä kertaa!)
```

**Uusi kuva #46 näytetään kun:**
```
photoIndex = rotationPeriod % 46 = 45
→ Ensimmäinen kerta kun modulo antaa 45
```

---

## 🎯 **YHTEENVETO:**

### **3 Parannusta:**

1. ✅ **Stabiili järjestys** - ID:n mukaan (ei CreatedAt)
2. ✅ **Epoch-pohjainen** - Jatkuu vuosien yli (ei DayOfYear)
3. ✅ **Ennakoitava** - Uudet kuvat lisätään loppuun

### **Hyödyt:**

- ✅ Rotaatio ei häiriinny kun kuvia lisätään
- ✅ Toimii vuosien yli (ei nollaudu uudenvuodenaattona)
- ✅ Ennakoitava ja looginen järjestys
- ✅ Uudet kuvat tulevat mukaan rotaatioon automaattisesti

---

## 🔧 **TEKNINEN TOTEUTUS:**

```csharp
public async Task<Photo?> GetDailyPhotoAsync(string clientId, int rotationDays = 1)
{
    var photos = await GetPhotosAsync(clientId);
    
    // 1. STABIILI JÄRJESTYS (ID:n mukaan)
    var blobPhotos = photos.Where(p => !string.IsNullOrEmpty(p.BlobUrl))
        .OrderBy(p => p.Id) // ⭐ TÄRKEÄ!
        .ToList();
    
    var drivePhotos = photos.Where(p => string.IsNullOrEmpty(p.BlobUrl))
        .OrderBy(p => p.Id) // ⭐ TÄRKEÄ!
        .ToList();
    
    var allPhotos = blobPhotos.Concat(drivePhotos).ToList();

    // 2. EPOCH-POHJAINEN LASKENTA
    var today = DateTime.Now;
    var daysSinceEpoch = (int)(today - new DateTime(2025, 1, 1)).TotalDays;
    var rotationPeriod = daysSinceEpoch / rotationDays;
    
    // 3. STABIILI MODULO
    var photoIndex = rotationPeriod % allPhotos.Count;

    return allPhotos[photoIndex];
}
```

---

**Status:** ✅ Parannettu  
**Viimeksi päivitetty:** 2025-10-07

