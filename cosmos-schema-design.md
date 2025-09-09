# ReminderApp Cosmos DB Schema Design

## Container Structure

### 1. **Clients** Container
```json
{
  "id": "mom",
  "type": "client", 
  "partitionKey": "mom",
  "name": "Äiti",
  "displayName": "Kultaseni",
  "timezone": "Europe/Helsinki",
  "language": "fi",
  "createdAt": "2025-09-09T12:00:00Z",
  "updatedAt": "2025-09-09T12:00:00Z",
  "settings": {
    "smsEnabled": true,
    "smsCount": 4,
    "weatherLocation": "Helsinki", 
    "photoRotation": "daily",
    "reminderTimes": ["08:00", "12:00", "16:00", "20:00"]
  },
  "contacts": {
    "primaryFamily": "Petri",
    "phone": "+358...",
    "emergencyContact": "+358..."
  }
}
```

### 2. **Appointments** Container  
```json
{
  "id": "apt_mom_20250910_001",
  "type": "appointment",
  "partitionKey": "mom",
  "clientId": "mom", 
  "title": "Lääkärin vastaanotto",
  "description": "Muista ottaa lääkkeet mukaan",
  "date": "2025-09-10",
  "time": "14:00",
  "location": "Terveysasema",
  "reminderBefore": 60, // minutes
  "createdAt": "2025-09-09T12:00:00Z",
  "createdBy": "family_admin"
}
```

### 3. **Foods** Container
```json
{
  "id": "food_mom_breakfast_001", 
  "type": "food",
  "partitionKey": "mom",
  "clientId": "mom",
  "mealTime": "breakfast", // breakfast, lunch, dinner, evening
  "timeSlot": "08:00",
  "suggestions": [
    "Kaurapuuro marjojen kanssa 🫐",
    "Voileipä ja kahvi ☕", 
    "Jogurtti ja hedelmät 🍓"
  ],
  "encouragingMessage": "Hyvää huomenta kultaseni! Aloitetaan päivä hyvällä aamiaisella! ☀️",
  "completed": false,
  "completedAt": null,
  "date": "2025-09-09"
}
```

### 4. **Medications** Container
```json
{
  "id": "med_mom_morning_001",
  "type": "medication", 
  "partitionKey": "mom",
  "clientId": "mom",
  "name": "Muistilääke",
  "dosage": "1 tabletti",
  "timeSlot": "morning", // morning, afternoon, evening, night
  "time": "08:00",
  "instructions": "Otetaan aamulla ruoan kanssa",
  "completed": false,
  "completedAt": null,
  "date": "2025-09-09",
  "recurring": true,
  "recurringPattern": "daily"
}
```

### 5. **Photos** Container
```json
{
  "id": "photo_mom_001",
  "type": "photo",
  "partitionKey": "mom", 
  "clientId": "mom",
  "url": "https://drive.google.com/...",
  "caption": "Petri nuorena",
  "source": "telegram", // telegram, manual, drive
  "uploadedAt": "2025-09-09T12:00:00Z",
  "uploadedBy": "family_admin",
  "isActive": true,
  "tags": ["family", "memories"]
}
```

### 6. **Messages** Container
```json
{
  "id": "msg_mom_morning_001",
  "type": "message",
  "partitionKey": "mom",
  "clientId": "mom", 
  "category": "encouragement", // food, exercise, reminder, weather
  "timeOfDay": "morning", // morning, afternoon, evening, night
  "text": "Hyvää huomenta kultaseni! Aurinko paistaa - hyvä päivä ulkoilulle! ☀️",
  "weatherCondition": "sunny", // any, sunny, rainy, cold, warm
  "isActive": true,
  "createdAt": "2025-09-09T12:00:00Z",
  "createdBy": "family_admin"
}
```

### 7. **Completions** Container (Kuittaukset)
```json
{
  "id": "comp_mom_20250909_food_breakfast",
  "type": "completion",
  "partitionKey": "mom",
  "clientId": "mom",
  "itemType": "food", // food, medication
  "itemId": "food_mom_breakfast_001", 
  "completedAt": "2025-09-09T08:30:00Z",
  "date": "2025-09-09",
  "notes": "Söi kaurapuuron"
}
```

## Partition Strategy
- **Partition Key**: `clientId` (esim. "mom")
- **Benefits**: 
  - Kaikki asiakkaan data samassa partitionissa
  - Tehokkaat kyselyt per asiakas
  - Helppo skaalautuvuus uusille asiakkaille

## Indexing Strategy
```json
{
  "indexingPolicy": {
    "includedPaths": [
      {"path": "/clientId/?"},
      {"path": "/type/?"},
      {"path": "/date/?"},
      {"path": "/timeSlot/?"},
      {"path": "/completed/?"}
    ]
  }
}
```
