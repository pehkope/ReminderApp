# 📋 "Viestit" välilehti - Tärkeät ilmoitukset

## 🏗️ Sheet-rakenne:

| Sarake | Nimi | Esimerkki | Kuvaus |
|--------|------|-----------|--------|
| A | Päivämäärä | `2024-01-15` | Tapahtuman päivämäärä |
| B | Viesti | `Lääkäri aika kello 14:00` | Näytettävä viesti |
| C | Prioriteetti | `1` | 1=tärkein, 2=keskitärkeä, 3=vähiten tärkeä |
| D | Päiviä ennen | `2` | Montako päivää ennen näytetään (oletus: 2) |
| E | Päiviä jälkeen | `0` | Montako päivää jälkeen näytetään (oletus: 0) |
| F | Huomiot | `Näkyy 2 päivää ennen` | Vapaita muistiinpanoja |

## 📝 Esimerkkejä:

### **Lääkäri käynti huomenna:**
```
Päivämäärä: 2024-01-16
Viesti: Lääkäri aika kello 14:00 - Muista ottaa lääkekortit mukaan
Prioriteetti: 1
Päiviä ennen: 1
Päiviä jälkeen: 0
```
**→ Näkyy:** "⚠️ HUOMENNA: Lääkäri aika kello 14:00..."

### **Perhe tulee käymään:**
```
Päivämäärä: 2024-01-20
Viesti: Perhe tulee käymään kello 16:00
Prioriteetti: 2  
Päiviä ennen: 2
Päiviä jälkeen: 0
```
**→ Näkyy 18.1:** "📅 2 PÄIVÄN PÄÄSTÄ: Perhe tulee käymään..."
**→ Näkyy 19.1:** "⚠️ HUOMENNA: Perhe tulee käymään..."
**→ Näkyy 20.1:** "🔔 TÄNÄÄN: Perhe tulee käymään..."

### **Hiusten leikkaus:**
```
Päivämäärä: 2024-01-25
Viesti: Hiusten leikkaus kello 10:00
Prioriteetti: 3
Päiviä ennen: 3
Päiviä jälkeen: 1
```
**→ Näkyy 22.1-26.1** (3 päivää ennen + tapahtumapäivä + 1 päivä jälkeen)

## ⚙️ Logiikan toiminta:

### **Prioriteetti järjestys:**
Jos samana päivänä useita viestejä:
1. **Prioriteetti 1** (tärkein) näytetään ensin
2. **Prioriteetti 2** (keskitärkeä) 
3. **Prioriteetti 3** (vähiten tärkeä)

### **Automaattinen häviäminen:**
- **Oletus**: Viesti häviää automaattisesti päivän jälkeen
- **Muutos**: Aseta "Päiviä jälkeen" > 0 jos haluat näyttää pidempään

### **Päivämäärä formaatit:**
✅ **Toimivat:**
- `2024-01-15` (suositeltu)
- `15.01.2024`  
- `15/1/2024`

❌ **Ei toimi:**
- `maanantai`
- `ensi viikko`
- `pian`

## 🧪 **Testaus:**

### Google Apps Script Console:
```javascript
// Testaa viestien toimivuutta
function testMessages() {
  const sheet = SpreadsheetApp.openById("YOUR_SHEET_ID");
  debugImportantMessages_(sheet);
}
```

### Odotettu tulos:
```
📊 Found 3 messages in sheet
📅 Today: 18.1.2024

Row 1: "Lääkäri aika kello 14:00"
  📅 Event: 20.1.2024
  ⏱️ Days until: 2
  👁️ Show range: 2 days before to 0 days after
  ✅ Should show: true

🎯 Current active message: "📅 2 PÄIVÄN PÄÄSTÄ: Lääkäri aika kello 14:00"
```

## 👥 **Ohjeet asiakkaalle:**

1. **Avaa Google Sheets** → ReminderApp_asiakasnimi
2. **Luo "Viestit" välilehti** (jos ei ole)
3. **Täytä taulukko**:
   - Päivämäärä (YYYY-MM-DD muodossa)
   - Viesti (selvä ja lyhyt)
   - Prioriteetti (1-3)
4. **Tallenna** → Viesti näkyy tablet:ssa automaattisesti!