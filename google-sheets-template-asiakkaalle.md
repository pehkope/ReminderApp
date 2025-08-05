# 📋 ReminderApp Google Sheets - Asiakkaan käyttöohje

## 🎯 **YKSI TIEDOSTO, KAIKKI HALLINTA**

Luo Google Sheetsiin tiedosto nimellä: **`ReminderApp_[nimi]`**  
Esimerkki: `ReminderApp_mom`

---

## 📚 **VÄLILEHDET JÄRJESTYKSESSÄ:**

### **1. 🔧 Config (PAKOLLINEN)**
**Perusasetukset ja yhteystiedot**

| A: ClientID | B: Nimi | C: Puhelin | D: TelegramID | ... | J: UsePhotos |
|-------------|---------|------------|---------------|-----|--------------|
| mom | Äiti | +358401234567 | 123456789 | ... | YES |

### **2. 💊 Lääkkeet (SUOSITELTU)**
**Lääkemuistutukset aikajärjestyksessä**

| A: ClientID | B: Aika | C: Lääkkeen nimi | D: Annostus | E: Kellonaika |
|-------------|---------|------------------|-------------|---------------|
| mom | AAMU | Verenpainelääke | 1 tabletti | klo 8:00 |
| mom | PÄIVÄ | Vitamiini D | 1 kapseli | lounaan kanssa |
| mom | YÖ | Unilääke | 0.5 tablettia | klo 21:00 |

### **3. 🍽️ Ruoka-ajat (SUOSITELTU)**
**Ruokamuistutukset ja ehdotukset**

| A: ClientID | B: Aika | C: Ateria | D: Ehdotus | E: Kellonaika |
|-------------|---------|-----------|------------|---------------|
| mom | AAMU | Aamupala | Kaurapuuro marjojen kanssa | klo 8:30 |
| mom | PÄIVÄ | Lounas | Lämmin keitto ja leipää | klo 12:00 |
| mom | ILTA | Päivällinen | Kala ja perunoita | klo 17:00 |

### **4. 📅 Viestit (TÄRKEÄT MENOT)**
**Lääkärikäynnit, tapaamiset, jne.**

| A: Päivämäärä | B: Viesti | C: Prioriteetti | D: Päiviä ennen | E: Päiviä jälkeen | F: Kellonaika |
|---------------|-----------|-----------------|-----------------|-------------------|---------------|
| 2024-01-20 | Lääkäri aika | 1 | 2 | 0 | 14:00 |
| 2024-01-25 | Perhe tulee käymään | 2 | 1 | 0 | 16:00 |

### **5. 🖼️ Kuvat (VALOKUVAROTAATIO)**
**Perhekuvat ja muistot**

| A: Nimi | B: URL | C: Kuvaus | D: Tyyppi | E: Järjestys |
|---------|--------|-----------|-----------|--------------|
| Perhe kesällä | [Google Drive -linkki] | Mukava muisto | Rotation | 1 |
| Joulukuva | [Google Drive -linkki] | Joulu 2023 | Rotation | 2 |

---

## 🚀 **PIKA-ALOITUS:**

### **Vaihe 1: Luo tiedosto**
1. Mene **Google Sheets** → sheets.google.com
2. Klikkaa **"Tyhjä"**
3. Nimeä: `ReminderApp_[nimi]`

### **Vaihe 2: Luo välilehdet**
1. **Oikeaklikkaa** välilehti alhaalla → **"Lisää välilehti"**
2. **Nimeä:** Config, Lääkkeet, Ruoka-ajat, Viestit, Kuvat

### **Vaihe 3: Täytä taulukot**
1. **Kopioi otsikkorivit** ylhäältä
2. **Täytä tiedot** omien tarpeiden mukaan
3. **Tallenna automaattisesti** ✅

---

## 💡 **VINKKEJÄ:**

### **📱 Google Drive -kuvat:**
1. **Lataa kuva** Google Driveen
2. **Jaa** → "Kaikki, joilla on linkki"
3. **Kopioi linkki** → Muuta muotoon:
   `https://drive.google.com/uc?export=view&id=[TIEDOSTO-ID]`

### **📅 Päivämäärät:**
- **Hyvä:** `2024-01-20` tai `20.1.2024`
- **Huono:** `ensi viikko`, `pian`

### **🕐 Kellonajat:**
- **Hyvä:** `klo 14:00`, `14:00`, `aamupalan kanssa`
- **Joustavuus:** `tarvittaessa`, `jos tekee mieli`

---

## 🔄 **MUUTOSTEN TEKEMINEN:**

### **Päivittäinen käyttö:**
1. **Avaa Google Sheets** kännykällä/tietokoneella
2. **Etsi tiedosto** nimellä
3. **Muokkaa suoraan** → Tallentuu automaattisesti
4. **Tablet päivittyy** heti

### **Esimerkkimuutoksia:**
- **Lisää lääke:** Uusi rivi Lääkkeet-välilehdelle
- **Vaihda ruokaehdotus:** Muokkaa Ruoka-ajat → Ehdotus
- **Merkitse tärkeä tapaaminen:** Uusi rivi Viestit-välilehdelle
- **Vaihda kuva:** Muokkaa Kuvat → URL

---

## 👥 **JAETTU KÄYTTÖ:**

### **Jaa perheelle:**
1. **Tiedosto auki** → **Jaa** (oikeassa yläkulmassa)
2. **Lisää sähköpostit** → **Valitse oikeudet**
3. **"Muokkaaja"** → Voivat muuttaa kaikkea
4. **"Katselija"** → Voivat vain katsoa

### **Esimerkki käyttöoikeudet:**
- **Äiti:** Omistaja (kaikki oikeudet)
- **Lapset:** Muokkaaja (voivat päivittää)
- **Hoitaja:** Muokkaaja (päivittää lääkkeet)
- **Sukulaiset:** Katselija (voivat seurata)

---

## 🆘 **ONGELMATILANTEET:**

### **Tabletti ei päivity:**
1. **Tarkista ClientID** → Pitää olla sama kaikissa välilehdissä
2. **Varmista oikeudet** → Pitää olla "Muokkaaja" tai parempi
3. **Odota hetki** → Päivitys voi kestää 1-2 minuuttia

### **Lääkkeet ei näy:**
1. **Tarkista Aika-sarake** → AAMU/PÄIVÄ/ILTA/YÖ
2. **Tarkista ClientID** → Esim. "mom" (pienellä)
3. **Varmista välilehden nimi** → "Lääkkeet" (ei "Laakkeet")

### **Kuvat ei lataudu:**
1. **Tarkista Google Drive -linkki** → Pitää olla oikea muoto
2. **Varmista jakaminen** → "Kaikki, joilla on linkki"
3. **Kokeile toista kuvaa** → Testaa toimiiko

---

## ✅ **VALMIS!**

**➡️ Nyt kaikki ReminderApp:n hallinta tapahtuu yhdestä Google Sheets -tiedostosta!**

**📱 Muokkaa milloin tahansa, mistä tahansa - tablet päivittyy automaattisesti! 🎉**