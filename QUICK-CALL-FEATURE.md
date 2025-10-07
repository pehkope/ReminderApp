# 📞 Quick Call Feature - Pikalinkit ystävien soittamiseen

Helppo tapa ottaa yhteyttä ystäviin ja perheeseen suoraan PWA:n alapalkista.

---

## 🎯 **TAVOITE:**

- **Helppo soittaminen** - Klikkaa nappia → puhelin soittaa
- **Persoonalliset viestit** - "Soita Ullalle!" eikä "Soita ystävälle"
- **Asiakaskohtainen** - Joku ei voi soittaa → ominaisuus pois käytöstä
- **Priorisoidut kontaktit** - Primary + 3 ystävää alapalkissa

---

## 🔧 **BACKEND (VALMIS ✅):**

### **1. API Response:**

```json
{
  "success": true,
  "clientID": "mom",
  "settings": {
    "enableCallFeature": true
  },
  "quickCallContacts": [
    {
      "name": "Matti",
      "phone": "+358401234567",
      "relationship": "Poika"
    },
    {
      "name": "Ulla",
      "phone": "+358405551234",
      "relationship": "Ystävä"
    },
    {
      "name": "Arvo",
      "phone": "+358405559876",
      "relationship": "Ystävä"
    },
    {
      "name": "Maija",
      "phone": "+358405552468",
      "relationship": "Ystävä"
    }
  ]
}
```

### **2. Personalisoidut viestit:**

**Ennen:**
```json
{
  "activitySuggestion": "Soita jollekin ystävälle tänään!"
}
```

**Nyt (käytä {friend} placeholder):**
```json
{
  "activitySuggestion": "Soita {friend}lle ja ehdota kahvia! ☕"
}
```

**Tulos:**
```
"Soita Ullalle ja ehdota kahvia! ☕"
```

---

## 📱 **PWA (TODO):**

### **Alapalkki:**

```
┌─────────────────────────────────────────┐
│  Muistilista                            │
│                                         │
│  [Tehtävät]  [Lääkkeet]  [Kuvat]       │
│                                         │
├─────────────────────────────────────────┤
│  SOITA LÄHEISILLE:                      │
│  [☎️ Matti]  [☎️ Ulla]  [☎️ Arvo]      │
└─────────────────────────────────────────┘
```

### **Blazor/C# (ReminderPWA):**

```csharp
// Pages/Index.razor

@if (apiResponse?.Settings?.EnableCallFeature == true 
    && apiResponse.QuickCallContacts?.Any() == true)
{
    <div class="quick-call-bar">
        <h3>📞 Soita:</h3>
        <div class="call-buttons">
            @foreach (var contact in apiResponse.QuickCallContacts)
            {
                <button class="call-btn" 
                        @onclick="() => MakeCall(contact.Phone, contact.Name)">
                    ☎️ @contact.Name
                </button>
            }
        </div>
    </div>
}

@code {
    private void MakeCall(string phone, string name)
    {
        // Mobile: Avaa puhelin-sovellus
        if (IsMobile())
        {
            NavigationManager.NavigateTo($"tel:{phone}", forceLoad: true);
        }
        else
        {
            // Desktop: Näytä numero
            ShowCallDialog(name, phone);
        }
    }

    private bool IsMobile()
    {
        // Tarkista UserAgent tai window.innerWidth
        return JSRuntime.InvokeAsync<bool>("isMobileDevice").Result;
    }

    private void ShowCallDialog(string name, string phone)
    {
        // Näytä modal: "Soita Ullalle numeroon +358405551234"
        // [SULJE]
    }
}
```

### **CSS (wwwroot/css/app.css):**

```css
.quick-call-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 15px;
    box-shadow: 0 -4px 12px rgba(0,0,0,0.2);
    z-index: 1000;
}

.quick-call-bar h3 {
    color: white;
    margin: 0 0 10px 0;
    font-size: 16px;
    text-align: center;
}

.call-buttons {
    display: flex;
    justify-content: center;
    gap: 10px;
    flex-wrap: wrap;
}

.call-btn {
    background: white;
    color: #667eea;
    border: none;
    border-radius: 25px;
    padding: 12px 24px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.call-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.3);
    background: #f0f0f0;
}

.call-btn:active {
    transform: translateY(0);
}

/* Mobile optimization */
@media (max-width: 768px) {
    .call-btn {
        padding: 10px 18px;
        font-size: 14px;
    }
}
```

### **JavaScript (wwwroot/js/mobile-detect.js):**

```javascript
window.isMobileDevice = function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth <= 768;
}
```

---

## 🎨 **UI ESIMERKKI:**

### **Desktop:**
```
Klikki [☎️ Ulla] →
┌─────────────────────────────┐
│  📞 SOITA ULLALLE           │
├─────────────────────────────┤
│  Numero: +358405551234      │
│                             │
│  Soita tästä numerosta      │
│  puhelimellasi              │
│                             │
│  [SULJE]                    │
└─────────────────────────────┘
```

### **Mobile:**
```
Klikki [☎️ Ulla] →
→ Avaa puhelinsovelma
→ Numero valittu valmiiksi
→ Käyttäjä klikkaa "Soita"
```

---

## ⚙️ **ASIAKASKOHTAISET ASETUKSET:**

### **Esimerkki 1: Soittaa itse (mom):**

