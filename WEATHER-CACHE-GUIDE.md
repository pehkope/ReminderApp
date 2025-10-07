# 🌤️ Sääpalvelun Cache-järjestelmä

ReminderApp käyttää **tehokasta cache-järjestelmää** säätietojen hallintaan. Sää päivitetään automaattisesti 6 kertaa päivässä ja tallennetaan Cosmos DB:hen.

---

## 🎯 **TAVOITE:**

- ✅ Vähemmän API-kutsuja OpenWeatherMap:iin
- ✅ Nopeampi vastausaika PWA:lle (cache)
- ✅ Automaattinen päivitys taustalla (Timer Function)
- ✅ 4-6 sääpäivitystä päivässä (riittävän tuore tieto)

---

## 📊 **ARKKITEHTUURI:**

```
┌──────────────────────────────────────────────────────────┐
│  PWA (Frontend)                                          │
│  - GET /ReminderAPI?clientID=mom                         │
│  - Saa sään NOPEASTI cachesta                           │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│  ReminderAPI (Azure Function)                            │
│  ┌────────────────────────────────────────────────────┐ │
│  │ WeatherService.GetWeatherAsync()                   │ │
│  │ 1. Tarkista cache (CosmosDB)                       │ │
│  │ 2. Jos cache vanhentunut → Hae OpenWeatherMap     │ │
│  │ 3. Tallenna cache (4h TTL)                        │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│  WeatherUpdateTimer (Timer Function)                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Ajastus: Joka 4. tunti (00, 04, 08, 12, 16, 20)  │ │
│  │ - Hakee sään OpenWeatherMap API:sta               │ │
│  │ - Tallentaa Cosmos DB:hen (cache)                 │ │
│  │ - Toimii taustalla automaattisesti                │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│  Cosmos DB                                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ WeatherCache Container                             │ │
│  │ - Partition Key: location                          │ │
│  │ - TTL: 4 tuntia                                    │ │
│  │ - Paikkakunta: Helsinki, Tampere, Turku, etc.     │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│  OpenWeatherMap API                                      │
│  - Maksimi API-kutsut: ~180/vrk (6 päivitystä * 30 pvm) │
│  - Ilmainen tier: 1000 kutsua/vrk ✅                    │
└──────────────────────────────────────────────────────────┘
```

---

## 📋 **TIETOMALLIT:**

### **WeatherCache (Cosmos DB):**

```csharp
public class WeatherCache
{
    public string Id { get; set; }              // "weather_Helsinki_FI"
    public string Location { get; set; }        // "Helsinki,FI"
    public double Temperature { get; set; }     // 12.5
    public double FeelsLike { get; set; }       // 10.2
    public string Description { get; set; }     // "selkeää"
    public string Icon { get; set; }            // "01d"
    public int Humidity { get; set; }           // 75
    public double WindSpeed { get; set; }       // 3.5
    public bool IsRaining { get; set; }         // false
    public bool IsCold { get; set; }            // false
    public string Recommendation { get; set; }  // "Hyvä sää ulkoiluun..."
    public DateTime FetchedAt { get; set; }     // 2025-10-07T12:00:00Z
    public DateTime ExpiresAt { get; set; }     // 2025-10-07T16:00:00Z
    public string Source { get; set; }          // "OpenWeatherMap"
}
```

### **Esimerkki JSON:**

```json
{
  "id": "weather_Helsinki_FI",
  "location": "Helsinki,FI",
  "temperature": 12.5,
  "feelsLike": 10.2,
  "description": "selkeää",
  "icon": "01d",
  "humidity": 75,
  "windSpeed": 3.5,
  "isRaining": false,
  "isCold": false,
  "recommendation": "Hyvä sää ulkoiluun! Ota takki mukaan.",
  "fetchedAt": "2025-10-07T12:00:00Z",
  "expiresAt": "2025-10-07T16:00:00Z",
  "source": "OpenWeatherMap"
}
```

---

## ⚙️ **TIMER FUNCTION:**

### **Ajastus:**

```csharp
[TimerTrigger("0 */4 * * *")]
```

