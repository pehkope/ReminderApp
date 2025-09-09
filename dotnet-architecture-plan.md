# ReminderApp .NET/Blazor Arkkitehtuuri

## 🎯 Siirtymä Node.js:stä .NET:iin

### Nykyinen tilanne:
- ✅ PWA: Blazor (toimii hyvin)
- 🔄 API: Node.js Azure Functions → .NET Azure Functions
- 🆕 Admin UI: Ei vielä → Blazor Server/WASM

## 🏗️ Uusi .NET Stack:

### 1. Azure Functions (.NET 8 Isolated)
```
ReminderApp.Functions/
├── ReminderApi.cs          // GET/POST reminders
├── PhotoUploadApi.cs       // Multipart file upload
├── TelegramWebhook.cs      // Telegram bot integration
├── Models/
│   ├── ReminderApiResponse.cs
│   ├── PhotoMetadata.cs
│   └── ClientConfiguration.cs
├── Services/
│   ├── CosmosDbService.cs
│   ├── BlobStorageService.cs
│   ├── GoogleSheetsService.cs
│   └── TelegramService.cs
└── host.json
```

### 2. Shared Libraries
```
ReminderApp.Shared/
├── Models/           // Jaetut mallit PWA:n ja API:n välillä
├── Services/         // HTTP client wrappers
└── Extensions/       // Helper methods
```

### 3. Family Admin App (Blazor Server)
```
ReminderApp.Admin/
├── Pages/
│   ├── Clients/
│   │   ├── Index.razor     // Asiakaslistaus
│   │   └── Edit.razor      // Asiakkaan muokkaus
│   ├── Photos/
│   │   ├── Gallery.razor   // Valokuvagalleria
│   │   └── Upload.razor    // Kuvien upload
│   ├── Foods/
│   │   └── Manage.razor    // Ruoka-aikataulut
│   └── Appointments/
│       └── Calendar.razor  // Tapaamisten hallinta
├── Services/
│   └── AdminApiService.cs  // API calls
└── Program.cs
```

## 📦 NuGet Packages:

### Azure Functions:
```xml
<PackageReference Include="Microsoft.Azure.Functions.Worker" Version="1.21.0" />
<PackageReference Include="Microsoft.Azure.Functions.Worker.Sdk" Version="1.16.4" />
<PackageReference Include="Microsoft.Azure.Functions.Worker.Extensions.Http" Version="3.1.0" />
<PackageReference Include="Microsoft.Azure.Cosmos" Version="3.38.1" />
<PackageReference Include="Azure.Storage.Blobs" Version="12.19.1" />
<PackageReference Include="Google.Apis.Sheets.v4" Version="1.68.0.3421" />
<PackageReference Include="Telegram.Bot" Version="19.0.0" />
```

### Blazor Admin:
```xml
<PackageReference Include="Microsoft.AspNetCore.Components.Web" Version="8.0.0" />
<PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly" Version="8.0.0" />
<PackageReference Include="Blazorise.Bootstrap5" Version="1.5.1" />
<PackageReference Include="Blazorise.Icons.FontAwesome" Version="1.5.1" />
```

## 🔄 Migraatiosuunnitelma:

### Vaihe 1: .NET Azure Functions
1. **Luo uusi .NET Functions projekti**
2. **ReminderApi.cs** - porttaa Node.js koodi
3. **PhotoUploadApi.cs** - multipart file handling
4. **Testaa rinnakkain** Node.js version kanssa

### Vaihe 2: Services
1. **CosmosDbService.cs** - CRUD operaatiot
2. **BlobStorageService.cs** - file upload/download
3. **GoogleSheetsService.cs** - fallback photos

### Vaihe 3: Admin UI
1. **Blazor Server projekti** omaisille
2. **Photo gallery** - näytä ja hallinnoi kuvia
3. **Client management** - asiakkaiden tiedot
4. **Food/medication scheduling**

### Vaihe 4: Telegram Bot
1. **TelegramWebhook.cs** - webhook endpoint
2. **Photo handling** - Telegram → Blob Storage
3. **User mapping** - Telegram user → Client

## 💡 .NET Azure Functions esimerkki:

### ReminderApi.cs:
```csharp
[Function("ReminderApi")]
public async Task<HttpResponseData> GetReminders(
    [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = "api/ReminderAPI")] 
    HttpRequestData req)
{
    var clientId = req.Query["clientID"] ?? "default";
    
    // Cosmos DB query
    var reminders = await _cosmosService.GetRemindersAsync(clientId);
    
    // Get daily photo
    var photo = await _cosmosService.GetDailyPhotoAsync(clientId) 
                ?? await _googleSheetsService.GetFallbackPhotoAsync(clientId);
    
    var response = new ReminderApiResponse
    {
        ClientID = clientId,
        Success = true,
        DailyPhotoUrl = photo?.BlobUrl ?? photo?.Url,
        DailyPhotoCaption = photo?.Caption,
        // ... muut kentät
    };
    
    return await req.CreateJsonResponseAsync(response);
}
```

### PhotoUploadApi.cs:
```csharp
[Function("PhotoUpload")]
public async Task<HttpResponseData> UploadPhoto(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/photos/upload")] 
    HttpRequestData req)
{
    var form = await req.ReadFormAsync();
    var clientId = form["clientId"];
    var photoFile = form.Files["photo"];
    
    // Upload to Blob Storage
    var blobUrl = await _blobService.UploadPhotoAsync(photoFile, clientId);
    
    // Save metadata to Cosmos
    var metadata = new PhotoMetadata
    {
        ClientId = clientId,
        BlobUrl = blobUrl,
        Caption = form["caption"],
        UploadedAt = DateTime.UtcNow
    };
    
    await _cosmosService.SavePhotoMetadataAsync(metadata);
    
    return await req.CreateJsonResponseAsync(new { Success = true, BlobUrl = blobUrl });
}
```

## 🎯 Edut .NET:llä:

1. **Nopea kehitys** - tunnet kielen
2. **Vahva typing** - vähemmän runtime-virheitä  
3. **Shared models** - sama koodi PWA:ssa ja API:ssa
4. **Visual Studio** - parempi debugging
5. **Azure integraatio** - native Microsoft SDKs
6. **Blazor Admin** - sama teknologia kuin PWA

## 🤔 Huomioitavaa:

1. **Cold start** - .NET Functions hieman hitaampi kuin Node.js
2. **Memory usage** - .NET käyttää enemmän muistia
3. **Node.js investointi** - menetät jo tehty työ

## 💭 Suositus:

**Kyllä, siirry .NET:iin!** Syyt:
- Sinun osaaminen on tärkein
- Blazor PWA toimii jo hyvin
- Admin UI helpompi Blazorilla
- Yhtenäinen teknologia-stack
- Parempi pitkän aikavälin ylläpito

**Aloitetaanko .NET Azure Functions:lla?**
