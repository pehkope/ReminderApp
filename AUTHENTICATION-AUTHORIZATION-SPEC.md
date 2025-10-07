# 🔒 Autentikointi & Auktorisointi - Tekninen Spesifikaatio

**Status:** 📋 Suunnitelma (ei toteutettu)  
**Prioriteetti:** 🔴 Kriittinen tietoturvariski  
**Arvioitu aika:** 1-2 tuntia (Vaihtoehto A)

---

## 🚨 **NYKYINEN ONGELMA:**

### **Tietoturvariski:**
```bash
# Kuka tahansa voi vaihtaa clientID:tä URL:ssa:
https://pwa.example.com/?clientID=mom   # Näkee äidin tiedot
https://pwa.example.com/?clientID=dad   # Näkee isän tiedot

❌ EI AUTENTIKOINTIA
❌ EI AUKTORISOINTIA
❌ EI KÄYTTÄJÄHALLINTAA
❌ ARKALUONTEISET TIEDOT JULKISIA
```

### **Mitä tietoja on vaarassa:**
- 🏥 Lääkitystiedot
- 🩺 Sairaudet ja allergiat
- 📞 Yhteyshenkilöiden tiedot
- 📍 Osoitetiedot
- 📸 Henkilökohtaiset valokuvat
- 💬 Viestit ja muistiinpanot

---

## ✅ **TAVOITE:**

1. **Käyttäjät kirjautuvat** - Email/PIN tai Telegram
2. **Käyttäjä näkee vain sallitut asiakkaat** - Multi-client access
3. **API validoi jokaisen pyynnön** - JWT token + clientID-tarkistus
4. **Admin UI** - Tapa hallita käyttäjiä ja oikeuksia

---

## 📊 **RATKAISUVAIHTOEHDOT:**

| Vaihtoehto | Aika | Tietoturva | Ylläpito | Suositus |
|-----------|------|-----------|----------|----------|
| **A: JWT + Cosmos DB** | 1-2h | ⭐⭐⭐ | Helppo | ✅ **SUOSITELTU** |
| **B: Azure AD B2C** | 4-6h | ⭐⭐⭐⭐⭐ | Keskivaikea | Tuotantotaso |
| **C: Telegram-pohjainen** | 30min | ⭐⭐ | Helppo | Prototyyppi |

---

## 🟢 **VAIHTOEHTO A: Yksinkertainen JWT-autentikointi (SUOSITELTU)**

### **Arkkitehtuuri:**

```
┌─────────────────────────────────────────────────────────────┐
│  PWA (Blazor WebAssembly)                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Login Page   │→ │ Client List  │→ │ Client View  │     │
│  │ Email + PIN  │  │ (authorized) │  │ (mom)        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         ↓ POST /auth/login              ↑ GET /ReminderAPI│
│         ↓ Returns JWT + clients         ↑ Authorization:   │
│         ↓                                ↑ Bearer <token>  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Azure Functions API                                         │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ AuthAPI          │  │ ReminderAPI      │                │
│  │ - Login          │  │ + JWT Middleware │                │
│  │ - Register       │  │ + AuthZ Check    │                │
│  │ - RefreshToken   │  └──────────────────┘                │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Cosmos DB                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Users        │  │ Clients      │  │ Messages     │     │
│  │ - userId     │  │ - clientId   │  │ - clientId   │     │
│  │ - email      │  │ - fullName   │  │ - greeting   │     │
│  │ - pinHash    │  │ - contacts   │  │              │     │
│  │ - authorized │  │              │  │              │     │
│  │   Clients[]  │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 **TIETOMALLIT:**

### **1. User (Käyttäjä):**

```csharp
public class User
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty; // "user_<userId>"

    [JsonPropertyName("userId")]
    public string UserId { get; set; } = string.Empty; // "matti_virtanen"

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty; // "matti.virtanen@example.com"

    [JsonPropertyName("pinHash")]
    public string PinHash { get; set; } = string.Empty; // BCrypt hash of PIN

    [JsonPropertyName("fullName")]
    public string FullName { get; set; } = string.Empty; // "Matti Virtanen"

    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty; // "+358401234567"

    [JsonPropertyName("role")]
    public string Role { get; set; } = "family"; // "family", "caregiver", "admin"

    [JsonPropertyName("authorizedClients")]
    public List<string> AuthorizedClients { get; set; } = new(); // ["mom", "uncle_john"]

    [JsonPropertyName("telegramChatId")]
    public string TelegramChatId { get; set; } = string.Empty;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("lastLoginAt")]
    public DateTime? LastLoginAt { get; set; }

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