**CRON-selitys:**
```
0 */4 * * *
│  │  │ │ │
│  │  │ │ └── Viikonpäivä (kaikki)
│  │  │ └──── Kuukausi (kaikki)
│  │  └────── Päivä (kaikki)
│  └────────── Tunti (joka 4. tunti)
└─────────────Minuutti (0)

= Ajastettu 6 kertaa päivässä:
  00:00 UTC (02:00 FI talvi / 03:00 FI kesä)
  04:00 UTC (06:00 FI talvi / 07:00 FI kesä)
  08:00 UTC (10:00 FI talvi / 11:00 FI kesä)
  12:00 UTC (14:00 FI talvi / 15:00 FI kesä)
  16:00 UTC (18:00 FI talvi / 19:00 FI kesä)
  20:00 UTC (22:00 FI talvi / 23:00 FI kesä)
```

### **Toiminta:**

1. Timer käynnistyy automaattisesti joka 4. tunti
2. Hakee sään OpenWeatherMap:sta listalle paikkakunnista:
   - Helsinki
   - Tampere
   - Turku
   - Oulu
   - Espoo
3. Tallentaa jokaisen sään Cosmos DB:hen
4. Logittaa tulokset Application Insights:iin

---

## 🔄 **CACHE FLOW:**

### **Scenario 1: Cache HIT (nopea)**

```
1. PWA → GET /ReminderAPI?clientID=mom
2. ReminderAPI → WeatherService.GetWeatherAsync("Helsinki,FI")
3. WeatherService → CosmosDbService.GetWeatherCacheAsync("Helsinki,FI")
4. ✅ Cache löytyi (ei vanhentunut)
5. ← Palautetaan cache data (nopea!)
6. PWA näyttää sään HETI (0.2-0.5s)
```

### **Scenario 2: Cache MISS (hidas)**

```
1. PWA → GET /ReminderAPI?clientID=mom
2. ReminderAPI → WeatherService.GetWeatherAsync("Helsinki,FI")
3. WeatherService → CosmosDbService.GetWeatherCacheAsync("Helsinki,FI")
4. ❌ Cache ei löytynyt TAI vanhentunut
5. WeatherService → OpenWeatherMap API
6. ← Haetaan tuore sää (hidas: 1-3s)
7. WeatherService → Tallenna cache
8. ← Palautetaan tuore data
9. PWA näyttää sään (1-3s)
```

### **Scenario 3: Timer päivitys (taustalla)**

```
1. Timer käynnistyy (esim. 12:00 UTC)
2. WeatherUpdateTimer → WeatherService.FetchWeatherFromApiAsync("Helsinki,FI")
3. WeatherService → OpenWeatherMap API
4. ← Haetaan tuore sää
5. WeatherService → CosmosDbService.SaveWeatherCacheAsync()
6. Tallennetaan cache (ExpiresAt = 16:00 UTC)
7. ✅ Seuraavat PWA-kutsut ovat nopeita (cache hit)
```

---

## 📈 **HYÖDYT:**

### **Ennen (ilman cachea):**
- ❌ Joka API-kutsu → OpenWeatherMap (1-3s viive)
- ❌ ~100-500 API-kutsua/vrk (riippuen käyttäjämäärästä)
- ❌ Riski ylittää ilmainen tier (1000/vrk)
- ❌ Hidas käyttäjäkokemus

### **Jälkeen (cache):**
- ✅ 99% API-kutsuista → Cache (0.2-0.5s viive)
- ✅ ~180 API-kutsua/vrk (6 * 30 paikkakuntaa)
- ✅ Hyvin ilmaisen tierin sisällä
- ✅ Nopea käyttäjäkokemus

---

## 🛠️ **KONFIGURAATIO:**

### **1. Luo WeatherCache-container Cosmos DB:hen:**

```bash
az cosmosdb sql container create \
  --account-name reminderapp-cosmos2025 \
  --resource-group ReminderApp-RG \
  --database-name ReminderAppDB \
  --name WeatherCache \
  --partition-key-path "/location"
```

### **2. Lisää WEATHER_API_KEY App Settings:iin:**

```bash
az functionapp config appsettings set \
  --name reminderapp-functions-hrhddjfeb0bpa0ee \
  --resource-group ReminderApp-RG \
  --settings WEATHER_API_KEY=<your-openweathermap-key>
```

### **3. Deploy Functions (sisältää Timer):**

GitHub Actions deployaa automaattisesti kun pushataan `main`-branchiin.

