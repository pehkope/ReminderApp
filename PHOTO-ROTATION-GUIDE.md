# 📸 Kuvien Rotaatio - Päivittäin tai Joka Toinen Päivä

Valokuvat vaihtuvat automaattisesti päiväkohtaisesti, jotta sama kuva näytetään koko päivän (tai 2 päivää).

---

## 🎯 **ONGELMA ENNEN:**

❌ **Satunnainen kuva joka kerta:**
- PWA latautuu → Satunnainen kuva
- Käyttäjä päivittää sivun → Eri kuva
- Sama kuva ei pysy koko päivää

**Tulos:** Sekava käyttökokemus, käyttäjä näkee eri kuvan joka kerta.

---

## ✅ **RATKAISU NYT:**

✅ **Päiväkohtainen rotaatio:**
- Kuva valitaan päivän perusteella
- Sama kuva koko päivän ajan
- Seuraavana päivänä uusi kuva

✅ **Asetettava vaihtoväli:**
- `photoRotationDays: 1` → Vaihtu päivittäin
- `photoRotationDays: 2` → Vaihtu joka toinen päivä

---

## 🔧 **MITEN SE TOIMII:**

### **1. Rotaatio-logiikka:**

```csharp
// Laske päiväkohtainen indeksi
var daysSinceYearStart = DateTime.Now.DayOfYear; // 1-365
var rotationPeriod = daysSinceYearStart / rotationDays;
var photoIndex = rotationPeriod % allPhotos.Count;

// Esimerkki: 30 kuvaa, päivittäin (rotationDays = 1)
// Päivä 1: (1 / 1) % 30 = 1 → Kuva #1
// Päivä 2: (2 / 1) % 30 = 2 → Kuva #2
// Päivä 30: (30 / 1) % 30 = 0 → Kuva #30
// Päivä 31: (31 / 1) % 30 = 1 → Kuva #1 (kierto alkaa alusta)

// Esimerkki: 30 kuvaa, joka toinen päivä (rotationDays = 2)
// Päivä 1-2: (1 / 2) % 30 = 0 → Kuva #0 (sama 2 päivää)
// Päivä 3-4: (3 / 2) % 30 = 1 → Kuva #1 (sama 2 päivää)
// Päivä 5-6: (5 / 2) % 30 = 2 → Kuva #2 (sama 2 päivää)
```

### **2. Kuvien järjestys:**

```csharp
// Prioriteetti:
1. Telegram-kuvat (BlobUrl) - uusimmasta vanhimpaan
2. Google Drive -kuvat - vanhat kuvat

// Esimerkki: 5 Telegram-kuvaa + 20 Google Drive -kuvaa
// Järjestys:
// [0-4]: Telegram #1-5 (uusimmasta vanhimpaan)
// [5-24]: Google Drive #1-20
```

---

## ⚙️ **ASIAKASKOHTAISET ASETUKSET:**

### **Mom (Päivittäin):**

```json
{
  "clientId": "mom",
  "settings": {
    "photoRotationDays": 1
  }
}
```

**Tulos:**
- Maanantai: Kuva #1
- Tiistai: Kuva #2
- Keskiviikko: Kuva #3
- ...

---

### **Dad (Joka Toinen Päivä):**

```json
{
  "clientId": "dad",
  "settings": {
    "photoRotationDays": 2
  }
}
```

**Tulos:**
- Maanantai-Tiistai: Kuva #1 (sama 2 päivää)
- Keskiviikko-Torstai: Kuva #2 (sama 2 päivää)
- Perjantai-Lauantai: Kuva #3 (sama 2 päivää)
- ...

---

## 📊 **ESIMERKKEJÄ:**

### **Esimerkki 1: 30 kuvaa, päivittäin**

| Päivä | DayOfYear | rotationPeriod | photoIndex | Näytetään |
|-------|-----------|----------------|------------|-----------|
| 1.1.  | 1         | 1 / 1 = 1      | 1 % 30 = 1 | Kuva #1   |
| 2.1.  | 2         | 2 / 1 = 2      | 2 % 30 = 2 | Kuva #2   |
| 15.1. | 15        | 15 / 1 = 15    | 15 % 30 = 15 | Kuva #15 |
| 30.1. | 30        | 30 / 1 = 30    | 30 % 30 = 0 | Kuva #30 |
| 31.1. | 31        | 31 / 1 = 31    | 31 % 30 = 1 | Kuva #1 ↻ |

---

### **Esimerkki 2: 30 kuvaa, joka 2. päivä**

| Päivä   | DayOfYear | rotationPeriod | photoIndex | Näytetään |
|---------|-----------|----------------|------------|-----------|
| 1.1.-2.1. | 1-2    | 1 / 2 = 0      | 0 % 30 = 0 | Kuva #0   |
| 3.1.-4.1. | 3-4    | 3 / 2 = 1      | 1 % 30 = 1 | Kuva #1   |
| 5.1.-6.1. | 5-6    | 5 / 2 = 2      | 2 % 30 = 2 | Kuva #2   |
| 29.1.-30.1. | 29-30 | 29 / 2 = 14  | 14 % 30 = 14 | Kuva #14 |
| 31.1.-1.2. | 31-32 | 31 / 2 = 15   | 15 % 30 = 15 | Kuva #15 |