**Esimerkki:**
```json
{
  "id": "user_matti_virtanen",
  "userId": "matti_virtanen",
  "email": "matti.virtanen@example.com",
  "pinHash": "$2a$10$abcdefgh...",
  "fullName": "Matti Virtanen",
  "phone": "+358401234567",
  "role": "family",
  "authorizedClients": ["mom"],
  "telegramChatId": "123456789",
  "isActive": true,
  "createdAt": "2025-01-01T00:00:00Z"
}
```

---

### **2. JWT Token Claims:**

```csharp
public class JwtClaims
{
    public string UserId { get; set; }          // "matti_virtanen"
    public string Email { get; set; }           // "matti.virtanen@example.com"
    public string FullName { get; set; }        // "Matti Virtanen"
    public string Role { get; set; }            // "family"
    public List<string> Clients { get; set; }   // ["mom"]
    public DateTime Issued { get; set; }        // Token luontiaika
    public DateTime Expires { get; set; }       // Token vanhentumisaika (7 päivää)
}
```

**JWT Payload (esimerkki):**
```json
{
  "sub": "matti_virtanen",
  "email": "matti.virtanen@example.com",
  "name": "Matti Virtanen",
  "role": "family",
  "clients": ["mom"],
  "iat": 1704067200,
  "exp": 1704672000
}
```

---

## 🔌 **API ENDPOINTS:**

### **AuthAPI:**

```csharp
// 1. Login (POST /api/auth/login)
[Function("AuthLogin")]
public async Task<HttpResponseData> Login(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/login")] 
    HttpRequestData req)

Request Body:
{
  "email": "matti.virtanen@example.com",
  "pin": "1234"
}

Response (200 OK):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "matti_virtanen",
    "fullName": "Matti Virtanen",
    "email": "matti.virtanen@example.com",
    "role": "family",
    "authorizedClients": ["mom"]
  },
  "expiresAt": "2025-01-14T12:00:00Z"
}

Response (401 Unauthorized):
{
  "success": false,
  "error": "Invalid email or PIN"
}
```

```csharp
// 2. Register (POST /api/auth/register)
[Function("AuthRegister")]
public async Task<HttpResponseData> Register(
    [HttpTrigger(AuthorizationLevel.Function, "post", Route = "auth/register")] 
    HttpRequestData req)

Request Body:
{
  "email": "liisa.korhonen@example.com",
  "pin": "5678",
  "fullName": "Liisa Korhonen",
  "phone": "+358409876543",
  "role": "family",
  "authorizedClients": ["mom"]
}

Response (201 Created):
{
  "success": true,
  "userId": "liisa_korhonen",
  "message": "User created successfully"
}

Response (409 Conflict):
{
  "success": false,
  "error": "Email already exists"
}
```

```csharp
// 3. Validate Token (POST /api/auth/validate)
[Function("AuthValidate")]
public async Task<HttpResponseData> ValidateToken(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/validate")] 
    HttpRequestData req)

Request Headers:
Authorization: Bearer <token>

Response (200 OK):
{
  "valid": true,
  "user": {
    "userId": "matti_virtanen",
    "authorizedClients": ["mom"]
  }
}

Response (401 Unauthorized):
{
  "valid": false,
  "error": "Invalid or expired token"
}
```

```csharp
// 4. Refresh Token (POST /api/auth/refresh)
[Function("AuthRefresh")]
public async Task<HttpResponseData> RefreshToken(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "auth/refresh")] 
    HttpRequestData req)

Request Headers:
Authorization: Bearer <old_token>

Response (200 OK):
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-01-21T12:00:00Z"
}
```

