# AneeliBot / ReminderApp - Tuotemäärittely ja Roadmap

Tämä dokumentti määrittelee ReminderApp-sovelluksen toiminnallisuudet, käyttöliittymän ja teknisen toteutuksen. Tavoitteena on luoda helppokäyttöinen ja visuaalisesti selkeä PWA-sovellus (Progressive Web App) tabletille, joka auttaa muistamaan päivän tehtäviä ja aikatauluja.

## 1. Yleiskuva ja Tavoitteet

Sovellus näyttää käyttäjälle personoituja muistutuksia, päivän ohjelman, yhteystietoja ja muita tärkeitä tietoja. Taustajärjestelmänä toimii Google Apps Script, joka hakee tiedot Google Sheetsistä ja Google Calendarista.

### Päivän Vaiheet

Käyttöliittymä muuttuu dynaamisesti päivän aikana ja on jaettu seuraaviin päänäkymiin:
1.  **Aloitusnäkymä (Aamulla ennen ensimmäistä viestiä)**
2.  **Aamu (n. 08:00 - 11:00)**
3.  **Päivä (n. 11:00 - 16:00)**
4.  **Ilta (n. 16:00 - 21:00)**
5.  **Yö (n. 21:00 alkaen)**

---

## 2. Käyttöliittymänäkymät (UI)

### 2.1. Yhteiset Elementit

*   **Yläpalkki:** Näyttää aina viikonpäivän, päivämäärän ja dynaamisesti päivittyvän kellonajan. Yläpalkissa lukee myös missä päivän vaiheessa mennään (Aamu, Päivä, Ilta, Yö).
*   **Alapalkki:** Sisältää 2-3 toimintopainiketta, jotka voivat vaihdella näkymän mukaan. Esim. "Soita", "Katso koko ohjelma", "Aloita jumppa".
*   **Taustakuva:** Henkilökohtainen kuva näkyy useimmissa näkymissä.

### 2.2. Page 1: Aloitusnäkymä

Tämä näkymä on aktiivinen aikaisin aamulla ennen ensimmäistä varsinaista muistutusta.

*   **Otsikko:** "Rakas äiti, huomenta! Tässä on kuvamuisto päivääsi".
*   **Kuva:** Suuri päivän kuvamuisto.
*   **Sää:** Sääikoni, lämpötila ja sanallinen kuvaus (esim. "Tänään on aurinkoinen sää, +8°C").
*   **Toiminto:** Iso "Aloita päivä" -painike (esim. play-symbolilla), joka siirtää käyttäjän Aamu-näkymään.

### 2.3. Page 2: Aamu-näkymä

Aktivoituu joko "Aloita päivä" -painikkeesta tai automaattisesti klo 08:30.

*   **Ilmoitus:**
    *   Heiluva kellokuvake ja äänihälytys uuden viestin saapuessa. Heiluminen kestää 15 min tai kunnes näyttöä kosketetaan.
    *   Viestikupla, jossa personoitu aamuviesti (esim. "Aamun tuoksu tervehtii sinua...").
*   **Seuraavaksi-lista:**
    *   **RUOKA:** Kuitattava tehtävä. Esim. "Kunnon aamupala lääkkeiden kanssa". Vieressä "OK"-painike.
    *   **LÄÄKKEET:** Kuitattava tehtävä. Esim. "Kumpaakin 1 kpl". Vieressä "OK"-painike.
    *   **PUUHAA:** Ei-kuitattava tehtävä. Esim. "Aamun lehden lukemista".
*   **Tänään Tärkeää:**
    *   Näkyy alareunassa korostettuna palkkina, jos päivälle on merkitty tärkeä meno. Esim. "Hammashoidon tarkastus klo 13.20 Lauttasaaren terveysasemalla".

### 2.4. Page 3: Päivä-näkymä

Aktivoituu automaattisesti n. klo 10:30. Rakenne on samankaltainen kuin Aamu-näkymässä.

*   **Ilmoitus:** Uusi päiväviesti.
*   **Seuraavaksi-lista:** Päivän tehtävät, esim. lounas (kuitattava), ulkoilu (puuhaa).
*   **Tärkeää:** Näyttää edelleen päivän tärkeän menon.

### 2.5. Page 4: Ilta-näkymä

Aktivoituu automaattisesti n. klo 16:00.

*   **Ilmoitus:** Uusi iltaviesti.
*   **Seuraavaksi-lista:**
    *   **RUOKA:** Kuitattava (päivällinen).
    *   **LÄÄKKEET:** Kuitattava.
    *   **PUUHAA:** Esim. "Aivojumppa yhdessä".

### 2.6. Page 5: Yö-näkymä

Aktivoituu automaattisesti n. klo 21:00.

*   **Ilmoitus:** Hyvän yön toivotus.
*   **Seuraavaksi-lista:**
    *   **RUOKA:** Kuitattava (iltapala).
    *   **LÄÄKKEET:** Kuitattava.
*   **Tärkeää:** Voi näyttää muistutuksen seuraavan päivän tärkeästä menosta.

---

## 3. Toiminnallisuudet

