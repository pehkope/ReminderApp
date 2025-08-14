# ReminderApp – PRD / Roadmap (eluva ylläpito)

Tämä dokumentti kuvaa seuraavat kehitysaskeleet, hyväksymiskriteerit ja ylläpidon käytännöt ReminderAppille (PWA + GAS backend).

## Tausta ja nykytila
- PWA:n UI korjattu: alapalkin z-index, `DailyPhoto` remount (`@key`), SWA-reititys `.styles.css` → ok.
- GAS `ReminderApp.js`: kuvalogiikka muutettu sheet-first: lukee `Kuvat`-välilehden rivit, valitsee URL-omistavan rivin (client/wildcard) ja tukee rotaatiota (daily/weekly/monthly + stabiili random).
- Ensihaku PWA:ssa on kevyt (fast=1); heavy-haku täydentää kuvan heti perään.

## Tavoitteet (lyhyt aikaväli)
- Kuva näkyy luotettavasti ilman manuaalista refreshiä.
- Ensilatauksen viive on käyttäjälle selkeä (placeholder tai “haetaan kuvaa…”), ei tyhjää laatikkoa.
- PWA ja GAS konfiguroitavissa ilman koodimuutoksia (rotaatio, clientID, timeoutit).

## Hyväksymiskriteerit
- PWA:ssa `dailyPhotoUrl` ei jää pysyvästi tyhjäksi, vaan päivittyy heavy-haussa < 10 s.
- GAS: Sheetissä tyhjät `mom`-rivit eivät estä kuvan löytymistä (valitaan viimeisin URL-omistava rivi).
- Rotaation vaihto (daily/weekly/monthly, randomize) vaikuttaa kuvan valintaan seuraavassa haussa.
- Ei 404/SRI-virheitä; SW ei cacheta väärää index.html:ää.

## Backlog (ehdotetut issuet)

P0 – Käyttäjäkokemus ja vakaus
1. Photo placeholder ja “haetaan kuvaa…” -tila
   - Näytä visuaalinen placeholder ja/tai shimmer kun `dailyPhotoUrl` on tyhjä ensihakuun asti.
   - Hyväksyntä: placeholder korvautuu kuvalla kun heavy-haku valmistuu.

2. Konfiguroitava ensihaku: fast=1 vs fast=0
   - Lisää `AppSettings`-lippu `PreferHeavyOnFirstLoad` (default=false).
   - Hyväksyntä: kun true, kuva näkyy heti (pitempi ensihaku sallitaan).

3. GAS sheet-first minimointi (siivous)
   - Poista käyttämättömät Photos/Drive -polut (vain jos varmistettu ettei niitä tarvita).
   - Rajaa rivien läpikäynti esim. viimeisiin 200 riviin suorituskyvyn varmistamiseksi.

P1 – Diagnostiikka ja ylläpito
4. Debug-overlay (kehittäjille)
   - Toggle, joka näyttää `dailyPhotoUrl`, `selectedRowIndex`, rotaatio-infon.
   - Hyväksyntä: ei näy tuotannossa oletuksena.

5. Health-check endpointit (GAS)
   - `/exec?action=ping` (kevyt), `/exec?action=full` (heavy) – helpottaa monitorointia.

6. Telemetria
   - Loggaa kuvahakuun kulunut aika ja osumien määrä (client/wildcard/any), varoitus jos > 2 s.

P2 – Parannukset
7. Kuvan URL-normalisointi
   - Vaihda Drive `thumbnail?id=` → `uc?export=view&id=` automaattisesti (parempi yhteensopivuus).

8. ClientID-vaihto UI:ssa (kehityskäyttö)
   - Pieni valitsin piilotetussa dev-tilassa (säilyttää localStorageen).

## Aikataulu-ehdotus
- Viikko 1: P0-asiat (placeholder, ensihaku-asetus, siivous)
- Viikko 2: P1 (debug-overlay, ping/full, telemetria)
- Viikko 3: P2 (URL-normalisointi, dev clientID)

## Ylläpitokäytännöt
- GAS Web App uudelleenjulkaisu aina “New deployment” (kopioi uusi /exec BaseUrliksi PWA:han).
- PWA-deploy: GitHub Actions, SW cache-key päivitys tarvittaessa.
- “Tyhjennä välimuisti” PWA:ssa pakottaa heavy-haun; käytetään ensiapuna tuotannossa.

## Muistiinpanot
- Rotaation asetukset luetaan `Konfiguraatio/Config`-välilehdeltä (rotationInterval, randomize).
- `Kuvat`: A=clientID (tai *), B..Z=URL (tekstilinkki), C/D=caption.