---

### **ReminderAPI (päivitetty autentikoinnilla):**

```csharp
// GET /ReminderAPI?clientID=mom
[Function("ReminderAPI")]
public async Task<HttpResponseData> GetReminders(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "ReminderAPI")] 
    HttpRequestData req)

Request Headers:
Authorization: Bearer <token>

Request Query:
?clientID=mom

Flow:
1. Validoi JWT token
2. Pura token → saa authorizedClients listaa
3. Tarkista: onko "mom" authorizedClients-listalla?
4. Jos kyllä → palauta data
5. Jos ei → 403 Forbidden

Response (403 Forbidden):
{
  "success": false,
  "error": "Access denied to client 'mom'",
  "message": "You are not authorized to view this client's data"
}
```

---

## 🔐 **JWT IMPLEMENTAATIO:**

### **1. JWT Service (C#):**

```csharp
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

public class JwtService
{
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;

    public JwtService(string secretKey, string issuer = "ReminderApp", string audience = "ReminderApp")
    {
        _secretKey = secretKey;
        _issuer = issuer;
        _audience = audience;
    }

    public string GenerateToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_secretKey);
        
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("clients", string.Join(",", user.AuthorizedClients))
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = _issuer,
            Audience = _audience,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_secretKey);
            
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
            return principal;
        }
        catch
        {
            return null;
        }
    }

    public List<string> GetAuthorizedClients(ClaimsPrincipal principal)
    {
        var clientsClaim = principal.FindFirst("clients")?.Value;
        return clientsClaim?.Split(',').ToList() ?? new List<string>();
    }
}
```

---

### **2. Authorization Middleware:**

```csharp
public class AuthorizationMiddleware
{
    private readonly JwtService _jwtService;
    private readonly ILogger _logger;

    public AuthorizationMiddleware(JwtService jwtService, ILogger logger)
    {
        _jwtService = jwtService;
        _logger = logger;
    }

    public async Task<(bool authorized, string? error, ClaimsPrincipal? principal)> 
        ValidateRequest(HttpRequestData req, string clientId)
    {
        // 1. Hae Authorization header
        if (!req.Headers.TryGetValues("Authorization", out var authHeaders))
        {
            return (false, "Missing Authorization header", null);
        }

        var authHeader = authHeaders.FirstOrDefault();
        if (string.IsNullOrEmpty(authHeader) || !authHeader.StartsWith("Bearer "))
        {
            return (false, "Invalid Authorization header format", null);
        }

        var token = authHeader.Substring("Bearer ".Length).Trim();

        // 2. Validoi JWT token
        var principal = _jwtService.ValidateToken(token);
        if (principal == null)
        {
            return (false, "Invalid or expired token", null);
        }

        // 3. Hae authorized clients
        var authorizedClients = _jwtService.GetAuthorizedClients(principal);

        // 4. Tarkista clientID-oikeus
        if (!authorizedClients.Contains(clientId))
        {
            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogWarning(
                "User {UserId} attempted to access unauthorized client {ClientId}. " +
                "Authorized: [{AuthorizedClients}]",
                userId, clientId, string.Join(", ", authorizedClients));
            
            return (false, $"Access denied to client '{clientId}'", null);
        }

        // ✅ Kaikki OK
        return (true, null, principal);
    }
}
```

---

### **3. PIN Hashing (BCrypt):**

```csharp
using BCrypt.Net;

public class PasswordService
{
    public string HashPin(string pin)
    {
        return BCrypt.HashPassword(pin, BCrypt.GenerateSalt(10));
    }

    public bool VerifyPin(string pin, string hash)
    {
        return BCrypt.Verify(pin, hash);
    }
}

// Käyttö:
var passwordService = new PasswordService();
var pinHash = passwordService.HashPin("1234");
// Tallenna pinHash Cosmos DB:hen

// Login-aikana:
var isValid = passwordService.VerifyPin(userInputPin, storedPinHash);
```

---