### 3.1. Kuittaukset (OK-painike)

*   Vain tietyt tehtävät (ruoka, lääkkeet) ovat kuitattavia.
*   Kun tehtävä kuitataan painamalla "OK":
    *   Taustajärjestelmään lähetetään POST-pyyntö, joka merkitsee tehtävän tehdyksi.
    *   Käyttöliittymässä "OK"-painike ja tehtävän taustapalkki katoavat.
    *   Tehtävän teksti jää näkyviin (esim. harmaana tai yliviivattuna).
*   Jos kuittausta ei tehdä tietyn ajan kuluessa, järjestelmä voi lähettää uuden muistutuksen.

### 3.2. Navigaatio ja Eleet

*   **Oikealle pyyhkäisy:** Selaa muita näkymiä (esim. koko viikon ohjelma, yhteystiedot). Palaa automaattisesti päänäkymään 1 minuutin kuluttua, jos näyttöä ei kosketa.
*   **Vasemmalle pyyhkäisy:** Siirtää aloitusnäkymään (Page 1). Palaa automaattisesti takaisin 1 minuutin kuluttua.
*   **Kuvan painallus:** Kuvan painaminen yli 2 sekuntia suurentaa sen koko näytölle. Mahdollinen kuvateksti näytetään samalla. Kuva pienenee automaattisesti 1 minuutin kuluttua tai uudella painalluksella.

### 3.3. Notifikaatiot

*   Uuden viestin saapuessa kuuluu äänimerkki.
*   Ilmoituskuvake (kello) heiluu 15 minuuttia tai kunnes näyttöä kosketetaan.

---

## 4. Datan Hallinta (Backend)

Kaikki data ylläpidetään Google Sheets -dokumentissa, jotta sen muokkaaminen on mahdollisimman helppoa.

*   **Google Sheet -välilehdet:**
    1.  `Asetukset`: Yleiset asetukset, käyttäjien tiedot.
    2.  `PaivanTehtavat`: Päivittäiset, toistuvat tehtävät (aamupala, lääkkeet jne.) ja tieto siitä, vaativatko ne kuittauksen.
    3.  `Virikkeet (Puuhaa)`: Lista erilaisista virike-ehdotuksista, jotka voidaan luokitella esim. sään mukaan (sisä/ulko/sosiaalinen).
    4.  `TarkeatTapahtumat`: Kertaluontoiset tärkeät menot (pvm, klo, kuvaus). Voidaan harkita myös Google Calendar -integraatiota.
    5.  `Viestit`: Valmiita viestipohjia eri vuorokaudenajoille.
    6.  `Yhteystiedot`: Henkilöt, joille voi soittaa.
    7.  `Kuvat`: Linkit kuviin, jotka näytetään sovelluksessa (esim. Google Drive -kansio).

*   **Google Apps Script (`ReminderApp_Test.js`):**
    *   `doGet(e)`: Tarjoilee JSON-muotoista dataa Blazor-sovellukselle. Parametrina `user` ja `client`.
    *   `doPost(e)`: Vastaanottaa kuittaukset Blazor-sovelluksesta ja merkitsee ne Google Sheetiin.
    *   Hakee säätiedot ulkoisesta API:sta.
    *   Lähettää SMS/Telegram-viestejä tarvittaessa.

---

## 5. Avoimet Kysymykset

*   **Viestin kuittaus:** Pitääkö itse viesti (esim. aamutervehdys) kuitata, vai riittääkö tehtävien kuittaus? (Nykyinen oletus: vain tehtävät kuitataan).
*   **Viestin pysyvyys:** Pysyykö viesti ruudussa, kunnes seuraava viesti tulee? (Nykyinen oletus: kyllä, päänäkymä näyttää aina viimeisimmän tilanteen).

---
## 6. Roadmap

1.  **Vaihe 1: Perustoiminnallisuus (MVP)**
    *   [x] Blazor-projektin pystytys ja perusrakenne.
    *   [x] `doGet`-datayhteys Google Apps Scriptiin.
    *   [ ] **Seuraavaksi:** Varmistetaan, että datan haku onnistuu ja näytetään se staattisesti Aamu-näkymässä.
    *   [ ] Toteutetaan "OK"-painikkeen `doPost`-toiminnallisuus.
    *   [ ] Toteutetaan dynaaminen kellonaika.

2.  **Vaihe 2: Dynaaminen UI ja Navigaatio**
    *   [ ] Toteutetaan siirtymät päivän eri näkymien (Aamu, Päivä, Ilta, Yö) välillä kellonajan mukaan.
    *   [ ] Toteutetaan pyyhkäisyeleet.
    *   [ ] Toteutetaan "Aloita päivä" -näkymä.

3.  **Vaihe 3: Viimeistely ja Lisäominaisuudet**
    *   [ ] Toteutetaan äänihälytykset ja ikonien animaatiot.
    *   [ ] Toteutetaan kuvan suurentaminen.
    *   [ ] Säädatan integrointi ja siihen perustuvat suositukset.
    *   [ ] Testaus ja PWA-paketointi. 