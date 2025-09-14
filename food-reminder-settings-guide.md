# 🍽️ Food Reminder Settings Guide - ReminderApp

## 📋 Yleiskatsaus

ReminderApp tukee nyt **joustavia ruokailumuistutuksia** asiakaskohtaisilla asetuksilla. Käyttäjät voivat valita kolme eri vaihtoehtoa:

1. **Yksityiskohtaiset ehdotukset** - Lista ruoka-ehdotuksia per ateria
2. **Yksinkertaiset muistutukset** - "Muista syödä" -tyyppiset viestit  
3. **Ei ruokailumuistutuksia** - Vain lääkemuistutukset

---

## ⚙️ Client Settings Schema

### JSON-rakenne:
```json
{
  "settings": {
    "useFoodReminders": true,           // boolean: onko ruokailumuistutukset käytössä
    "foodReminderType": "detailed",     // "detailed" tai "simple"
    "simpleReminderText": "Muista syödä" // custom teksti yksinkertaisille muistutuksille
  }
}
```

### C# Model:
```csharp
public class ClientSettings
{
    [JsonPropertyName("useFoodReminders")]
    public bool UseFoodReminders { get; set; } = true;

    [JsonPropertyName("foodReminderType")]
    public string FoodReminderType { get; set; } = "detailed"; // "detailed" or "simple"

    [JsonPropertyName("simpleReminderText")]
    public string SimpleReminderText { get; set; } = "Muista syödä";
}
```

---

## 🎯 Kolme Käyttötapaa

### 1️⃣ **Yksityiskohtaiset ruokaehdotukset**
```json
{
  "useFoodReminders": true,
  "foodReminderType": "detailed"
}
```

**Toiminta:**
- Hakee Foods-containerista yksityiskohtaisia ruokaehdotuksia
- Näyttää ehdotuslistoja: "Kaurapuuro marjojen kanssa, Voileipä ja kahvi"
- Sisältää kannustavia viestejä: "Hyvää huomenta kultaseni! ☀️"
- Käyttää Foods-taulussa määriteltyjä aikatauluja

**API Response:**
```json
{
  "dailyTasks": [
    {
      "id": "food_mom_breakfast_20250909",
      "type": "food",
      "time": "08:00",
      "text": "Kaurapuuro marjojen kanssa 🫐, Voileipä ja kahvi ☕",
      "encouragingMessage": "Hyvää huomenta kultaseni! ☀️"
    }
  ]
}
```

---

### 2️⃣ **Yksinkertaiset muistutukset** 
```json
{
  "useFoodReminders": true,
  "foodReminderType": "simple",
  "simpleReminderText": "Aika syödä 🍽️"
}
```

**Toiminta:**
- Luo automaattisesti 3 muistutusta: 08:00, 12:00, 18:00
- Käyttää asiakaskohtaista tekstiä tai defaultia "Muista syödä"
- Ei tarvitse Foods-taulun dataa
- Kevyt ja yksinkertainen ratkaisu

**API Response:**
```json
{
  "dailyTasks": [
    {
      "id": "simple_food_20250914_0800",
      "type": "food", 
      "time": "08:00",
      "text": "🍽️ Aika syödä 🍽️",
      "encouragingMessage": "Hyvää ruokahalua! 😊"
    },
    {
      "time": "12:00",
      "text": "🍽️ Aika syödä 🍽️"
    },
    {
      "time": "18:00", 
      "text": "🍽️ Aika syödä 🍽️"
    }
  ]
}
```

---

### 3️⃣ **Ei ruokailumuistutuksia**
```json
{
  "useFoodReminders": false
}
```

**Toiminta:**
- Ei lisää food-tyyppisiä dailyTasks-merkintöjä
- Näyttää vain lääkemuistutukset ja muut tehtävät
- Minimalistinen ratkaisu käyttäjille jotka eivät halua ruokamuistutuksia

**API Response:**
```json
{
  "dailyTasks": [
    {
      "type": "medication",
      "time": "08:00", 
      "text": "💊 Aamulääke - 1 tabletti"
    }
    // Ei food-taskeja
  ]
}
```

---

## 🛠️ Tekninen Toteutus