## 🎨 **PWA LOGIN UI (Blazor):**

### **LoginPage.razor:**

```razor
@page "/login"
@inject HttpClient Http
@inject NavigationManager Navigation
@inject IJSRuntime JS

<div class="login-container">
    <div class="login-card">
        <h2>🔒 Kirjaudu</h2>
        
        @if (!string.IsNullOrEmpty(_errorMessage))
        {
            <div class="alert alert-danger">
                @_errorMessage
            </div>
        }

        <EditForm Model="@_loginModel" OnValidSubmit="@HandleLogin">
            <DataAnnotationsValidator />
            
            <div class="form-group">
                <label>Sähköposti:</label>
                <InputText @bind-Value="_loginModel.Email" 
                          class="form-control" 
                          placeholder="esim. matti@example.com" />
                <ValidationMessage For="@(() => _loginModel.Email)" />
            </div>

            <div class="form-group">
                <label>PIN-koodi:</label>
                <InputText @bind-Value="_loginModel.Pin" 
                          type="password" 
                          class="form-control" 
                          placeholder="4-6 numeroa" 
                          maxlength="6" />
                <ValidationMessage For="@(() => _loginModel.Pin)" />
            </div>

            <button type="submit" class="btn btn-primary" disabled="@_isLoading">
                @if (_isLoading)
                {
                    <span class="spinner-border spinner-border-sm"></span>
                    <span> Kirjaudutaan...</span>
                }
                else
                {
                    <span>Kirjaudu</span>
                }
            </button>
        </EditForm>
    </div>
</div>

@code {
    private LoginModel _loginModel = new();
    private string? _errorMessage;
    private bool _isLoading;

    private async Task HandleLogin()
    {
        _isLoading = true;
        _errorMessage = null;

        try
        {
            var response = await Http.PostAsJsonAsync(
                "https://reminderapp-functions.azurewebsites.net/api/auth/login",
                _loginModel);

            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
                
                // Tallenna token LocalStorage:en
                await JS.InvokeVoidAsync("localStorage.setItem", "authToken", result.Token);
                await JS.InvokeVoidAsync("localStorage.setItem", "user", 
                    JsonSerializer.Serialize(result.User));

                // Siirry client-valintaan
                Navigation.NavigateTo("/select-client");
            }
            else
            {
                var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
                _errorMessage = error?.Error ?? "Kirjautuminen epäonnistui";
            }
        }
        catch (Exception ex)
        {
            _errorMessage = $"Virhe: {ex.Message}";
        }
        finally
        {
            _isLoading = false;
        }
    }

    public class LoginModel
    {
        [Required(ErrorMessage = "Sähköposti vaaditaan")]
        [EmailAddress(ErrorMessage = "Virheellinen sähköpostiosoite")]
        public string Email { get; set; } = "";

        [Required(ErrorMessage = "PIN-koodi vaaditaan")]
        [RegularExpression(@"^\d{4,6}$", ErrorMessage = "PIN tulee olla 4-6 numeroa")]
        public string Pin { get; set; } = "";
    }

    public class LoginResponse
    {
        public bool Success { get; set; }
        public string Token { get; set; } = "";
        public UserInfo User { get; set; } = new();
        public DateTime ExpiresAt { get; set; }
    }

    public class UserInfo
    {
        public string UserId { get; set; } = "";
        public string FullName { get; set; } = "";
        public List<string> AuthorizedClients { get; set; } = new();
    }

    public class ErrorResponse
    {
        public string Error { get; set; } = "";
    }
}
```

---

### **ClientSelectPage.razor:**

