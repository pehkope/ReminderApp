# LÄÄKEMUISTUTUKSET - TULEVAISUUDEN KEHITYS

## NYKYINEN TOTEUTUS (v1.0.4)
- ✅ Lääkkeet näkyvät VAIN klo 8:00
- ✅ Kovakoodattu äidin tarpeisiin
- ✅ Kuitattava tehtävä

## TULEVAISUUDEN VAATIMUKSET

### Tuki useille lääkeajoille
Eri asiakkailla voi olla erilaisia lääkeaikatauluja:
- 1x päivässä (nykyinen: äiti klo 8:00)
- 2x päivässä (esim. klo 8:00 ja 20:00)
- 3x päivässä (esim. klo 8:00, 14:00, 20:00)
- 4x päivässä (esim. klo 8:00, 12:00, 16:00, 20:00)
- Jopa useammin (esim. jokainen ateria + nukkumaanmeno)

### Toteutus
Lisätään `Client`-dokumenttiin `medicationSchedule`:

```json
{
  "id": "client-id",
  "medicationSchedule": {
    "times": ["08:00", "12:00", "16:00", "20:00"],
    "description": "Muista lääkkeet",
    "requiresAck": true
  }
}
```

TAI yksityiskohtaisempi versio:

```json
{
  "id": "client-id",
  "medications": [
    {
      "name": "Verenpainelääke",
      "times": ["08:00"],
      "requiresAck": true
    },
    {
      "name": "Vitamiinit",
      "times": ["08:00", "20:00"],
      "requiresAck": false
    }
  ]
}
```

### Koodimuutokset
1. Päivitä `Client`-malli lisäämällä `MedicationSchedule`
2. Muuta `CreateDynamicDailyTasks()` lukemaan Cosmos DB:stä
3. Luo lääketehtävät dynaamisesti ajan mukaan
4. Testaa eri skenaarioilla

### Prioriteetti
- 🟡 Keskitaso (ei kriittinen nyt, mutta tarvitaan myöhemmin)
- Toteutetaan kun uusia asiakkaita tulee