### API Logic (ReminderApi.cs):
```csharp
// Get client settings (use defaults if not found)
var clientSettings = client?.Settings ?? new ClientSettings();

// Add food tasks based on settings
if (clientSettings.UseFoodReminders)
{
    if (clientSettings.FoodReminderType == "simple")
    {
        // Add simple food reminders at standard meal times
        var mealTimes = new[] { "08:00", "12:00", "18:00" };
        var simpleText = !string.IsNullOrEmpty(clientSettings.SimpleReminderText) 
            ? clientSettings.SimpleReminderText 
            : "Muista syödä";

        foreach (var mealTime in mealTimes)
        {
            dailyTasks.Add(new DailyTask
            {
                Id = $"simple_food_{DateTime.Today:yyyyMMdd}_{mealTime.Replace(":", "")}",
                Type = "food",
                Time = mealTime,
                Text = $"🍽️ {simpleText}",
                Completed = false,
                EncouragingMessage = "Hyvää ruokahalua! 😊"
            });
        }
    }
    else // detailed food reminders
    {
        dailyTasks.AddRange(todaysFoods.Select(food => new DailyTask
        {
            Id = food.Id,
            Type = "food",
            Time = food.TimeSlot,
            Text = food.Suggestions.Any() ? string.Join(", ", food.Suggestions) : "Ruokailu",
            Completed = food.Completed,
            EncouragingMessage = food.EncouragingMessage
        }));
    }
}
// If UseFoodReminders = false, no food tasks are added
```

---

## 📊 Testiasiakkaat

PowerShell scriptit luovat automaattisesti 3 testiasiakasta:

### **MOM** - Yksityiskohtaiset ehdotukset
- `clientID=mom`
- `foodReminderType="detailed"`
- Näyttää ruokaehdotuksia Foods-taulusta

### **DAD** - Yksinkertaiset muistutukset  
- `clientID=dad`
- `foodReminderType="simple"`
- `simpleReminderText="Aika syödä 🍽️"`

### **TEST** - Ei ruokailumuistutuksia
- `clientID=test`  
- `useFoodReminders=false`
- Vain lääkemuistutukset

---

## 🧪 Testaaminen

### API-kutsut:
```bash
# Detailed food reminders (mom)
curl 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom'

# Simple food reminders (dad)  
curl 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=dad'

# No food reminders (test)
curl 'https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=test'
```

### Odotettavat erot vastauksissa:
- **MOM**: Yksityiskohtaiset food-taskit Foods-taulusta
- **DAD**: 3 yksinkertaista "🍽️ Aika syödä 🍽️" -taskia  
- **TEST**: Ei food-taskeja lainkaan

---

## 💡 Käyttötapaukset

### **Detailed** sopii:
- Alzheimer-potilaille jotka hyötyvät konkreettisista ehdotuksista
- Ruokavaliorajoitteisille käyttäjille
- Käyttäjille joilla on omaishoitaja luomassa ruokalistoja

### **Simple** sopii:
- Itsenäisille käyttäjille jotka haluavat vain muistutuksen
- Käyttäjille jotka suunnittelevat itse ruokansa
- Minimalistisille käyttäjille

### **Disabled** sopii:
- Käyttäjille joilla on muita ruokailumuistutuksia
- Käyttäjille jotka eivät tarvitse ruokamuistutuksia
- Testikäyttöön ja kehitykseen

---

## 🔄 Migration Path

### Vanhat asiakkaat:
- Automaattisesti `useFoodReminders=true, foodReminderType="detailed"`
- Säilyttää nykyisen toiminnallisuuden
- Ei breaking changeja

### Uudet asiakkaat:
- Voivat valita sopivan vaihtoehdon alusta alkaen
- Default: `detailed` (yhteensopivuus)

---

## 📋 TODO: Tulevat Parannukset

1. **Admin UI** - asetuksien muokkaaminen käyttöliittymästä
2. **Custom meal times** - simple-tilassa oman aikataulun määrittäminen
3. **Multiple languages** - simple reminder tekstit eri kielillä  
4. **Activity-based reminders** - ruokailun kytkeminen päivän aktiviteetteihin
5. **Completion tracking** - simple-taskien kuittausmahdollisuus

---

*Laadittu: 2025-09-14*  
*Versio: v2.0 - Joustavat ruokailumuistutukset*  
*Status: ✅ Valmis toteutettavaksi*