```razor
@page "/select-client"
@inject HttpClient Http
@inject NavigationManager Navigation
@inject IJSRuntime JS

<div class="client-select-container">
    <h2>Valitse asiakas</h2>
    
    <div class="client-list">
        @foreach (var client in _clients)
        {
            <div class="client-card" @onclick="() => SelectClient(client.ClientId)">
                <div class="client-avatar">
                    @GetInitials(client.FullName)
                </div>
                <div class="client-info">
                    <h3>@client.FullName</h3>
                    <p>@client.PreferredName</p>
                </div>
            </div>
        }
    </div>
</div>

@code {
    private List<ClientInfo> _clients = new();

    protected override async Task OnInitializedAsync()
    {
        var userJson = await JS.InvokeAsync<string>("localStorage.getItem", "user");
        var user = JsonSerializer.Deserialize<UserInfo>(userJson);
        
        // Hae client-tiedot jokaiselle authorizedClient:lle
        foreach (var clientId in user.AuthorizedClients)
        {
            var token = await JS.InvokeAsync<string>("localStorage.getItem", "authToken");
            Http.DefaultRequestHeaders.Authorization = 
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            
            var client = await Http.GetFromJsonAsync<ClientInfo>(
                $"https://reminderapp-functions.azurewebsites.net/api/client/{clientId}");
            
            if (client != null)
                _clients.Add(client);
        }
    }

    private void SelectClient(string clientId)
    {
        Navigation.NavigateTo($"/client/{clientId}");
    }

    private string GetInitials(string fullName)
    {
        var parts = fullName.Split(' ');
        if (parts.Length >= 2)
            return $"{parts[0][0]}{parts[1][0]}".ToUpper();
        return fullName.Length > 0 ? fullName[0].ToString().ToUpper() : "?";
    }

    public class ClientInfo
    {
        public string ClientId { get; set; } = "";
        public string FullName { get; set; } = "";
        public string PreferredName { get; set; } = "";
    }
}
```

---

## 🛠️ **ADMIN UI (Käyttäjähallinta):**

### **Admin-sivut:**

1. **`/admin/users`** - Lista käyttäjistä
   - Näytä: userId, email, fullName, role, authorizedClients
   - Toiminnot: Muokkaa, Poista, Aktivoi/Deaktivoi

2. **`/admin/users/create`** - Luo uusi käyttäjä
   - Syötä: email, PIN, fullName, role
   - Valitse: authorizedClients (multi-select)

3. **`/admin/users/{userId}/edit`** - Muokkaa käyttäjää
   - Muuta: fullName, role, authorizedClients
   - Vaihda: PIN

4. **`/admin/access-log`** - Kirjautumishistoria
   - Näytä: userId, clientId, timestamp, action

---

## 🔄 **MIGRAATIO-OHJE:**

### **Vaihe 1: Luo Users-container**
```bash
az cosmosdb sql container create \
  --account-name reminderapp-cosmos2025 \
  --resource-group ReminderApp-RG \
  --database-name ReminderAppDB \
  --name Users \
  --partition-key-path "/userId"
```

### **Vaihe 2: Luo ensimmäinen admin-käyttäjä**
```json
{
  "id": "user_admin",
  "userId": "admin",
  "email": "admin@reminderapp.com",
  "pinHash": "$2a$10$...",
  "fullName": "System Admin",
  "role": "admin",
  "authorizedClients": ["*"],
  "isActive": true
}
```

### **Vaihe 3: Luo perheenjäsenet**
```json
{
  "id": "user_matti_virtanen",
  "userId": "matti_virtanen",
  "email": "matti.virtanen@example.com",
  "pinHash": "$2a$10$...",
  "fullName": "Matti Virtanen",
  "role": "family",
  "authorizedClients": ["mom"]
}
```

### **Vaihe 4: Deploy AuthAPI**
- Lisää `AuthAPI.cs` Functions-projektiin
- Lisää JWT NuGet-paketit
- Lisää `JWT_SECRET_KEY` App Settings:eihin

### **Vaihe 5: Päivitä ReminderAPI**
- Lisää Authorization Middleware
- Vaadi JWT token kaikissa GET/POST-kutsuissa

### **Vaihe 6: Päivitä PWA**
- Lisää Login-sivu
- Lisää Client-valintasivu
- Lisää token LocalStorage:en
- Lisää Authorization header kaikkiin API-kutsuihin

---

## 🔒 **TIETOTURVA-CHECKLIST:**

