# 📸 Kuvan kiertoasetukset Google Sheets:ssä

## 🔧 Config-välilehti sarakkeet:

| Sarake | Nimi | Arvot | Kuvaus |
|--------|------|-------|--------|
| A | ClientID | `mom`, `dad` | Asiakkaan tunnus |
| B-F | ... | (muut asetukset) | |
| G | PhotoRotation | `daily`, `weekly`, `monthly`, `hourly`, `random_daily` | Kuinka usein kuva vaihtuu |
| H | RandomizePhotos | `true`, `false` | Satunnainen järjestys vai peräkkäin |

## 📋 Esimerkki Config-sheet:

```
ClientID | ... | PhotoRotation | RandomizePhotos
---------|-----|---------------|----------------
mom      | ... | weekly        | false
dad      | ... | daily         | true
grandma  | ... | monthly       | false
```

## ⚙️ Kiertoasetukset:

### 📅 **daily** (oletus)
- Kuva vaihtuu **joka päivä** keskiyöllä
- Sama kuva koko päivän ajan
- Kuvat kiertävät **järjestyksessä** 1→2→3→1...

### 📆 **weekly** 
- Kuva vaihtuu **maanantaisin**
- Sama kuva koko viikon ajan
- Hyvä jos kuvia on vähän (esim. 4-5 kuvaa)

### 📊 **monthly**
- Kuva vaihtuu **kuukauden alussa**
- Sama kuva koko kuukauden ajan
- Sopii jos kuvia on vain muutama

### ⏰ **hourly**
- Kuva vaihtuu **joka tunti**
- Nopea kierto, paljon vaihtelua
- Hyvä jos kuvia on paljon (10+ kuvaa)

### 🎲 **random_daily**
- **Satunnainen kuva** joka päivä
- Sama kuva koko päivän ajan
- Ei kierrä järjestyksessä

## 🔀 RandomizePhotos asetus:

### `false` (järjestyksessä)
```
Päivä 1: kuva1.jpg
Päivä 2: kuva2.jpg  
Päivä 3: kuva3.jpg
Päivä 4: kuva1.jpg (alkaa alusta)
```

### `true` (satunnaisessa järjestyksessä)
```
Päivä 1: kuva3.jpg
Päivä 2: kuva1.jpg
Päivä 3: kuva2.jpg
Päivä 4: kuva1.jpg (voi toistua)
```

## 🧪 Testaus:

### Debug-funktio Google Apps Script:ssä:
```javascript
// Testaa asiakkaan kuva-asetuksia
function debugPhotoRotation() {
  const sheet = SpreadsheetApp.openById("YOUR_SHEET_ID");
  const debugInfo = getPhotoRotationDebugInfo_("mom", sheet);
  console.log(debugInfo);
}
```

### Tulokset:
```json
{
  "clientID": "mom",
  "totalPhotos": 5,
  "currentIndex": 2,
  "currentPhoto": "family_dinner.jpg",
  "rotationInterval": "weekly", 
  "randomize": false,
  "nextChangeTime": "2024-01-08T00:00:00.000Z",
  "debugTime": "2024-01-03T15:30:00.000Z"
}
```

## 🎯 Asiakkaan ohje:

1. **Avaa Google Sheets** → ReminderApp_asiakasnimi
2. **Config-välilehti** 
3. **Muokkaa PhotoRotation** saraketta:
   - `daily` = päivittäin
   - `weekly` = viikoittain  
   - `monthly` = kuukausittain
4. **Tallenna** (automaattisesti)
5. **Sovellus päivittyy** seuraavassa API-kutsussa