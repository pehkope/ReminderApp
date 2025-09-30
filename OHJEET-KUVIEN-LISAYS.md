# 📸 Lisää 26 kuvaa Cosmos DB:hen

## Nopea tapa (3 askelta):

### 1️⃣ Avaa tiedosto `add-photos-to-cosmos.sh` Cursorissa
- Löytyy projektin juuresta
- Tiedosto on nyt auki

### 2️⃣ Kopioi KOKO tiedoston sisältö
- Ctrl+A (valitse kaikki)
- Ctrl+C (kopioi)

### 3️⃣ Avaa Azure Cloud Shell ja liitä
1. Avaa: https://shell.azure.com
2. Valitse: **BASH** (ei PowerShell!)
3. Liitä scripti: **Ctrl+Shift+V** (tai hiiren oikea nappi → Paste)
4. Paina **Enter**
5. Odota ~30 sekuntia

## Mitä tapahtuu:

```
📸 Lisätään 26 mom:n kuvaa Cosmos DB:hen...
✅ 1/26: Äiti, Petri ja Tiitta euroopan kiertueella
✅ 2/26: Joensuun mummi, Petri ja Tiitta
✅ 3/26: Äiti ja Asta Kostamo Kilpisjärvellä
...
✅ 26/26: Äiti, Petri ja Tiitta Jukan-Salpan takapihalla

════════════════════════════════════════
✅ Lisätty: 26 / 26 kuvaa
════════════════════════════════════════
🎉 VALMIS! Kaikki kuvat lisätty!
```

## Testaa tulokset:

### Omalla koneellasi (PowerShell):
```powershell
Invoke-RestMethod -Uri "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom" | Select-Object dailyPhotoUrl, dailyPhotoCaption
```

### Pitäisi palauttaa (tänään päivä 30):
```
dailyPhotoUrl     : https://drive.google.com/thumbnail?id=1uiP0mA3WTJmEdQKu6Aor7ex0TUKhI4yN
dailyPhotoCaption : Pehkoset ja Kostamot Kilpisjärvellä
```

## Jos tulee virheitä:

### "Resource not found"
- Tarkista että Cosmos DB on olemassa: `reminderappdb`
- Tarkista Azure Portalissa: Cosmos DB → ReminderAppDB

### "Unauthorized"
- Cloud Shell käyttää väärää tiliä
- Aja: `az account show`
- Jos väärä, aja: `az account set --subscription "Enel-Virtual-desktop-Infrastructure"`

### Jotkut kuvat epäonnistuivat
- Scripti näyttää mitkä: `❌ X/26: VIRHE - kuvateksti`
- Voit ajaa scriptin uudelleen (ei haittaa vaikka kuvia on jo olemassa)

## Varmista Azure Portalissa:

1. Avaa: https://portal.azure.com
2. Cosmos DB → **reminderappdb** → Data Explorer
3. **Photos** → Items
4. Pitäisi näkyä 26 dokumenttia: `photo_mom_001` ... `photo_mom_026`

---

**Vinkki:** Jos et ole varma mikä päivän kuva pitäisi näkyä:
- Tänään on päivä: **30**
- Kuvia on: **26**
- Indeksi: **30 % 26 = 4**
- Kuva: **photo_mom_004** = "Pehkoset ja Kostamot Kilpisjärvellä"