---

## 🧪 **TESTAUS:**

### **1. Testaa cache manuaalisesti:**

```powershell
# Hae sää (ensimmäinen kutsu = cache miss)
Invoke-RestMethod -Uri "https://reminderapp-functions-hrhddjfeb0bpa0ee.westeurope-01.azurewebsites.net/ReminderAPI?clientID=mom" | 
  Select-Object -ExpandProperty weather

# Hae uudelleen (toinen kutsu = cache hit, nopea!)
Invoke-RestMethod -Uri "https://reminderapp-functions-hrhddjfeb0bpa0ee.westeurope-01.azurewebsites.net/ReminderAPI?clientID=mom" | 
  Select-Object -ExpandProperty weather
```

### **2. Tarkista cache Cosmos DB:stä:**

Azure Portal → Cosmos DB → Data Explorer → WeatherCache → Items

### **3. Tarkista Timer lokit:**

Azure Portal → Function App → Functions → WeatherUpdateTimer → Monitor

---

## ⏰ **PÄIVITYSTAHTI-VAIHTOEHDOT:**

### **Vaihtoehto 1: Joka 4. tunti (6x/päivä) - NYKYINEN ✅**
```csharp
[TimerTrigger("0 */4 * * *")]
```
- ✅ Hyvä balanssi tuoreuden ja API-kutsujen välillä
- ✅ ~180 API-kutsua/vrk

### **Vaihtoehto 2: Joka 3. tunti (8x/päivä) - Tuoreempi**
```csharp
[TimerTrigger("0 */3 * * *")]
```
- ✅ Tuoreempi data
- ⚠️ ~240 API-kutsua/vrk

### **Vaihtoehto 3: Joka 2. tunti (12x/päivä) - Tuorein**
```csharp
[TimerTrigger("0 */2 * * *")]
```
- ✅ Erittäin tuore data
- ⚠️ ~360 API-kutsua/vrk

### **Vaihtoehto 4: Joka tunti (24x/päivä) - Overkill**
```csharp
[TimerTrigger("0 * * * *")]
```
- ⚠️ Tarpeettoman usein
- ❌ ~720 API-kutsua/vrk

### **Vaihtoehto 5: Kustomoitu aikataulu**
```csharp
// Päivitä vain aktiivisina aikoina (06-22)
[TimerTrigger("0 6,9,12,15,18,21 * * *")]
```
- ✅ 6 päivitystä aktiivisina aikoina
- ✅ ~180 API-kutsua/vrk

---

## 🔧 **PAIKKAKUNNAT:**

Lisää tai poista paikkakuntia `WeatherUpdateTimer.cs`:ssä:

```csharp
var locations = new List<string>
{
    "Helsinki,FI",
    "Tampere,FI",
    "Turku,FI",
    "Oulu,FI",
    "Espoo,FI",
    // Lisää tähän lisää paikkakuntia:
    // "Vantaa,FI",
    // "Lahti,FI",
    // "Jyväskylä,FI"
};
```

---

## 📊 **MONITOROINTI:**

### **Azure Portal:**

1. **Application Insights:**
   - Katso lokit: `traces | where message contains "Weather"`
   - Katso virheet: `exceptions | where operation_Name contains "Weather"`

2. **Cosmos DB Metrics:**
   - Request Units (RU/s)
   - Storage usage

3. **Function App Metrics:**
   - Execution count (Timer-ajojen määrä)
   - Execution duration
   - Failures

---

## 💡 **TULEVAISUUDEN PARANNUKSET:**

- 📍 **Asiakaskohtainen paikkakunta** - Jokainen asiakas voi määrittää oman sijaintinsa
- 🌈 **Ennuste-data** - 5-7 päivän ennusteet
- 🌪️ **Hälytykset** - Äärisää-hälytykset (myrsky, pakkanen)
- 📊 **Tilastot** - Sään historia ja trendit
- 🗺️ **Karttatuki** - Sääkartta PWA:ssa

---

## 📚 **VIITTEET:**

- **OpenWeatherMap API:** https://openweathermap.org/api
- **Azure Timer Trigger:** https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-timer
- **CRON-lausekkeet:** https://crontab.guru/

---

**Viimeksi päivitetty:** 2025-10-07  
**Status:** ✅ Toteutettu

