# Muistuttaja-sovelluksen viestintästrategia 📱

## Tavoite
- Varmistaa että äiti saa tärkeät muistuttajat oikeaan aikaan
- Portaittainen siirtyminen SMS:stä Telegram-sovellukseen
- Älykkäät kanavavalinnat ajankohdan mukaan

## Kanavavaihtoehdot

### 📱 SMS (Twilio)
- **Edut:** Toimii varmasti, äidillä aina näkyvillä
- **Haitat:** Ei kuvia, lyhyet viestit, maksaa
- **Käyttö:** Backup, aamut, iltapäivät

### 📞 Puhelut (Twilio Voice)
- **Edut:** Varmin tapa saada huomiota
- **Haitat:** Voi häiritä, kallis
- **Käyttö:** Vain ilta (klo 21), tärkeät muistuttajat

### 💬 Telegram
- **Edut:** Ilmainen, kuvat, pitkät viestit, helppokäyttöinen
- **Haitat:** Vaatii Internetin, uusi sovellus äidille
- **Käyttö:** Päivä- ja iltapäivämuistuttajat

## Aikataulustrategia

### 🌅 **08:00 - Aammuistuttaja**
- **Kanava:** SMS
- **Perustelu:** Rauhallinen herätys, ei liikaa teknologiaa aamulla
- **Sisältö:** Päivän aloitusmuistuttaja, sää

### 🌞 **12:00 - Päivämuistuttaja** 
- **Kanava:** Telegram (jos saatavilla) → SMS (jos ei)
- **Perustelu:** Päivän päämuistuttaja, kuva tekee viestin miellyttäväksi
- **Sisältö:** Aktiviteetti, kuva, sää

### 🌇 **16:00 - Iltapäivämuistuttaja**
- **Kanava:** Telegram + SMS (molemmat)
- **Perustelu:** Tärkeä aika, varmistetaan että viesti menee perille
- **Sisältö:** Iltapäiväaktiviteetti, sää

### 🌙 **21:00 - Ilta-/yömuistuttaja**
- **Kanava:** Puhelu + Telegram (jos saatavilla)
- **Perustelu:** Vahvin muistuttaja, yön rutiiniehdotukset
- **Sisältö:** Rauhoittuminen, uni, huomisen valmistelu

## Config-taulukon asetukset
- **Sarake I (UseTelegram):** "YES/NO" - Telegram käyttö päälle/pois
- **Sarake J (UsePhotos):** "YES/NO" - Kuvat mukaan viesteihin

## Siirtymävaiheet

### **Vaihe 1: Vain SMS/Voice (nykyinen)**
```
Config: UseTelegram=NO, UsePhotos=NO
08:00 → SMS (teksti)
12:00 → SMS (teksti)
16:00 → SMS (teksti)
21:00 → Puhelu
```

### **Vaihe 2: Telegram käyttöön, ei kuvia**
```
Config: UseTelegram=YES, UsePhotos=NO
08:00 → SMS (teksti)
12:00 → Telegram (teksti)
16:00 → SMS + Telegram (molemmat tekstiä)
21:00 → Puhelu + Telegram (teksti)
```

### **Vaihe 3: Kuvat mukaan (kun kerätty)**
```
Config: UseTelegram=YES, UsePhotos=YES
08:00 → SMS (teksti)
12:00 → Telegram (kuva + teksti)
16:00 → SMS (teksti) + Telegram (kuva + teksti)
21:00 → Puhelu + Telegram (kuva + teksti)
```

## Kuvien keräyssuunnitelma
📸 **Tarvittavat kuvat äidille:**
- Äidin ja isän yhteiskuvia
- Vanhemmat (äidin ja isän vanhemmat)
- Lapset (sinä ja siskosi)
- Lastenlapset (jos on)
- Lähisukulaiset
- Mukavia muistoja ja hetkiä

💡 **Vinkkejä:**
- Selkeät, iloiset kuvat
- Tunnistettavat henkilöt
- Hyvä kuvanlaatu
- Nostalgisia/lämminhenkisiä

## Toteutuksen edut
- ✅ Joustava siirtymä
- ✅ Varmistavat kanavat tärkeissä ajoissa  
- ✅ Säästää kustannuksia
- ✅ Mukautuu äidin oppimiseen 