# ReminderApp - Cosmos DB Setup Azure Portalissa

## 📋 Vaihe 1: Luo Cosmos DB Account

1. **Azure Portal** → "Create a resource"
2. **Etsi** "Azure Cosmos DB" 
3. **Valitse** "Azure Cosmos DB for NoSQL"
4. **Täytä lomake:**
   - **Subscription**: `Enel-Virtual-desktop-Infrastructure`
   - **Resource Group**: `rg-reminderapp` (sama kuin Functions)
   - **Account Name**: `reminderapp-cosmos-db`
   - **Location**: `Sweden Central`
   - **Capacity mode**: `Provisioned throughput`
   - **Apply Free Tier**: `Yes` (jos saatavilla)
   - **Limit total account throughput**: `400 RU/s`

5. **Networking**: Default
6. **Backup**: Default  
7. **Encryption**: Default
8. **Review + Create** → **Create**

## 📋 Vaihe 2: Luo Database ja Containerit

### Database Creation
1. **Cosmos DB** → **Data Explorer** 
2. **New Database**
   - **Database ID**: `ReminderAppDB`
   - **Provision database throughput**: `No` (käytä container-level)

### Container Creation (7 kpl)

#### 1. Clients Container
- **Container ID**: `Clients`
- **Partition key**: `/clientId`
- **Throughput**: `400 RU/s` (shared between containers)

#### 2. Appointments Container  
- **Container ID**: `Appointments`
- **Partition key**: `/clientId`

#### 3. Foods Container
- **Container ID**: `Foods`
- **Partition key**: `/clientId`

#### 4. Medications Container
- **Container ID**: `Medications`
- **Partition key**: `/clientId`

#### 5. Photos Container
- **Container ID**: `Photos`
- **Partition key**: `/clientId`

#### 6. Messages Container
- **Container ID**: `Messages`
- **Partition key**: `/clientId`

#### 7. Completions Container
- **Container ID**: `Completions`
- **Partition key**: `/clientId`

## 📋 Vaihe 3: Hanki Connection String

1. **Cosmos DB Account** → **Settings** → **Keys**
2. **Kopioi** "PRIMARY CONNECTION STRING"
3. **Tallenna** muistiin

## 📋 Vaihe 4: Konfiguroi Cosmos DB Firewall (SECURITY)

1. **Cosmos DB Account** → **Settings** → **Networking**
2. **Firewall and virtual networks** → **Selected networks**
3. **Add IP address** → **Function App outbound IPs**:
   - Go to **Function App** `reminderapp-functions` → **Properties** 
   - **Outbound IP addresses** → Copy all IPs
   - Add each IP individually to Cosmos DB firewall
4. **Save** (takes ~2-3 minutes to apply)

## 📋 Vaihe 5: Konfiguroi Function App

1. **Function App** `reminderapp-functions` → **Configuration** → **Application settings**
2. **+ New application setting:**
   - **Name**: `COSMOS_CONNECTION_STRING`
   - **Value**: `[liitä connection string tähän]`
3. **Save**
4. **Restart** Function App

## 📋 Vaihe 6: Testaa API

```powershell
# Testaa että Cosmos DB toimii
Invoke-WebRequest -Uri "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom" -Method GET
```

**Odotettava vastaus:**
- `"storage": "cosmos"` (ei "in-memory")
- Cosmos DB data (vaikka tyhjä aluksi)

## 📋 Vaihe 7: Lisää testidataa

**Data Explorer** → **Clients container** → **New Item**:

```json
{
  "id": "mom",
  "clientId": "mom", 
  "type": "client",
  "name": "Äiti",
  "displayName": "Kultaseni",
  "timezone": "Europe/Helsinki",
  "language": "fi"
}
```

---

## ✅ Valmis! 

Kun Cosmos DB on luotu ja konfiguroitu, ReminderApp käyttää sitä automaattisesti Google Sheets:in sijaan.
