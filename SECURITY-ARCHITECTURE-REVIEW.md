# ReminderApp - Security & Network Architecture Review

## 🔒 Current Architecture Analysis

### Public Services (Internet-accessible)
- **ReminderApp PWA** - Tablet käyttö, ei voi olla private
- **Azure Functions API** - PWA kutsuu → Pakko public
- **Telegram Bot Webhook** - Telegram kutsuu → Pakko public  
- **Google Sheets Fallback** - External service → Public internet

### Data Services (Tulee päättää)
- **Cosmos DB** - ❓ Public vs Private
- **Azure Blob Storage** - ❓ Public vs Private
- **Admin UI** - ❓ Public (strong auth) vs Private (VPN)

## 🎯 Security Considerations

### Data Sensitivity
- **Terveystiedot**: Lääkkeet, tapahtumat, henkilötiedot
- **GDPR compliance**: EU henkilötietojen suoja
- **Kuvat**: Perhe/henkilökohtaiset kuvat
- **Viestit**: Telegram-viestit omaisilta

### User Groups
1. **Muistisairas** - Tablet, yksinkertainen käyttö
2. **Omaiset** - Admin UI, kuva/viesti upload
3. **Hoitajat** - Potentiaalinen tulevaisuuden käyttäjäryhmä

## 🏗️ Recommended Architecture

### Option A: Hybrid (Recommended)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PUBLIC NET    │    │   PRIVATE NET   │    │   EXTERNAL      │
│                 │    │                 │    │                 │
│ PWA (Tablet)    │────│ Functions API   │────│ Cosmos DB       │
│ Admin UI        │    │ (CORS secured)  │    │ (Private End.)  │
│ Telegram Bot    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   PRIVATE NET   │
                       │                 │
                       │ Blob Storage    │
                       │ (Private End.)  │
                       └─────────────────┘
```

**Benefits:**
- ✅ Data protected (private endpoints)
- ✅ API accessible (public but secured)
- ✅ Simple tablet access
- ✅ Admin flexibility

### Option B: Full Public (Current)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PUBLIC NET    │    │   PUBLIC NET    │    │   PUBLIC NET    │
│                 │    │                 │    │                 │
│ PWA (Tablet)    │────│ Functions API   │────│ Cosmos DB       │
│ Admin UI        │    │ (Anonymous)     │    │ (Firewall)      │
│ Telegram Bot    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   PUBLIC NET    │
                       │                 │
                       │ Blob Storage    │
                       │ (Public read)   │
                       └─────────────────┘
```

**Risks:**
- ❌ Data potentially exposed
- ❌ API wide open
- ❌ Less enterprise-ready

## 🔐 Security Implementations

### API Security (Immediate)
```csharp
// AuthorizationLevel.Function (instead of Anonymous)
[HttpTrigger(AuthorizationLevel.Function, "get", "post")]

// IP Restrictions (Function App Settings)
// CORS restrictions (specific origins only)
```

### Cosmos DB Security
- **Private Endpoint**: `$0.36/day` extra cost
- **Firewall Rules**: Allow only Function App IP
- **Access Keys**: Rotate regularly

### Blob Storage Security  
- **Private Endpoint**: `$0.36/day` extra cost
- **SAS Tokens**: Time-limited access
- **Container ACL**: Private containers

## 💰 Cost Impact

| Security Level | Monthly Cost | Risk Level |
|---------------|-------------|------------|
| **Basic** (Public + Firewall) | `$0` extra | Medium |
| **Standard** (Private Endpoints) | `~$22` extra | Low |
| **Enterprise** (VNet + Gateway) | `~$150` extra | Very Low |

## 📋 Immediate Actions

### Phase 1: Basic Security (Now)
1. **Change API AuthLevel** → Function (ei Anonymous)  
2. **Add CORS restrictions** → Specific origins only
3. **Cosmos DB firewall** → Allow Functions IP only
4. **Connection strings** → KeyVault instead of plain text

### Phase 2: Private Endpoints (Later)
1. **VNet Integration** for Functions
2. **Private Endpoints** for Cosmos DB
3. **Private Endpoints** for Blob Storage  
4. **Admin UI** behind VPN or strong auth

## ❓ Decision Points

1. **Budget**: Basic ($0) vs Standard ($22/month) vs Enterprise ($150/month)?
2. **Compliance**: GDPR enough or stricter requirements?
3. **Admin Access**: VPN-based or public with strong auth?
4. **Future scaling**: Single tenant vs multi-tenant?

## 🎯 Recommendation

**Start with Phase 1 (Basic Security)** for MVP:
- Cost effective
- Quick to implement  
- Covers main risks
- Can upgrade later

**Upgrade to Phase 2** when:
- Production usage
- Multiple customers
- Compliance requirements
- Budget allows

---

**What's your preference? Basic security first or go straight to private endpoints?**
