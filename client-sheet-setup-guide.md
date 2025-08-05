# 📊 Asiakaskohtaiset Google Sheets - Setup Guide

## 🎯 **Miksi asiakaskohtaiset tiedostot?**

✅ **Pääsynhallinta:** Jokainen asiakas näkee vain omat tiedot  
✅ **Tietosuoja:** Ei riskiä vääriin käsiin joutumisesta  
✅ **Skaalautuvuus:** Helppo lisätä uusia asiakkaita  
✅ **Ylläpito:** Selkeä rakenne

---

## 📝 **Google Sheets nimeämiskäytäntö:**

### **Tiedostonimi:**
```
ReminderApp_[asiakasnimi]_[vuosi]
```

**Esimerkkejä:**
- `ReminderApp_Anneli_2024`
- `ReminderApp_Pertti_2024` 
- `ReminderApp_TestiAsiakas_2024`

---

## 📚 **Vakiorakenne jokaisessa tiedostossa:**

### **1. Config (PAKOLLINEN)**
| A: ClientID | B: Nimi | C: Puhelin | D: TelegramID | ... | J: UsePhotos |
|-------------|---------|------------|---------------|-----|--------------|
| anneli | Anneli | +358401234567 | 123456789 | ... | YES |

### **2. Lääkkeet (UUSI RAKENNE)**
| A: ClientID | B: Aika | C: Kellonaika | D: Lääke |
|-------------|---------|---------------|----------|
| anneli | AAMU | klo 8:00 | Aamulääke |
| anneli | ILTA | klo 18:00 | Iltalääke |

### **3. Ruoka-ajat**
| A: ClientID | B: Aika | C: Ateria | D: Ehdotus | E: Kellonaika |
|-------------|---------|-----------|------------|---------------|
| anneli | AAMU | Aamupala | Kaurapuuro marjojen kanssa | klo 8:30 |

### **4. Viestit**
| A: Päivämäärä | B: Viesti | C: Prioriteetti | D: Päiviä ennen | E: Päiviä jälkeen |
|---------------|-----------|-----------------|-----------------|-------------------|
| 2024-01-20 | Lääkäri aika | 1 | 2 | 0 |

### **5. Kuvat**
| A: ClientID | B: URL | C: Kuvaus | D: Tyyppi | E: Järjestys |
|-------------|--------|-----------|-----------|--------------|
| anneli | [Google Drive linkki] | Perhekuva | Rotation | 1 |

### **6. Kuittaukset (AUTOMAATTINEN)**
*Järjestelmä luo automaattisesti*

---

## 🔗 **Google Apps Script konfiguraatio:**

### **Script Properties per asiakas:**
```
SHEET_ID_anneli = "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
SHEET_ID_pertti = "1CxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
```

### **Dynaaminen SHEET_ID haku:**
```javascript
function getClientSheetId_(clientID) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const sheetIdKey = `SHEET_ID_${clientID.toLowerCase()}`;
  return scriptProperties.getProperty(sheetIdKey);
}
```

---

## 👥 **Käyttöoikeuksien hallinta:**

### **Per asiakas -tiedosto:**
1. **Omistaja:** ReminderApp admin
2. **Muokkaaja:** Asiakkaan perhe/hoitajat  
3. **Katselija:** Tarvittaessa muut sukulaiset

### **Jaettu käyttö:**
- **Asiakas itse:** Omistaja-oikeudet
- **Puoliso:** Muokkaaja-oikeudet
- **Lapset:** Muokkaaja tai katselija
- **Hoitajat:** Muokkaaja (vain lääkkeet/ruoka)

---

## 🚀 **Migration Plan:**

### **Vaihe 1: Testaa uusi rakenne**
1. Luo `ReminderApp_TestiAsiakas_2024`
2. Käytä uutta lääkerakennetta (4 saraketta)
3. Testaa että API toimii

### **Vaihe 2: Luo asiakaskohtaiset tiedostot**
1. Kopioi Config-data vanhoista tiedostoista
2. Luo uudet tiedostot per asiakas
3. Jaa käyttöoikeudet perheille

### **Vaihe 3: Päivitä Script Properties**
1. Lisää `SHEET_ID_[asiakasnimi]` property per asiakas
2. Päivitä API käyttämään dynaamista sheet ID hakua

---

## 🔒 **Tietosuoja & Compliance:**

### **Lääkedirektiivin mukaisuus:**
- ✅ **Ei tarkkoja lääkenimiä:** Vain "Aamulääke", "Iltalääke"
- ✅ **Ei annoksia:** Ei mainita määriä
- ✅ **Yleisiä muistutuksia:** "Muista ottaa lääke"

### **GDPR mukaisuus:**
- ✅ **Asiakaskohtainen data:** Ei sekoittumista
- ✅ **Rajattu pääsy:** Vain valtuutetut näkevät
- ✅ **Poisto-oikeus:** Helppo poistaa asiakkaan data

---

## 📋 **TODO: Seuraavat askeleet**

1. [ ] Päivitä Google Apps Script tukemaan dynaamisia Sheet ID:tä
2. [ ] Luo template uusille asiakkaille  
3. [ ] Testaa uusi lääkerakenne
4. [ ] Dokumentoi käyttöoikeudet per asiakas
5. [ ] Luo migration-skripti vanhoista tiedostoista