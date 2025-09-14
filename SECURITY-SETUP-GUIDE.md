# ReminderApp - Security Setup Guide

## 🔐 Phase 1: Basic Security Implementation

### ✅ **Completed:**
- ✅ API AuthLevel: `Anonymous` → `Function` (tärkeille endpointeille)
- ✅ CORS restrictions: `host.json` → specific origins only
- ⏳ PWA API key configuration (next step)
- ⏳ Cosmos DB firewall rules (when created)

### 📋 **Step 1: Get Azure Function API Key**

1. **Azure Portal** → Function App `reminderapp-functions`
2. **Functions** → **App keys** 
3. **Function keys** → `default` (tai luo uusi "reminderapp-key")
4. **Copy** function key value

**API Key format:**
```
?code=ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ...
```

### 📋 **Step 2: Update PWA Configuration**

**File:** `ReminderPWA/wwwroot/appsettings.json`

```json
{
  "ApiSettings": {
    "BaseUrl": "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI",
    "FunctionKey": "ABC123DEF456...",
    "DefaultClientId": "mom"
  },
  "Twilio": {
    "TokenUrl": "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/twilio/token",
    "FunctionKey": "ABC123DEF456..."
  }
}
```

### 📋 **Step 3: Update PWA ApiService**

**File:** `ReminderPWA/Services/ApiService.cs`

```csharp
// Add ?code=xxx to URL
var targetUrl = $"{_apiSettings.BaseUrl}?clientID={actualClientId}&code={_apiSettings.FunctionKey}&_t={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
```

### 📋 **Step 4: Deploy Changes**

```powershell
# Commit security changes
git add -A
git commit -m "🔐 Basic Security: Function AuthLevel + CORS + API Keys"
git push

# This triggers:
# - .NET Functions deployment
# - PWA deployment with new API configuration
```

### 📋 **Step 5: Cosmos DB Security (When Created)**

#### **Option A: Firewall Rules (Free)**
1. **Cosmos DB** → **Networking** → **Firewall and virtual networks**
2. **Selected networks** 
3. **Add IP range** → Function App outbound IPs:
   ```
   Function App → Properties → Outbound IP addresses
   Add all IPs: 1.2.3.4, 5.6.7.8, etc.
   ```

#### **Option B: Private Endpoint (+$22/month)**
1. **Private endpoints** → **Add private endpoint**
2. **Resource group**: `rg-reminderapp`
3. **Name**: `reminderapp-cosmos-private`
4. **Region**: `Sweden Central`

### 🧪 **Testing Security**

#### **Test 1: API with Key (Should work)**
```powershell
$functionKey = "YOUR_FUNCTION_KEY"
$url = "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom&code=$functionKey"
Invoke-WebRequest -Uri $url
```

#### **Test 2: API without Key (Should fail)**
```powershell
$url = "https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom"
Invoke-WebRequest -Uri $url  # Should return 401 Unauthorized
```

#### **Test 3: CORS from Wrong Origin (Should fail)**
```javascript
// From non-allowed origin - should fail
fetch('https://reminderapp-functions-hrhddjfeb0bpa0ee.swedencentral-01.azurewebsites.net/api/ReminderAPI?clientID=mom&code=xxx')
```

## 🔒 **Security Status Summary**

| Component | Security Level | Status |
|-----------|---------------|--------|
| **ReminderAPI** | Function Key Required | ✅ |
| **AdminAPI** | Function Key Required | ✅ |
| **TwilioAPI** | Function Key Required | ✅ |
| **TelegramAPI** | Mixed (webhook=open, others=key) | ✅ |
| **CORS** | Restricted Origins | ✅ |
| **PWA** | Uses Function Keys | ⏳ |
| **Cosmos DB** | Firewall/Private | ⏳ |

## 🎯 **Next Steps**

1. **Get Function API Key** from Azure Portal
2. **Update PWA config** with API key
3. **Test API calls** with key
4. **Create Cosmos DB** with firewall rules
5. **Monitor logs** for unauthorized attempts

## 💡 **Security Best Practices**

- ✅ Function keys rotate automatically (or manually)
- ✅ CORS prevents browser-based attacks  
- ✅ Firewall rules limit database access
- ✅ Anonymous endpoints only for webhooks
- ✅ API keys not exposed in client-side code (via appsettings)

**Cost:** $0 extra for basic security!
**Implementation time:** ~15 minutes
**Security improvement:** Medium → High
