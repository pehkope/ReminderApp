# 📊 ReminderApp - Keskitetty hallinta Google Sheetsistä

## 🎯 **YKSI TIEDOSTO - KAIKKI HALLINTA**

Kaikki ReminderApp:n asetukset ja sisältö hallitaan **yhdestä Google Sheets -tiedostosta**.

### 📁 **Tiedoston nimi:** `ReminderApp_[asiakasnimi]`
Esimerkki: `ReminderApp_mom` tai `ReminderApp_Virtanen`

---

## 📋 **PAKOLLISET VÄLILEHDET:**

### **1. 🔧 Config**
**Mitä:** Perusasetukset ja yhteystiedot
```
| ClientID | Nimi | Puhelin | TelegramID | ... | UsePhotos |
|----------|------|---------|------------|-----|-----------|
| mom | Äiti | +358401234567 | 123456789 | ... | YES |
```

### **2. 💊 Lääkkeet** 
**Mitä:** Kaikki lääkemuistutukset
```
| ClientID | Aika | Lääkkeen nimi | Annostus | Kellonaika |
|----------|------|---------------|----------|------------|
| mom | AAMU | Verenpainelääke | 1 tabletti | klo 8:00 |
| mom | YÖ | Unilääke | 0.5 tablettia | klo 21:00 |
```

### **3. 📝 Päivittäiset tehtävät**
**Mitä:** RUOKA ja LÄÄKKEET tehtävät (kuittattavat OK-painikkeella)
```
| ClientID | Tyyppi | Aika | Kuvaus |
|----------|--------|------|--------|
| mom | RUOKA | AAMU | Kunnon aamupala lääkkeiden kanssa |
| mom | LÄÄKKEET | AAMU | Verenpainelääke 1 tabletti |
| mom | PUUHAA | AAMU | Aamun lehden lukemista |
```

### **4. 📅 Viestit**
**Mitä:** Tärkeät tapaamiset ja menot
```
| Päivämäärä | Viesti | Prioriteetti | Päiviä ennen | Päiviä jälkeen | Kellonaika |
|------------|--------|--------------|--------------|----------------|------------|
| 2024-01-20 | Lääkäri aika | 1 | 2 | 0 | 14:00 |
```

### **5. 🖼️ Kuvat**
**Mitä:** Rotaatiokuvat ja kontaktikuvat
```
| Nimi | URL | Kuvaus | Tyyppi | Järjestys |
|------|-----|---------|---------|-----------|
| Perhe kesällä | https://drive.google.com/uc?export=view&id=ABC123 | Mukava muisto | Rotation | 1 |
| Petri | https://drive.google.com/uc?export=view&id=DEF456 | Pojan kuva | Contact | - |
```

---

## 📋 **VALINNAISET VÄLILEHDET:**

### **6. 📞 Yhteystiedot**
**Mitä:** Soittoluettelo (integroitu Config-välilehdessä)
```
| Nimi | Puhelin | Kuva URL | Suhde |
|------|---------|----------|--------|
| Petri | +358401111111 | [kuva-URL] | Poika |
| Sisko | +358402222222 | [kuva-URL] | Tytär |
```

---

## 🛠️ **KÄYTTÖOHJE:**

### **📱 Muokkaaminen:**
1. **Avaa Google Sheets** selaimessa
2. **Etsi tiedosto:** `ReminderApp_[asiakasnimi]`
3. **Valitse välilehti** (Lääkkeet, Ruoka-ajat, jne.)
4. **Muokkaa rivejä** suoraan
5. **Tallenna automaattisesti** ✅

### **🔄 Muutokset näkyvät heti:**
- Tablet päivittyy automaattisesti
- Ei tarvitse asentaa mitään
- Ei koodia tai teknisiä toimenpiteitä

### **👥 Jaettu käyttö:**
- **Perhe** voi muokata samaa tiedostoa
- **Hoitajat** voivat saada käyttöoikeudet
- **Lääkäri** voi päivittää lääkkeet

---

## 🎯 **EDUT:**

### **✅ Helppokäyttöisyys:**
- **Tuttu käyttöliittymä** (Excel-tyylinen)
- **Ei tarvitse opetella** uusia järjestelmiä
- **Toimii kännykässä** ja tietokoneessa

### **✅ Turvallisuus:**
- **Google-tili** suojaus
- **Käyttöoikeudet** hallittavissa
- **Varmuuskopiot** automaattisesti

### **✅ Joustavuus:**
- **Lisää rivejä** helposti
- **Muokkaa milloin tahansa**
- **Historia** näkyy muutoslokissa

---

## 🚨 **TÄRKEÄÄ:**

### **📋 Tietojen muoto:**
- **Päivämäärät:** `2024-01-20` tai `20.1.2024`
- **Kellonajat:** `klo 14:00` tai `14:00`
- **ClientID:** Aina sama (esim. `mom`)

### **🔑 Käyttöoikeudet:**
- **Omistaja:** Voi muokata kaikkea
- **Muokkaaja:** Voi muokata sisältöä
- **Katselija:** Voi vain katsoa

### **💾 Varmuuskopiot:**
- Google Sheets tekee **automaattiset varmuuskopiot**
- **Versiohistoria** → Tiedosto → Versiohistoria

---

## 🆘 **Ongelmatilanteessa:**

1. **Tarkista ClientID** (pitää olla sama kaikissa välilehdissä)
2. **Varmista oikeudet** (pitää olla muokkausoikeudet)  
3. **Tarkista muoto** (päivämäärät, kellonajat)
4. **Katso virheloki** Google Apps Script:stä

**➡️ Kaikki hallinta yhdestä paikasta - Google Sheets! 🎉**