- [ ] JWT secret key on 256-bit satunnainen merkkijono
- [ ] JWT secret tallennettu Azure Key Vaultiin (ei App Settingsiin)
- [ ] PIN hashattu BCrypt:llä (work factor 10+)
- [ ] Token vanhentuu 7 päivässä
- [ ] HTTPS pakollinen (HTTP estetty)
- [ ] CORS rajoitettu oikeisiin origin-osoitteisiin
- [ ] Rate limiting login-endpointille (max 5 yritystä / 15 min)
- [ ] Audit log kirjautumisista ja epäonnistuneista yrityksistä
- [ ] Admin-toiminnot vaativat admin-roolin
- [ ] Poistetut käyttäjät merkitään `isActive=false` (ei poisteta fyysisesti)

---

## 📊 **ROOLIT & OIKEUDET:**

| Rooli | Oikeudet | Esimerkki |
|-------|----------|-----------|
| **family** | Pääsy omiin sukulaisiin | Matti näkee äitinsä (mom) |
| **caregiver** | Pääsy useaan asiakkaaseen | Hoitaja näkee kaikki asiakkaansa |
| **admin** | Täydet oikeudet + käyttäjähallinta | Järjestelmän ylläpitäjä |

---

## ⚡ **SUORITUSKYKY:**

- JWT validointi: ~1-5ms per pyyntö
- BCrypt hash tarkistus: ~100ms per login
- Token expiration: 7 päivää (vähemmän DB-kutsuja)
- LocalStorage: Token ja user-info cachettu selaimeen

---

## 🧪 **TESTAUS:**

### **Testiskenaarioita:**

1. **Login onnistuu oikeilla tunnuksilla**
   - Input: email + oikea PIN
   - Output: Token + authorizedClients lista

2. **Login epäonnistuu väärällä PIN:llä**
   - Input: email + väärä PIN
   - Output: 401 Unauthorized

3. **API hylkää pyynnön ilman tokenia**
   - Input: GET /ReminderAPI ilman Authorization headeria
   - Output: 401 Unauthorized

4. **API hylkää pyynnön vanhentuneella tokenilla**
   - Input: GET /ReminderAPI + vanhentunut token
   - Output: 401 Unauthorized

5. **API hylkää pyynnön ei-auktorisoidulle clientille**
   - Input: GET /ReminderAPI?clientID=dad + token (vain "mom" sallittu)
   - Output: 403 Forbidden

6. **Multi-client access toimii**
   - User: authorized ["mom", "uncle_john"]
   - Output: Voi vaihtaa molempien välillä

---

## 📚 **DOKUMENTAATIO:**

- **USER-GUIDE.md** - Käyttöohje loppukäyttäjille
- **ADMIN-GUIDE.md** - Ylläpito-ohje
- **API-REFERENCE.md** - API-dokumentaatio

---

## 🎯 **TOTEUTUSJÄRJESTYS:**

1. ✅ **Tietomallit** (Users, JWT claims)
2. ✅ **JWT Service** (token generation & validation)
3. ✅ **AuthAPI** (login, register, validate)
4. ✅ **Authorization Middleware** (ReminderAPI-suojaus)
5. ✅ **PWA Login-sivu**
6. ✅ **PWA Client-valintasivu**
7. ✅ **Testing**
8. ⏳ **Admin UI** (käyttäjähallinta)

---

## 💡 **TULEVAISUUDEN PARANNUKSET:**

- 🔐 **Azure AD B2C** - Enterprise-tason autentikointi
- 📱 **2FA** - Kaksivaiheinen tunnistautuminen (SMS/TOTP)
- 🔑 **Biometric** - Sormenjälki/FaceID
- 📧 **Email verification** - Sähköpostin vahvistus rekisteröinnissä
- 🔄 **Social login** - Google/Facebook/Microsoft kirjautuminen
- 🚨 **Alert notifications** - Ilmoitus epäilyttävästä toiminnasta
- 📊 **Analytics** - Käyttötilastot ja turvallisuusraportit

---

**Viimeksi päivitetty:** 2025-10-07  
**Status:** 📋 Suunnitelma (Prioriteetti: Kriittinen)

