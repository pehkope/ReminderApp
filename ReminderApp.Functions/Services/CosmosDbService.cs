using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Logging;
using ReminderApp.Functions.Models;
using System.Text.Json;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace ReminderApp.Functions.Services;

public class CosmosDbService
{
    private readonly CosmosClient? _cosmosClient;
    private readonly Database? _database;
    private readonly string _databaseId;
    private readonly ILogger _logger;

    public CosmosDbService(ILoggerFactory loggerFactory)
    {
        _logger = loggerFactory.CreateLogger<CosmosDbService>();
        
        var connectionString = Environment.GetEnvironmentVariable("COSMOS_CONNECTION_STRING");
        _databaseId = Environment.GetEnvironmentVariable("COSMOS_DATABASE") ?? "ReminderAppDB";

        if (!string.IsNullOrEmpty(connectionString))
        {
            try
            {
                // Configure Cosmos SDK to use Newtonsoft.Json with camelCase
                var options = new CosmosClientOptions
                {
                    SerializerOptions = new CosmosSerializationOptions
                    {
                        PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
                    }
                };
                
                _cosmosClient = new CosmosClient(connectionString, options);
                _database = _cosmosClient.GetDatabase(_databaseId);
                _logger.LogInformation("CosmosDB initialized with camelCase serialization");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize Cosmos DB: {ErrorMessage}", ex.Message);
            }
        }
    }

    public bool IsConfigured => _cosmosClient != null && _database != null;

    private Container? GetContainer(string containerName)
    {
        return _database?.GetContainer(containerName);
    }