```json
{
  "clientId": "mom",
  "fullName": "Anna Virtanen",
  "settings": {
    "enableCallFeature": true
  },
  "contacts": [
    {
      "name": "Matti Virtanen",
      "relationship": "Poika",
      "phone": "+358401234567",
      "isPrimary": true
    },
    {
      "name": "Ulla Mäkinen",
      "relationship": "Ystävä",
      "phone": "+358405551234"
    }
  ]
}
```

**Tulos:**
- ✅ Alapalkki näkyy
- ✅ 4 nappia: Matti, Ulla, Arvo, Maija
- ✅ Viestit: "Soita Ullalle!"

---

### **Esimerkki 2: Ei voi soittaa (grandma):**

```json
{
  "clientId": "grandma",
  "fullName": "Helmi Virtanen",
  "settings": {
    "enableCallFeature": false
  },
  "contacts": [...]
}
```

**Tulos:**
- ❌ Alapalkki piilotettu
- ❌ Ei soittonapit
- ✅ Viestit muutettu: "Joku soittaa sinulle kohta" (ei placeholderia)

---

## 📊 **LOGIIKKA:**

### **Backend (ReminderApi.cs):**

```csharp
// 1. Hae asiakkaan tiedot
var client = await _cosmosDbService.GetClientAsync(clientId);

// 2. Tarkista onko soittoominaisuus käytössä
if (client != null && clientSettings.EnableCallFeature)
{
    // 3. Hae primary contact (perhe)
    var primaryContact = client.GetPrimaryContact();
    if (primaryContact != null)
    {
        quickCallContacts.Add(new QuickCallContact
        {
            Name = primaryContact.Name.Split(' ')[0], // "Matti"
            Phone = primaryContact.Phone,
            Relationship = primaryContact.Relationship
        });
    }

    // 4. Hae top 3 ystävää
    var friends = client.GetFriends().Take(3);
    foreach (var friend in friends)
    {
        quickCallContacts.Add(new QuickCallContact
        {
            Name = friend.Name.Split(' ')[0], // "Ulla"
            Phone = friend.Phone,
            Relationship = friend.Relationship
        });
    }
}

// 5. Palauta response
response.QuickCallContacts = quickCallContacts;
```

### **Message Personalization (WeatherService.cs):**

```csharp
// Hae viesti Cosmos DB:stä
var selectedCard = messageCards[_random.Next(messageCards.Count)];
var activity = selectedCard.ActivitySuggestion; // "Soita {friend}lle!"

// Korvaa {friend} oikealla nimellä
if (activity.Contains("{friend}"))
{
    var friends = client.GetFriends();
    if (friends.Any())
    {
        var randomFriend = friends[_random.Next(friends.Count)];
        var friendName = randomFriend.Name.Split(' ')[0]; // "Ulla"
        
        activity = activity.Replace("{friend}", friendName);
        // "Soita Ullalle!"
    }
    else
    {
        activity = activity.Replace("{friend}", "ystävälle");
        // Fallback: "Soita ystävälle!"
    }
}
```

---

## 📝 **ESIMERKKIVIESTIT:**

```json
{
  "greeting": "Hyvää huomenta kultaseni! ☀️",
  "activitySuggestion": "Kaunis päivä! Soita {friend}lle ja ehdota kävelylenkkiä! 📞☀️"
}
→ "Soita Ullalle ja ehdota kävelylenkkiä! 📞☀️"

{
  "greeting": "Päivää kultaseni! ☁️",
  "activitySuggestion": "Kaupassa käynnin jälkeen soita {friend}lle! 📞"
}
→ "Kaupassa käynnin jälkeen soita Arvolle! 📞"

{
  "greeting": "Hyvää iltaa kultaseni! 🌙",
  "activitySuggestion": "Rauhallinen ilta! Soita {friend}lle ja toivota hyvää iltaa 💕"
}
→ "Rauhallinen ilta! Soita Maijalle ja toivota hyvää iltaa 💕"
```

---

## 🔐 **TIETOTURVA:**

- ✅ **Puhelinnumerot suojattu** - Näytetään vain client-kohtaiset kontaktit
- ✅ **Client ID validointi** - Ei voi hakea toisten asiakkaiden numeroita
- ✅ **Autentikointi tulevaisuudessa** - JWT estää väärinkäytökset
- ✅ **Lokitus** - Soittotapahtumat voidaan logata (optional)

---

## 📊 **KÄYTTÖANALYYSI (TULEVAISUUS):**

```csharp
// Tallennetaan soittotapahtuma
await _cosmosDbService.CreateItemAsync(new CallEvent
{
    ClientId = "mom",
    ContactName = "Ulla Mäkinen",
    CallTime = DateTime.UtcNow,
    Source = "QuickCall"
}, "Analytics");

// Raportointi:
// - Ketkä ovat suosituimmat soitettavat?
// - Kuinka usein käytetään soittonappia?
// - Mihin aikaan eniten soitellaan?
```

---

## ✅ **DEPLOYMENT:**

**Backend:** ✅ Valmis (pushed to main)
- `enableCallFeature` setting
- `quickCallContacts` API field
- `{friend}` personalization

**PWA Frontend:** ⏳ TODO
- Alapalkki komponentti
- Soittonappien logiikka
- Mobile detection

---

## 🚀 **SEURAAVAT ASKELEET:**

1. **PWA Alapalkki** - Lisää Blazor-komponentti
2. **Mobile Detection** - JavaScript helper
3. **Testaus** - Kokeile mobile + desktop
4. **Analytiikka** - Seuraa käyttöä (optional)

---

**Status:** Backend ✅ | Frontend ⏳  
**Viimeksi päivitetty:** 2025-10-07

