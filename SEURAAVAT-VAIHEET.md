# 🗺️ Seuraavat vaiheet - ReminderApp

## ✅ TEHTY (Viikko 1):

### Backend & Data
- ✅ Cosmos DB luotu ja konfiguroitu
- ✅ Mom-client data lisätty (asetukset, lääkkeet)
- ✅ 26 valokuvaa lisätty Google Drive -linkeillä
- ✅ Weather API integroitu (OpenWeatherMap)
- ✅ API tukee: foods (simple), medications, photos, weather

### API Features
- ✅ Yksinkertaiset ruokamuistutukset: "Muista aamupala/lounas/päivällinen/iltapala"
- ✅ Lääkemuistutus aamulla klo 8:00
- ✅ Sääperusteinen aktiviteettisuositus (isCold, isRaining)
- ✅ Päivittäin vaihtuva valokuva (päivän mukaan)
- ✅ Personoitu tervehdys aikariippuvaisesti

---

## 📋 SEURAAVAT PRIORITEETIT

### 1️⃣ TESTAA KUVAT (Heti kun palaat)

**Aja PowerShellissä:**
```powershell
Invoke-RestMethod -Uri "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom" | ConvertTo-Json -Depth 10
```

**Tarkista:**
- `dailyPhotoUrl`: Google Drive -linkki näkyy?
- `dailyPhotoCaption`: Kuvateksti näkyy?
- Tänään (päivä 30) pitäisi olla: "Pehkoset ja Kostamot Kilpisjärvellä"

---

### 2️⃣ VIESTIJÄRJESTELMÄ (Tärkeimmät 4 hetkeä)

Mom näkee tabletin **4 kertaa päivässä:**

#### 🌅 **Klo 8:00 - Aamu**
```
Hyvää huomenta, rakas äiti! ☀️

📋 Aamun tehtävät:
  ☐ Muista aamupala 🍽️
  ☐ Ota lääkkeet 💊
     - Burana 400mg
     - Panadol 500mg

🌡️ Sää tänään:
  5°C, pilvistä
  
💡 Aktiviteetti-idea:
  Kylmää ulkona - nauti kuppi kahvia ikkunan ääressä ☕
  Katso ulos ja ihaile luontoa!

📸 Muisto menneiltä ajoilta:
  [Kuva: Äiti, Petri ja Tiitta]
```

#### 🌞 **Klo 12:00 - Lounas**
```
Hei äiti! 😊

📋 Lounas-aika:
  ☐ Muista lounas 🍽️

🌡️ Sää nyt:
  6°C, aurinkoista
  
💡 Ehdotus:
  Hyvä hetki lyhyelle kävelylle! 🚶‍♀️
  Ota kevyt takki mukaan.

📸 Muisto:
  [Sama kuva koko päivän]
```

#### ☕ **Klo 16:00 - Päivällinen**
```
Iltapäivää, äiti! 🌤️

📋 Päivällinen-aika:
  ☐ Muista päivällinen 🍽️

🌡️ Sää:
  4°C, auringonlasku alkaa

💡 Aktiviteetti:
  Kylmenee illalla - hyvä aika rentoutua sisällä
  Ehkä radiota tai kirjaa? 📻📖

📸 [Kuva]
```

#### 🌙 **Klo 20:00 - Iltapala**
```
Hyvää iltaa, rakas äiti! 🌙

📋 Iltapala-aika:
  ☐ Muista iltapala 🍽️

💤 Hyvää yötä:
  Huomenna uusi päivä alkaa! 
  Nuku hyvin 💙

📸 [Kuva]
```

---

### 3️⃣ VIESTIDATA COSMOS DB:HEN

Luodaan **Messages** containeriin asiakaskohtaiset viestit:

#### Aamutervehdykset (8:00)
```json
{
  "id": "morning_greeting_mom_1",
  "clientId": "mom",
  "type": "message",
  "category": "greeting",
  "timeSlot": "morning",
  "text": "Hyvää huomenta, rakas äiti! ☀️",
  "variants": [
    "Hyvää huomenta! 🌅",
    "Aurinkoista aamua, äiti! ☀️",
    "Hei ja hyvää aamua! 😊"
  ],
  "isActive": true
}
```