    // Photo operations
    public async Task<List<Photo>> GetPhotosAsync(string clientId)
    {
        if (!IsConfigured)
        {
            Console.WriteLine("[GetPhotosAsync] CosmosDB not configured!");
            return new List<Photo>();
        }

        try
        {
            var container = GetContainer("Photos");
            if (container == null)
            {
                Console.WriteLine("[GetPhotosAsync] Container is null!");
                return new List<Photo>();
            }

            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.clientId = @clientId")
                .WithParameter("@clientId", clientId);
            
            var iterator = container.GetItemQueryIterator<Photo>(query);
            var results = new List<Photo>();
            
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
            }

            Console.WriteLine($"✅ Fetched {results.Count} photos for {clientId}");
            return results;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error fetching photos for {clientId}: {ex.Message}");
            return new List<Photo>();
        }
    }

    public async Task<Photo?> GetDailyPhotoAsync(string clientId, int rotationDays = 1)
    {
        var photos = await GetPhotosAsync(clientId);
        
        if (!photos.Any())
        {
            return null;
        }

        // Prioritize Telegram photos (have BlobUrl), then fallback to Google Drive
        // TÄRKEÄ: Järjestä AINA samalla tavalla ID:n mukaan, jotta lista pysyy stabiilina
        var blobPhotos = photos.Where(p => !string.IsNullOrEmpty(p.BlobUrl))
            .OrderBy(p => p.Id) // Stabiili järjestys ID:n mukaan
            .ToList();
        
        // Jos Google Drive kuvia (ei BlobUrl), lisää nekin rotaatioon
        var drivePhotos = photos.Where(p => string.IsNullOrEmpty(p.BlobUrl))
            .OrderBy(p => p.Id) // Stabiili järjestys
            .ToList();
        var allPhotos = blobPhotos.Concat(drivePhotos).ToList();

        if (!allPhotos.Any())
        {
            return null;
        }

        // Laske päiväkohtainen indeksi rotaatiovälin mukaan
        // PARANNUS: Käytä DayOfYear + Year yhdistelmää jotta rotaatio jatkuu vuosien yli
        var today = DateTime.Now;
        var daysSinceEpoch = (int)(today - new DateTime(2025, 1, 1)).TotalDays; // Päivät vuoden 2025 alusta
        var rotationPeriod = daysSinceEpoch / rotationDays;
        
        // TÄRKEÄ: photoIndex lasketaan AINA samaan tapaan riippumatta kuvamäärästä
        // Jos uusia kuvia tulee, ne lisätään LOPPUUN, vanha rotaatio jatkuu
        var photoIndex = rotationPeriod % allPhotos.Count;

        var selectedPhoto = allPhotos[photoIndex];
        
        var photoType = !string.IsNullOrEmpty(selectedPhoto.BlobUrl) ? "Telegram" : "Google Drive";
        _logger.LogInformation("📸 Selected {PhotoType} photo for {ClientId} (rotation: {RotationDays} days, day: {Day}, index: {Index}/{Total}): {PhotoId}", 
            photoType, clientId, rotationDays, daysSinceEpoch, photoIndex + 1, allPhotos.Count, selectedPhoto.Id);
        
        return selectedPhoto;
    }

    // Reminder operations
    public async Task<List<Reminder>> GetRemindersAsync(string clientId)
    {
        if (!IsConfigured) return new List<Reminder>();

        try
        {
            var container = GetContainer("Clients"); // Legacy support - reminders stored in Clients container
            if (container == null) return new List<Reminder>();

            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.clientId = @clientId AND c.type = 'reminder'")
                .WithParameter("@clientId", clientId);

            var iterator = container.GetItemQueryIterator<Reminder>(query);
            var results = new List<Reminder>();

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
            }

            return results;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching reminders for {clientId}: {ex.Message}");
            return new List<Reminder>();
        }
    }

    // Appointment operations
    public async Task<List<Appointment>> GetUpcomingAppointmentsAsync(string clientId, int daysAhead = 7)
    {
        if (!IsConfigured) return new List<Appointment>();

        try
        {
            var container = GetContainer("Appointments");
            if (container == null) return new List<Appointment>();

            var today = DateTime.Today.ToString("yyyy-MM-dd");
            var nextWeek = DateTime.Today.AddDays(daysAhead).ToString("yyyy-MM-dd");

            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.clientId = @clientId AND c.date >= @today AND c.date <= @nextWeek ORDER BY c.date, c.time")
                .WithParameter("@clientId", clientId)
                .WithParameter("@today", today)
                .WithParameter("@nextWeek", nextWeek);

            var iterator = container.GetItemQueryIterator<Appointment>(query);
            var results = new List<Appointment>();

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
            }

            return results;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching appointments for {clientId}: {ex.Message}");
            return new List<Appointment>();
        }
    }

    // Food operations
    public async Task<List<Food>> GetTodaysFoodsAsync(string clientId)
    {
        if (!IsConfigured) return new List<Food>();

        try
        {
            var container = GetContainer("Foods");
            if (container == null) return new List<Food>();

            var today = DateTime.Today.ToString("yyyy-MM-dd");

            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.clientId = @clientId AND c.date = @today ORDER BY c.timeSlot")
                .WithParameter("@clientId", clientId)
                .WithParameter("@today", today);

            var iterator = container.GetItemQueryIterator<Food>(query);
            var results = new List<Food>();

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
            }

            return results;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching foods for {clientId}: {ex.Message}");
            return new List<Food>();
        }
    }

    // Medication operations
    public async Task<List<Medication>> GetTodaysMedicationsAsync(string clientId)
    {
        if (!IsConfigured) return new List<Medication>();

        try
        {
            var container = GetContainer("Medications");
            if (container == null) return new List<Medication>();

            var today = DateTime.Today.ToString("yyyy-MM-dd");

            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.clientId = @clientId AND (c.date = @today OR c.recurring = true) ORDER BY c.time")
                .WithParameter("@clientId", clientId)
                .WithParameter("@today", today);

            var iterator = container.GetItemQueryIterator<Medication>(query);
            var results = new List<Medication>();

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
            }

            return results;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching medications for {clientId}: {ex.Message}");
            return new List<Medication>();
        }
    }

    // Create operations
    public async Task<T?> CreateItemAsync<T>(T item, string containerName) where T : class
    {
        if (!IsConfigured)
        {
            _logger.LogError("❌ CosmosDB not configured - cannot create item in {ContainerName}", containerName);
            return null;
        }

        try
        {
            var container = GetContainer(containerName);
            if (container == null)
            {
                _logger.LogError("❌ Container {ContainerName} not found", containerName);
                return null;
            }

            _logger.LogInformation("📝 Creating item in {ContainerName}...", containerName);
            var response = await container.CreateItemAsync(item);
            _logger.LogInformation("✅ Item created successfully in {ContainerName}", containerName);
            return response.Resource;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error creating item in {ContainerName}: {ErrorMessage}", containerName, ex.Message);
            _logger.LogError("❌ Exception type: {ExceptionType}", ex.GetType().Name);
            if (ex.InnerException != null)
            {
                _logger.LogError("❌ Inner exception: {InnerMessage}", ex.InnerException.Message);
            }
            return null;
        }
    }

    // Generic query method
    public async Task<List<T>> QueryItemsAsync<T>(string containerName, QueryDefinition query) where T : class
    {
        if (!IsConfigured) return new List<T>();

        try
        {
            var container = GetContainer(containerName);
            if (container == null) return new List<T>();

            var iterator = container.GetItemQueryIterator<T>(query);
            var results = new List<T>();

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
            }

            return results;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error querying {containerName}: {ex.Message}");
            return new List<T>();
        }
    }

    // Greeting Messages operations (VANHA - tuntikohtainen)
    public async Task<GreetingMessage?> GetGreetingMessageAsync(string clientId, int hour)
    {
        if (!IsConfigured) return null;

        try
        {
            var container = GetContainer("Messages");
            if (container == null) return null;

            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.clientId = @clientId AND c.hour = @hour AND c.isActive = true")
                .WithParameter("@clientId", clientId)
                .WithParameter("@hour", hour);

            var iterator = container.GetItemQueryIterator<GreetingMessage>(query);
            
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                var message = response.FirstOrDefault();
                if (message != null)
                {
                    Console.WriteLine($"✅ Found greeting message for {clientId} at hour {hour}");
                    return message;
                }
            }

            Console.WriteLine($"⚠️ No greeting message found for {clientId} at hour {hour}");
            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error fetching greeting message for {clientId} at hour {hour}: {ex.Message}");
            return null;
        }
    }

    // UUSI: Hae inspiroiva viesti (timeOfDay + weather-pohjainen)
    public async Task<List<MessageCard>> GetMessageCardsAsync(string clientId, string timeOfDay, string weatherCondition)
    {
        if (!IsConfigured) return new List<MessageCard>();

        try
        {
            var container = GetContainer("Messages");
            if (container == null) return new List<MessageCard>();

            // Hae viestit jotka sopivat aikaan JA säähän TAI ovat "any" sään osalta
            var query = new QueryDefinition(
                @"SELECT * FROM c 
                  WHERE c.clientId = @clientId 
                  AND c.timeOfDay = @timeOfDay 
                  AND (c.weatherCondition = @weatherCondition OR c.weatherCondition = 'any')
                  AND c.isActive = true")
                .WithParameter("@clientId", clientId)
                .WithParameter("@timeOfDay", timeOfDay)
                .WithParameter("@weatherCondition", weatherCondition);

            var iterator = container.GetItemQueryIterator<MessageCard>(query);
            var results = new List<MessageCard>();
            
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
            }

            _logger.LogInformation("📬 Found {Count} message cards for {ClientId} at {TimeOfDay} with {Weather}", 
                results.Count, clientId, timeOfDay, weatherCondition);

            return results;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error fetching message cards for {ClientId} at {TimeOfDay} with {Weather}", 
                clientId, timeOfDay, weatherCondition);
            return new List<MessageCard>();
        }
    }

    // Weather Cache operations
    public async Task<WeatherCache?> GetWeatherCacheAsync(string location)
    {
        if (!IsConfigured) return null;

        try
        {
            var container = GetContainer("WeatherCache");
            if (container == null) return null;

            var id = $"weather_{location.Replace(",", "_").Replace(" ", "")}";
            
            var response = await container.ReadItemAsync<WeatherCache>(id, new PartitionKey(location));
            var cache = response.Resource;

            // Tarkista onko cache vanhentunut
            if (cache.ExpiresAt < DateTime.UtcNow)
            {
                _logger.LogInformation("🌤️ Weather cache expired for {Location}", location);
                return null;
            }

            _logger.LogInformation("✅ Weather cache hit for {Location} (fetched {MinutesAgo} minutes ago)", 
                location, (DateTime.UtcNow - cache.FetchedAt).TotalMinutes);
            
            return cache;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            _logger.LogInformation("🌤️ No weather cache found for {Location}", location);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error fetching weather cache for {Location}", location);
            return null;
        }
    }

    public async Task<bool> SaveWeatherCacheAsync(WeatherCache weatherCache)
    {
        if (!IsConfigured) return false;

        try
        {
            var container = GetContainer("WeatherCache");
            if (container == null) return false;

            await container.UpsertItemAsync(weatherCache, new PartitionKey(weatherCache.Location));
            
            _logger.LogInformation("✅ Weather cache saved for {Location} (expires in {Hours} hours)", 
                weatherCache.Location, (weatherCache.ExpiresAt - DateTime.UtcNow).TotalHours);
            
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error saving weather cache for {Location}", weatherCache.Location);
            return false;
        }
    }

    // Get client settings
    public async Task<Client?> GetClientAsync(string clientId)
    {
        if (!IsConfigured) return null;

        try
        {
            var container = GetContainer("Clients");
            if (container == null) return null;

            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.clientId = @clientId AND c.type = 'client'")
                .WithParameter("@clientId", clientId);

            var iterator = container.GetItemQueryIterator<Client>(query);
            
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                var client = response.FirstOrDefault();
                if (client != null) return client;
            }

            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching client {clientId}: {ex.Message}");
            return null;
        }
    }
}