---

## 🔄 **KUVIEN KIERTO:**

### **Kun kaikki kuvat on nähty:**

```
30 kuvaa, päivittäin:
- Päivä 1-30: Kuva #1-30
- Päivä 31: Kuva #1 (kierto alkaa alusta)
- Päivä 61: Kuva #1 (toinen kierros)
...

30 kuvaa, joka 2. päivä:
- Päivä 1-60: Kuva #0-29 (2 päivää per kuva)
- Päivä 61-62: Kuva #0 (kierto alkaa alusta)
...
```

---

## 📱 **PWA KÄYTTÖKOKEMUS:**

### **Ennen (Satunnainen):**
```
08:00 - Kuva #5
09:00 - Kuva #12 ❌ (Eri kuva!)
12:00 - Kuva #3  ❌ (Taas eri!)
```

### **Nyt (Päiväkohtainen):**
```
Maanantai:
08:00 - Kuva #5
09:00 - Kuva #5 ✅ (Sama kuva!)
12:00 - Kuva #5 ✅ (Sama kuva!)
23:59 - Kuva #5 ✅ (Sama kuva!)

Tiistai:
00:01 - Kuva #6 ✅ (Uusi päivä, uusi kuva!)
```

---

## 🛠️ **ASETUKSEN MUUTTAMINEN:**

### **PowerShell:**

```powershell
# Lue client settings
$json = Get-Content client_mom_settings.json -Raw | ConvertFrom-Json

# Muuta rotaatio
$json.settings.photoRotationDays = 2  # 1 = päivittäin, 2 = joka 2. päivä

# Tallenna
$json | ConvertTo-Json -Depth 10 | Set-Content client_mom_settings.json

# Lataa Cosmos DB:hen
.\upload-client-cosmos.ps1
```

---

## 📊 **API RESPONSE:**

```json
{
  "success": true,
  "clientID": "mom",
  "settings": {
    "photoRotationDays": 1
  },
  "dailyPhotoUrl": "https://reminderapprga7c7.blob.core.windows.net/photos/mom_20251006_110918telegram_photo.jpg?sv=...",
  "dailyPhotoCaption": "Mukava muisto! 💕"
}
```

---

## 🔐 **TEKNINEN TOTEUTUS:**

### **Backend (CosmosDbService.cs):**

```csharp
public async Task<Photo?> GetDailyPhotoAsync(string clientId, int rotationDays = 1)
{
    var photos = await GetPhotosAsync(clientId);
    
    // Prioritoi Telegram-kuvat, sitten Google Drive
    var blobPhotos = photos.Where(p => !string.IsNullOrEmpty(p.BlobUrl))
        .OrderByDescending(p => p.CreatedAt)
        .ToList();
    var drivePhotos = photos.Where(p => string.IsNullOrEmpty(p.BlobUrl)).ToList();
    var allPhotos = blobPhotos.Concat(drivePhotos).ToList();

    // Laske päiväkohtainen indeksi
    var daysSinceYearStart = DateTime.Now.DayOfYear;
    var rotationPeriod = daysSinceYearStart / rotationDays;
    var photoIndex = rotationPeriod % allPhotos.Count;

    return allPhotos[photoIndex];
}
```

### **API (ReminderApi.cs):**

```csharp
// Hae asiakkaan rotaatio-asetus
var photoRotationDays = client?.Settings?.PhotoRotationDays ?? 1;

// Hae päivän kuva
var photo = await GetDailyPhoto(clientId, photoRotationDays);
```

---

## 💡 **TULEVAISUUDEN PARANNUKSET:**

### **1. Viikon kuvat:**
```json
{
  "photoRotationDays": 7  // Vaihtu viikoittain
}
```

### **2. Custom schedule:**
```json
{
  "photoSchedule": {
    "monday": "photo_family_1.jpg",
    "tuesday": "photo_vacation_2.jpg",
    "friday": "photo_birthday_5.jpg"
  }
}
```

### **3. Teemakuvat:**
```json
{
  "photoThemes": {
    "christmas": ["photo_christmas_1.jpg", "photo_christmas_2.jpg"],
    "summer": ["photo_summer_1.jpg", "photo_summer_2.jpg"]
  }
}
```

---

## 📝 **YHTEENVETO:**

✅ **Päiväkohtainen rotaatio** - Sama kuva koko päivän  
✅ **Asetettava vaihtoväli** - 1 tai 2 päivää  
✅ **Ennakoitava järjestys** - Kuvat kiertävät samassa järjestyksessä  
✅ **Toimii Telegram + Google Drive kuvien kanssa**  
✅ **Asiakaskohtaiset asetukset**

---

**Status:** ✅ Toteutettu  
**Viimeksi päivitetty:** 2025-10-07

