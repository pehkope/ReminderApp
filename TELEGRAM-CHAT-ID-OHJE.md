# 📱 Telegram Chat ID:n Hakeminen - Ohje Perheenjäsenille

## 🎯 Miksi tarvitsen Chat ID:n?

Chat ID tarvitaan jotta vain **hyväksytyt perheenjäsenet** voivat lähettää kuvia ja viestejä AnneliPBot:n kautta äidille.

---

## 📋 Näin saat Chat ID:si

### Vaihtoehto 1: `/myid` komento (HELPOIN)

1. **Avaa Telegram**
2. **Etsi:** `@AnneliPBot`
3. **Lähetä:** `/myid`
4. **Botti vastaa:**
   ```
   👋 Terve [Nimesi]!
   
   🆔 Sinun Chat ID: 123456789
   
   📸 Voit lähettää kuvia ja viestejä mom:lle
   💬 Viestit tallentuvat ja näkyvät PWA:ssa
   ```

5. **Kopioi Chat ID numero** (esim. `123456789`)
6. **Lähetä se järjestelmän ylläpitäjälle** (Petri)

---

### Vaihtoehto 2: `/start` komento

1. **Avaa Telegram**
2. **Etsi:** `@AnneliPBot`
3. **Lähetä:** `/start`
4. **Botti vastaa samalla tavalla kuin `/myid`**

---

### Vaihtoehto 3: `/id` komento

1. **Avaa Telegram**
2. **Etsi:** `@AnneliPBot`
3. **Lähetä:** `/id`
4. **Botti vastaa Chat ID:lläsi**

---

## 🔐 Mitä tapahtuu sen jälkeen?

1. **Lähetät Chat ID:si ylläpitäjälle**
2. **Ylläpitäjä lisää Chat ID:si "whitelist":iin**
3. **Function App käynnistetään uudelleen**
4. **✅ Voit nyt lähettää kuvia ja viestejä!**

---

## 📸 Kuinka lähettää kuvia ja viestejä?

### Kuvan lähettäminen:
1. **Avaa Telegram @AnneliPBot**
2. **Lähetä KUVA** (voit lisätä kuvatekstin)
3. **Botti vastaa:** `✅ Kuva vastaanotettu!`
4. **Kuva näkyy äitisi PWA:ssa** 🎉

### Viestin lähettäminen:
1. **Avaa Telegram @AnneliPBot**
2. **Lähetä TEKSTIVIESTI** (esim. "Hei äiti, mukavaa päivää!")
3. **Botti vastaa:** `✅ Viesti lähetetty mom:lle!`
4. **Viesti näkyy äitisi PWA:ssa tervehdyksenä** 💬

---

## 💡 Vinkkejä

- **Jos haluat lähettää toiselle asiakkaalle** (ei mom), lisää kuvatekstiin: `#client:asiakasnimi`
- **Esimerkki:** Kuvan kuvateksti: `Kaunis maisema #client:dad`

---

## ❓ Ongelmia?

Jos botti ei vastaa:
1. **Tarkista että kirjoitit komennon oikein:** `/myid` (pienellä)
2. **Varmista että botti on käynnissä** (kysy ylläpitäjältä)
3. **Kokeile uudelleen muutaman minuutin kuluttua**

---

## 📞 Yhteystiedot

**Ylläpitäjä:** Petri Pehkonen  
**Telegram:** @AnneliPBot