#### Aktiviteetti-ideat (sääriippuvainen)
```json
{
  "id": "activity_outdoor_good_1",
  "clientId": "mom",
  "type": "message",
  "category": "activity",
  "weatherCondition": "good",
  "text": "Kaunis päivä! Kävelylenkki piristäisi 🚶‍♀️",
  "variants": [
    "Hieno sää - ulos vaan! 🌞",
    "Täydellinen ilma kävelylle!",
    "Aurinkoa ja lämmintä - nauti ulkona!"
  ]
}
```

```json
{
  "id": "activity_indoor_cold_1",
  "clientId": "mom",
  "type": "message",
  "category": "activity",
  "weatherCondition": "cold",
  "text": "Kylmää ulkona - nauti kuppi kahvia sisällä ☕",
  "variants": [
    "Pakkaspäivä - hyvä päivä lukea kirjaa 📖",
    "Kylmä sää - rentoudu sisällä lämpimän peiton alla 🛋️",
    "Pakkas puree - kuuntele radiota ja nauti lämmöstä 📻"
  ]
}
```

```json
{
  "id": "activity_indoor_rain_1",
  "clientId": "mom",
  "type": "message",
  "category": "activity",
  "weatherCondition": "rainy",
  "text": "Sateinen päivä - hyvä hetki sisäpuuhille ☔",
  "variants": [
    "Sataa - nauti rauhallinen päivä sisällä 🌧️",
    "Sateinen ilma - täydellinen hetki kahville ja hyvää seuraa ☕",
    "Vesisade - ihaile sadetta ikkunasta ja rentoudu 🪟"
  ]
}
```

#### Kannustavat viestit
```json
{
  "id": "encouragement_meal_1",
  "clientId": "mom",
  "type": "message",
  "category": "encouragement",
  "context": "food",
  "text": "Hyvä ruoka antaa voimia päivään! 💪",
  "variants": [
    "Muista syödä hyvin - se on tärkeää! ❤️",
    "Herkullinen ateria tekee hyvää! 😊",
    "Nauti ruoasta rauhassa 🍽️"
  ]
}
```

---

### 4️⃣ PWA-SOVELLUS TABLETILLE

**Prioriteetit järjestyksessä:**

#### A) Perusnäkymä (Viikko 2)
- [ ] Suuri, selkeä kello
- [ ] Päivämäärä ja viikonpäivä
- [ ] Päivän valokuva (iso, näkyvä)
- [ ] Kuvateksti

#### B) Tehtävälista (Viikko 2)
- [ ] Ruoka- ja lääkemuistutukset
- [ ] Checkbox kuittaukseen
- [ ] Iso teksti (min 20px)
- [ ] Selkeät ikonit (🍽️ 💊)

#### C) Sää ja aktiviteetit (Viikko 2-3)
- [ ] Lämpötila ja kuvaus
- [ ] Sääikoni
- [ ] Aktiviteetti-ehdotus säästä riippuen

#### D) Personoidut viestit (Viikko 3)
- [ ] Tervehdys vuorokaudenajan mukaan
- [ ] Kannustava viesti
- [ ] Vaihtelevat tekstit (ei aina sama)

#### E) Ulkoasu
- [ ] **ISOT** fontit (vähintään 18-24px)
- [ ] Korkea kontrasti (musta teksti, valkoinen tausta)
- [ ] Värikoodaus (vihreä = tehty, punainen = tekemättä)
- [ ] Ei turhia nappuloita
- [ ] Full screen -tila tabletille

---

### 5️⃣ LÄÄKKEIDEN HALLINTA

**Nykyinen:**
- Vain aamumuistutus klo 8:00
- 2 lääkettä: Burana 400mg, Panadol 500mg

**Tulevaisuus:**
- [ ] Lisää lääkkeitä Cosmos DB:hen
- [ ] Toistuva aikataulu (joka päivä aamulla)
- [ ] Kuittaus → tallennetaan Completions containeriin
- [ ] Historia: mitkä lääkkeet otettu minäkin päivänä

---

### 6️⃣ TAPAAMISET (Appointments)

**Tulevaisuus:**
- [ ] Lääkärikäynnit
- [ ] Vierailut (Petri tulee käymään)
- [ ] Muistutus 1 päivä ennen
- [ ] Näkyy tabletilla: "Huomenna lääkäriaika klo 10:00"

