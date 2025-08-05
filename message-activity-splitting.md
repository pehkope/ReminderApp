# 📝 Viesti ja Aktiviteetti -erotelma

## 🎯 **Uusi toiminto: Viesti - Aktiviteetti**

Viestit-välilehdessä voit nyt yhdistää **viestin** ja **aktiviteetin** samaan kenttään väliviivalla eroteltuna.

---

## ✨ **Miten toimii:**

### **Viestit-välilehdessä:**
```
| Päivämäärä | Viesti | Prioriteetti | Päiviä ennen | Päiviä jälkeen |
|------------|--------|--------------|--------------|----------------|
| 2024-01-20 | Ihanaa päiväsaikaa - käy kävelyllä | 1 | 2 | 0 |
| 2024-01-25 | Kaunis kevätpäivä - nauti auringosta | 2 | 1 | 0 |
| 2024-02-01 | Lämmin sää - ehkä piknikkiä | 1 | 1 | 0 |
```

### **Tabletissa näkyy:**

#### **📅 Viesti-kentässä:**
- "Ihanaa päiväsaikaa" 
- "Kaunis kevätpäivä"
- "Lämmin sää"

#### **☀️ PUUHAA-kentässä:**
- "käy kävelyllä"
- "nauti auringosta" 
- "ehkä piknikkiä"

---

## 🔧 **Käyttöohjeet:**

### **1. Perusmuoto:**
```
Viesti - Aktiviteetti
```

### **2. Esimerkkejä:**
- `Hieno päivä - käy puistossa`
- `Rauhallinen aamu - lue kirjaa`
- `Energinen fiilis - tee kevyttä jumpaa`
- `Lämmin ilma - istu terassilla`

### **3. Välimerkit:**
Seuraavat väliviivat toimivat:
- `-` (normaali viiva)
- `–` (en-dash)
- `—` (em-dash)

### **4. Ilman aktiviteettia:**
Jos et laita väliviivaa, koko teksti menee viesti-kenttään:
```
Muista ottaa lääkkeet
```
→ Viesti: "Muista ottaa lääkkeet", PUUHAA: käyttää säähän perustuvaa aktiviteettia

---

## 🎨 **Esimerkkikäyttötapauksia:**

### **🌞 Säähän perustuvia:**
```
Aurinkoinen päivä - käy kävelyllä ulkona
Sateinen päivä - lue hyvä kirja sisällä  
Tuulinen sää - katso elokuva kotona
```

### **🎉 Tapahtumiin liittyviä:**
```
Syntymäpäiväjuhla huomenna - valmistele lahjat
Lääkäriaika tänään - muista ottaa reseptit mukaan
Perhekäynti - siisti koti valmiiksi
```

### **🕐 Aikaperusteisia:**
```
Rauhallinen aamu - nauti aamukahvista
Aktiivinen iltapäivä - käy lenkillä
Leppoisa ilta - kuuntele musiikkia
```

---

## 🔄 **Tekninen toiminta:**

### **1. Automaattinen jakaminen:**
Järjestelmä jakaa viestin automaattisesti ensimmäisestä väliviivasta:
- **Ennen väliviivaa** → Viesti-kenttään
- **Väliviivan jälkeen** → PUUHAA-kenttään

### **2. Fallback-logiikka:**
Jos viestissä ei ole aktiviteettia (ei väliviivaa):
1. Käytetään säähän perustuvaa aktiviteettia
2. Fallback: "Mukava hetki yhdessä"

### **3. Prioriteetti:**
1. **Ensisijainen:** Aktiviteetti viestistä (väliviivan jälkeen)
2. **Toissijainen:** Sääperusteinen aktiviteetti
3. **Fallback:** Yleinen aktiviteetti

---

## 💡 **Vinkkejä:**

### **✅ Hyvä:**
- `Kaunis päivä - käy puistossa`
- `Rauhallinen hetki - lue lehteä`
- `Energinen olo - tee pieni jumppa`

### **❌ Vältä:**
- `Käy puistossa - kaunis päivä` (väärä järjestys)
- `Kaunis-päivä-käy-puistossa` (liikaa viivoja)
- Liian pitkiä aktiviteetteja (yli 50 merkkiä)

### **🎯 Optimointi:**
- **Viesti:** Lyhyt tunnelma tai tilanteen kuvaus
- **Aktiviteetti:** Konkreettinen toimintaehdotus
- **Yhteensä:** Maksimissaan 80-100 merkkiä

---

## 🚀 **Käyttöönotto:**

1. **Päivitä Google Apps Script** uudella koodilla
2. **Muokkaa Viestit-välilehteä** lisäämällä väliviivoja viesteihin
3. **Testaa toimivuus** tabletissa
4. **Näe tulokset:** Viesti ja aktiviteetti näkyvät eri kentissä

**Uusi ominaisuus tekee järjestelmästä joustavamman ja käyttäjäystävällisemmän! 🎉**