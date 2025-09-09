# Cosmos DB Data Import Guide - Mom Test Data

## Vaihe 1: Luo Cosmos DB (jos ei vielä tehty)

### Azure Portal:
1. **Create a resource** → **Azure Cosmos DB** → **Azure Cosmos DB for NoSQL**
2. **Täytä tiedot:**
   - **Account Name**: `reminderapp-cosmos`
   - **Resource Group**: `reminderapp-rg` 
   - **Location**: `Sweden Central`
   - **Apply Free Tier**: Yes
   - **Limit account throughput**: Yes (400 RU/s)

## Vaihe 2: Luo Database ja Containers

### Database:
- **Database ID**: `ReminderAppDB`
- **Provision database throughput**: No

### Containers (luo kaikki):
```
1. Clients        (Partition key: /clientId)
2. Photos         (Partition key: /clientId) 
3. Appointments   (Partition key: /clientId)
4. Foods          (Partition key: /clientId)
5. Medications    (Partition key: /clientId)
6. Messages       (Partition key: /clientId)
7. Completions    (Partition key: /clientId)
```

**Throughput**: 400 RU/s shared across all containers

## Vaihe 3: Import Test Data

### Data Explorer käyttäen:

#### 1. Clients Container:
```json
{
  "id": "mom",
  "clientId": "mom", 
  "type": "client",
  "name": "Äiti",
  "displayName": "Kultaseni",
  "timezone": "Europe/Helsinki",
  "language": "fi",
  "settings": {
    "smsEnabled": true,
    "smsCount": 4,
    "weatherLocation": "Helsinki",
    "reminderTimes": ["08:00", "12:00", "16:00", "20:00"]
  }
}
```

#### 2. Photos Container (lisää 3 kpl):
```json
{
  "id": "photo_mom_001",
  "clientId": "mom",
  "type": "photo", 
  "url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
  "caption": "Kaunis järvimaisema",
  "isActive": true,
  "uploadedAt": "2025-09-09T12:00:00Z"
}
```

#### 3. Foods Container (lisää 4 kpl - aamu, lounas, päivällinen, iltapala):
```json
{
  "id": "food_mom_breakfast_20250909",
  "clientId": "mom",
  "type": "food",
  "mealTime": "breakfast", 
  "timeSlot": "08:00",
  "date": "2025-09-09",
  "suggestions": [
    "Kaurapuuro marjojen kanssa 🫐",
    "Voileipä juustolla ja kahvi ☕"
  ],
  "encouragingMessage": "Hyvää huomenta kultaseni! ☀️",
  "completed": false
}
```

#### 4. Medications Container (lisää 2 kpl):
```json
{
  "id": "med_mom_morning_20250909", 
  "clientId": "mom",
  "type": "medication",
  "name": "Muistilääke",
  "dosage": "1 tabletti",
  "time": "08:00",
  "date": "2025-09-09",
  "instructions": "Aamulla ruoan kanssa",
  "completed": false,
  "recurring": true
}
```

#### 5. Appointments Container (lisää 2 kpl):
```json
{
  "id": "apt_mom_20250912_001",
  "clientId": "mom", 
  "type": "appointment",
  "title": "Lääkärin vastaanotto",
  "description": "Muista lääkkeet mukaan",
  "date": "2025-09-12",
  "time": "14:00",
  "location": "Terveysasema"
}
```

## Vaihe 4: Konfiguroi Function App

### Application Settings:
1. **Function App** → **Configuration** → **Application settings**
2. **Lisää:**
   - **Name**: `COSMOS_CONNECTION_STRING`
   - **Value**: `[Cosmos DB Primary Connection String]`
3. **Save** + **Restart Function App**

## Vaihe 5: Testaa API

### Test URL:
```
GET https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom
```

### Odotettu vastaus:
```json
{
  "success": true,
  "clientID": "mom", 
  "storage": "cosmos",
  "dailyPhotoUrl": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
  "dailyPhotoCaption": "Kaunis järvimaisema",
  "greeting": "Hyvää huomenta kultaseni! ☀️",
  "importantMessage": "Muista: Lääkärin vastaanotto 2025-09-12 klo 14:00",
  "dailyTasks": [
    {
      "type": "medication",
      "time": "08:00", 
      "text": "💊 Muistilääke - 1 tabletti"
    },
    {
      "type": "food",
      "time": "08:00",
      "text": "Kaurapuuro marjojen kanssa 🫐, Voileipä juustolla ja kahvi ☕"
    }
  ],
  "upcomingAppointments": [...],
  "foods": [...],
  "medications": [...]
}
```

## Troubleshooting

### Jos "storage": "in-memory":
- Tarkista COSMOS_CONNECTION_STRING Function App:ssa
- Varmista että containers on luotu oikein
- Katso Function App Logs virheistä

### Jos valokuva ei näy:
- Varmista että Photos containerissa on data
- Tarkista että isActive: true
- Kokeile Google Sheets fallback