---

### 7️⃣ TELEGRAM BOT (Myöhemmin)

**Visio:**
- Petri voi lähettää kuvia Telegram-bottiin
- Botti kysyy kuvatekstin
- Kuva tallennetaan automaattisesti Cosmos DB:hen
- Kuva ilmestyy mom:n rotaatioon seuraavana päivänä

**Hyöty:**
- Helppo lisätä uusia kuvia
- Ei tarvitse käyttää Azure Portalia
- Muut omaiset voivat myös lähettää kuvia

---

### 8️⃣ MULTI-TENANT (Myyntivalmius)

**Kun pilotti toimii mom:lle:**
- [ ] Asiakashallinta-UI (uuden clientin lisäys)
- [ ] Client-kohtaiset asetukset (ruoka-ajat, lääkkeet)
- [ ] Hinnoittelu: €XX/kk per asiakas
- [ ] Laskutus
- [ ] Markkinointisivu

---

## 📊 PRIORISOINTI

### 🔥 **HETI (tämä viikko):**
1. ✅ Testaa kuvat API:ssa
2. ⏳ Luo viesti-scriptit Cosmos DB:hen
3. ⏳ Aloita PWA perusnäkymä

### 📅 **VIIKKO 2:**
1. PWA perusnäkymä valmis (kello, kuva, tehtävät)
2. Sää ja aktiviteetit näkyy
3. Mom testaa tabletin ensimmäistä kertaa

### 📅 **VIIKKO 3:**
1. Personoidut viestit vaihtelevat
2. Kuittausten tallennus toimii
3. Lääkelista täydennetty

### 📅 **VIIKKO 4:**
1. Tapaamiset-ominaisuus
2. Telegram Bot prototyyppi
3. Viikon testikäyttö mom:n kanssa

### 🎯 **KUUKAUSI 2:**
1. Hienosäätöä palautteen perusteella
2. Multi-tenant arkkitehtuuri
3. Ensimmäinen maksava asiakas (ei-mom)

---

## 💡 TEKNISIÄ MUISTIINPANOJA

### Viestien toteutus
1. Luo PowerShell-scripti joka lisää viestit Cosmos DB:hen
2. API hakee viestit clientId + timeSlot perusteella
3. Valitsee satunnaisen variantin jos useita
4. PWA näyttää viestin

### PWA-teknologia
- React tai Vue.js (yksinkertainen)
- Service Worker (offline-tuki)
- LocalStorage (kuittausten väliaikainen tallennus)
- Responsive design (tablet-optimoitu)

### Cosmos DB Containers
- ✅ Clients (asiakastiedot, asetukset)
- ✅ Photos (valokuvat)
- ✅ Medications (lääkkeet)
- ⏳ Messages (viestit, tervehdykset, aktiviteetit)
- ⏳ Completions (kuittaukset)
- ⏳ Appointments (tapaamiset)
- ⏳ Foods (yksityiskohtaiset ruokasuositukset - jos joskus tarvetta)

---

## 🎉 MILESTONE: Mom:n ensimmäinen käyttöpäivä

**Tavoite:** Kaksi viikkoa alusta

**Mom herää aamulla:**
1. Tabletti näyttää: "Hyvää huomenta, rakas äiti! ☀️"
2. Suuri kello: 8:05
3. Kaunis valokuva Petrista ja Tiitasta
4. Tehtävät:
   - ☐ Muista aamupala
   - ☐ Ota lääkkeet
5. Sää: 5°C, pilvistä - nauti kahvi sisällä ☕
6. Mom kuittaa tehtävät ✅

**Mom testaa lounasaikaan:**
1. "Hei äiti! 😊"
2. Muista lounas
3. Sama kuva koko päivän
4. Sää: 7°C, aurinkoista - hyvä hetki kävelylle!

**ONNISTUNUT jos:**
- Mom ymmärtää käyttöliittymän ilman ohjeita
- Mom osaa kuitata tehtävät
- Mom hymyilee kuvia katsoessaan ❤️

---

Palaathan kertomaan kun testaat API:n kuvatoiminnallisuuden! 🚀
