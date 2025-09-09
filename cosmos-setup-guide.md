# Cosmos DB Setup Guide - Azure Portal

## 1. Luo Cosmos DB Account

### Azure Portal Steps:
1. **Mene Azure Portal** → Create a resource
2. **Etsi "Azure Cosmos DB"** 
3. **Valitse "Azure Cosmos DB for NoSQL"**
4. **Täytä tiedot:**
   - **Subscription**: (sama kuin Function App)
   - **Resource Group**: `reminderapp-rg` (sama kuin Function App)
   - **Account Name**: `reminderapp-cosmos`
   - **Location**: `Sweden Central` (sama kuin Function App)
   - **Capacity mode**: Provisioned throughput
   - **Apply Free Tier Discount**: Yes (jos saatavilla)
   - **Limit total account throughput**: Yes (400 RU/s)

5. **Networking**: Default settings
6. **Backup Policy**: Default (Periodic backup)
7. **Encryption**: Default
8. **Review + Create**

## 2. Luo Database ja Containers

### Database Creation:
- **Database ID**: `ReminderAppDB`
- **Provision database throughput**: No (käytä container-level throughput)

### Containers (luo kaikki):

#### 1. Clients Container
- **Container ID**: `Clients`
- **Partition Key**: `/clientId`
- **Throughput**: 400 RU/s (shared)

#### 2. Appointments Container  
- **Container ID**: `Appointments`
- **Partition Key**: `/clientId`

#### 3. Foods Container
- **Container ID**: `Foods` 
- **Partition Key**: `/clientId`

#### 4. Medications Container
- **Container ID**: `Medications`
- **Partition Key**: `/clientId`

#### 5. Photos Container
- **Container ID**: `Photos`
- **Partition Key**: `/clientId`

#### 6. Messages Container
- **Container ID**: `Messages`
- **Partition Key**: `/clientId`

#### 7. Completions Container
- **Container ID**: `Completions`
- **Partition Key**: `/clientId`

## 3. Hanki Connection String

1. **Cosmos DB Account** → Settings → Keys
2. **Kopioi "PRIMARY CONNECTION STRING"**
3. **Tallenna muistiin** - tarvitaan Function App:n konfiguraatiossa

## 4. Konfiguroi Function App

### Application Settings (Azure Portal):
1. **Function App** → Configuration → Application settings
2. **Lisää uudet asetukset:**
   - **Name**: `COSMOS_CONNECTION_STRING`
   - **Value**: `[kopioimasi connection string]`
   
   - **Name**: `COSMOS_DATABASE` 
   - **Value**: `ReminderAppDB`

3. **Save**
4. **Restart Function App**

## 5. Test Data (Lisää Data Explorerilla)

### Client Document (Clients container):
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

### Photo Document (Photos container):
```json
{
  "id": "photo_mom_001",
  "clientId": "mom",
  "type": "photo", 
  "url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
  "caption": "Kaunis maisema",
  "source": "manual",
  "isActive": true,
  "uploadedAt": "2025-09-09T12:00:00Z"
}
```

## 6. Varmista että toimii

**Testaa ReminderAPI:**
```
GET https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom
```

**Pitäisi palauttaa:**
- `storage: "cosmos"` (ei "in-memory")
- `dailyPhotoUrl` Cosmos DB:stä (ei tyhjä)
