using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using ReminderApp.Functions.Models;
using ReminderApp.Functions.Services;
using System.Net;
using System.Text.Json;

namespace ReminderApp.Functions;

public class ReminderApi
{
    private readonly ILogger _logger;
    private readonly CosmosDbService _cosmosDbService;
    private readonly GoogleSheetsService _googleSheetsService;
    private readonly WeatherService _weatherService;
    private readonly BlobStorageService _blobStorageService;

    public ReminderApi(ILoggerFactory loggerFactory, 
                      CosmosDbService cosmosDbService, 
                      GoogleSheetsService googleSheetsService,
                      WeatherService weatherService,
                      BlobStorageService blobStorageService)
    {
        _logger = loggerFactory.CreateLogger<ReminderApi>();
        _cosmosDbService = cosmosDbService;
        _googleSheetsService = googleSheetsService;
        _weatherService = weatherService;
        _blobStorageService = blobStorageService;
    }

    private static readonly string[] AllowedOrigins = new[]
    {
        "https://proud-mushroom-0dd372603.1.azurestaticapps.net",
        "https://localhost:5000",
        "https://localhost:5001"
    };

    [Function("ReminderApi")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", "options", Route = "reminderapi")]
        HttpRequestData req)
    // CORS fix deployed: 2025-10-01
    {
            _logger.LogInformation("ReminderAPI (.NET v2) called with method: {Method}", req.Method);

        try
        {
            if (req.Method == "OPTIONS")
            {
                return CreatePreflightResponse(req);
            }

            // Support both "client" and "clientID" for backwards compatibility
            var clientId = GetQueryParameter(req, "client") 
                        ?? GetQueryParameter(req, "clientID") 
                        ?? "default";
            _logger.LogInformation("Processing request for client: {ClientId}", clientId);

            if (req.Method == "GET")
            {
                return await HandleGetRequest(req, clientId);
            }
            else if (req.Method == "POST")
            {
                return await HandlePostRequest(req, clientId);
            }

            return await CreateErrorResponse(req, HttpStatusCode.MethodNotAllowed, "Method not allowed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing ReminderAPI request");
            return await CreateErrorResponse(req, HttpStatusCode.InternalServerError, "Internal server error", ex.Message);
        }
    }

    private async Task<HttpResponseData> HandleGetRequest(HttpRequestData req, string clientId)
    {
        _logger.LogInformation("Handling GET request for client: {ClientId}", clientId);

        // Get data from Cosmos DB (if available)
        var reminders = new List<Reminder>();
        var upcomingAppointments = new List<Appointment>();
        var todaysFoods = new List<Food>();
        var todaysMedications = new List<Medication>();
        var client = (Client?)null;
        var storageType = "in-memory";

        if (_cosmosDbService.IsConfigured)
        {
            _logger.LogInformation("Cosmos DB configured, fetching data...");
            storageType = "cosmos";

            try
            {
                // Fetch data in parallel for better performance
                var reminderTask = _cosmosDbService.GetRemindersAsync(clientId);
                var appointmentTask = _cosmosDbService.GetUpcomingAppointmentsAsync(clientId);
                var foodTask = _cosmosDbService.GetTodaysFoodsAsync(clientId);
                var medicationTask = _cosmosDbService.GetTodaysMedicationsAsync(clientId);
                var clientTask = _cosmosDbService.GetClientAsync(clientId);

                await Task.WhenAll(reminderTask, appointmentTask, foodTask, medicationTask, clientTask);

                reminders = await reminderTask;
                upcomingAppointments = await appointmentTask;
                todaysFoods = await foodTask;
                todaysMedications = await medicationTask;
                client = await clientTask;

                _logger.LogInformation("Fetched from Cosmos: {ReminderCount} reminders, {AppointmentCount} appointments, {FoodCount} foods, {MedicationCount} medications", 
                    reminders.Count, upcomingAppointments.Count, todaysFoods.Count, todaysMedications.Count);
            }
            catch (Exception cosmosEx)
            {
                _logger.LogError(cosmosEx, "Error fetching data from Cosmos DB");
                storageType = "cosmos-error";
            }
        }
        else
        {
            _logger.LogWarning("Cosmos DB not configured, using in-memory data");
        }

        // Get daily photo
        _logger.LogInformation("Fetching daily photo for client: {ClientId}", clientId);
        var photo = await GetDailyPhoto(clientId);
        
        _logger.LogInformation("Photo object is null: {IsNull}", photo == null);
        if (photo != null)
        {
            _logger.LogInformation("Photo.BlobUrl: '{BlobUrl}' (length: {Length})", photo.BlobUrl ?? "null", photo.BlobUrl?.Length ?? -1);
            _logger.LogInformation("Photo.Url: '{Url}' (length: {Length})", photo.Url ?? "null", photo.Url?.Length ?? -1);
            _logger.LogInformation("Photo.Caption: '{Caption}'", photo.Caption ?? "null");
        }
        
        var dailyPhotoUrl = string.IsNullOrEmpty(photo?.BlobUrl) ? photo?.Url ?? string.Empty : photo.BlobUrl;
        
        // Jos blobUrl on Blob Storage URL, lisää SAS token
        if (!string.IsNullOrEmpty(dailyPhotoUrl) && dailyPhotoUrl.Contains("blob.core.windows.net"))
        {
            dailyPhotoUrl = _blobStorageService.GenerateSasUrlForBlob(dailyPhotoUrl);
        }
        
        var dailyPhotoCaption = photo?.Caption ?? string.Empty;
        
        _logger.LogInformation("Final dailyPhotoUrl: '{Url}' (length: {Length})", dailyPhotoUrl, dailyPhotoUrl.Length);

        if (!string.IsNullOrEmpty(dailyPhotoUrl))
        {
            _logger.LogInformation("Found photo for {ClientId}: {Caption}", clientId, dailyPhotoCaption);
        }
        else
        {
            _logger.LogWarning("No photo found for client: {ClientId}", clientId);
        }

        // Build daily tasks from foods and medications
        var dailyTasks = new List<DailyTask>();

        // Get client settings (use defaults if not found)
        var clientSettings = client?.Settings ?? new ClientSettings();

        // Add food tasks based on settings
        if (clientSettings.UseFoodReminders)
        {
            if (clientSettings.FoodReminderType == "simple")
            {
                // Use custom meal times if defined, otherwise use defaults
                var mealTimes = clientSettings.MealTimes?.Any() == true 
                    ? clientSettings.MealTimes
                    : new Dictionary<string, string>
                    {
                        { "08:00", "aamupala" },
                        { "11:00", "lounas" },
                        { "16:00", "päivällinen" },
                        { "20:00", "iltapala" }
                    };

                foreach (var meal in mealTimes.OrderBy(m => m.Key))
                {
                    var mealTime = meal.Key;
                    var mealName = meal.Value;
                    
                    dailyTasks.Add(new DailyTask
                    {
                        Id = $"simple_food_{DateTime.Today:yyyyMMdd}_{mealTime.Replace(":", "")}",
                        Type = "food",
                        Time = mealTime,
                        Text = $"🍽️ Muista {mealName}",
                        Completed = false,
                        EncouragingMessage = GetMealEncouragement(mealName)
                    });
                }
            }
            else // detailed food reminders
            {
                dailyTasks.AddRange(todaysFoods.Select(food => new DailyTask
                {
                    Id = food.Id,
                    Type = "food",
                    Time = food.TimeSlot,
                    Text = food.Suggestions.Any() ? string.Join(", ", food.Suggestions) : "Ruokailu",
                    Completed = food.Completed,
                    EncouragingMessage = food.EncouragingMessage
                }));
            }
        }
        // If UseFoodReminders = false, no food tasks are added

        // Add medication tasks
        dailyTasks.AddRange(todaysMedications.Select(med => new DailyTask
        {
            Id = med.Id,
            Type = "medication",
            Time = med.Time,
            Text = $"💊 {med.Name} - {med.Dosage}",
            Completed = med.Completed,
            Instructions = med.Instructions
        }));

        // Sort by time
        dailyTasks = dailyTasks.OrderBy(t => t.Time).ToList();

        // Get weather with smart greetings and activities (klo 8, 12, 16, 20)
        var (weather, smartGreeting, smartActivity) = await GetWeatherWithGreetingAndActivity(clientId);

        // Build response
        var response = new ReminderApiResponse
        {
            Success = true,
            ClientID = clientId,
            Timestamp = DateTime.UtcNow.ToString("O"),
            Status = "OK",
            Settings = clientSettings,
            ImportantMessage = upcomingAppointments.Any() 
                ? $"Muista: {upcomingAppointments[0].Title} {upcomingAppointments[0].Date} klo {upcomingAppointments[0].Time}"
                : string.Empty,
            UpcomingAppointments = upcomingAppointments,
            DailyPhotoUrl = dailyPhotoUrl,
            DailyPhotoCaption = dailyPhotoCaption,
            Weather = weather,
            LatestReminder = reminders.Any() ? reminders[0].Text : string.Empty,
            DailyTasks = dailyTasks,
            CurrentTimeOfDay = GetCurrentTimeOfDay(),
            Greeting = smartGreeting,  // Älykäs tervehdys säästä riippuen
            ActivityText = smartActivity,  // Puuhaa-ehdotus (sisä/ulko sään mukaan)
            Reminders = reminders,
            Count = reminders.Count,
            Storage = storageType,
            Foods = todaysFoods,
            Medications = todaysMedications,
            Appointments = upcomingAppointments
        };


        return await CreateJsonResponse(req, response);
    }

    private async Task<HttpResponseData> HandlePostRequest(HttpRequestData req, string clientId)
    {
        _logger.LogInformation("Handling POST request for client: {ClientId}", clientId);

        if (!_cosmosDbService.IsConfigured)
        {
            return await CreateErrorResponse(req, HttpStatusCode.ServiceUnavailable, "Cosmos DB not configured");
        }

        try
        {
            var requestBody = await req.ReadAsStringAsync();
            var requestData = JsonSerializer.Deserialize<Dictionary<string, object>>(requestBody ?? "{}");
            
            var action = requestData?.GetValueOrDefault("action")?.ToString() ?? "create_reminder";

            switch (action)
            {
                case "complete_food":
                    return await HandleFoodCompletion(req, clientId, requestData);
                
                case "complete_medication":
                    return await HandleMedicationCompletion(req, clientId, requestData);
                
                default: // create_reminder
                    return await HandleCreateReminder(req, clientId, requestData);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling POST request");
            return await CreateErrorResponse(req, HttpStatusCode.BadRequest, "Invalid request data", ex.Message);
        }
    }

    private async Task<Photo?> GetDailyPhoto(string clientId)
    {
        // Try Cosmos DB first
        if (_cosmosDbService.IsConfigured)
        {
            var photo = await _cosmosDbService.GetDailyPhotoAsync(clientId);
            if (photo != null)
            {
                _logger.LogInformation("Found photo from Cosmos DB for {ClientId}", clientId);
                return photo;
            }
        }

        // Fallback to Google Sheets
        _logger.LogInformation("Trying Google Sheets fallback for {ClientId}", clientId);
        var fallbackPhoto = await _googleSheetsService.GetFallbackPhotoAsync(clientId);
        if (fallbackPhoto != null)
        {
            _logger.LogInformation("Found fallback photo from Google Sheets for {ClientId}", clientId);
        }

        return fallbackPhoto;
    }

    private async Task<(WeatherInfo weather, string greeting, string activity)> GetWeatherWithGreetingAndActivity(string clientId)
    {
        var weather = await _weatherService.GetWeatherAsync("Helsinki,FI");
        
        // Käytä Suomen aikavyöhykettä (EET/EEST)
        var helsinkiTimeZone = TimeZoneInfo.FindSystemTimeZoneById("FLE Standard Time"); // Finland/Helsinki
        var helsinkiTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, helsinkiTimeZone);
        var hour = helsinkiTime.Hour;
        
        _logger.LogInformation("🕐 Current hour (Helsinki): {Hour}, UTC: {UtcHour}", hour, DateTime.UtcNow.Hour);
        
        // KORJAUS: Näytä viestit VAIN kellonaikoina 8, 12, 16, 20 (ei muulloin!)
        string greeting = string.Empty;
        string activity = string.Empty;
        
        // Tarkista onko oikea kellonajka viestille (8, 12, 16, 20)
        var validMessageHours = new[] { 8, 12, 16, 20 };
        if (validMessageHours.Contains(hour))
        {
            // Hae älykkäät tervehdykset ja puuhaa CosmosDB:stä
            (greeting, activity) = await _weatherService.GetGreetingAndActivityAsync(weather, hour, clientId);
            _logger.LogInformation("✅ Näytetään viesti klo {Hour}: Greeting='{Greeting}', Activity='{Activity}'", hour, greeting, activity);
        }
        else
        {
            _logger.LogInformation("⏰ Ei viesti-aikaa (klo {Hour}). Viestit vain klo 8, 12, 16, 20.", hour);
        }
        
        // Lisää myös vanha recommendation
        var timeOfDay = GetCurrentTimeOfDay();
        weather.Recommendation = _weatherService.GetActivityRecommendation(weather, timeOfDay, clientId);
        
        return (weather, greeting, activity);
    }

    private static string GetCurrentTimeOfDay()
    {
        // Käytä Suomen aikavyöhykettä
        var helsinkiTimeZone = TimeZoneInfo.FindSystemTimeZoneById("FLE Standard Time");
        var helsinkiTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, helsinkiTimeZone);
        var hour = helsinkiTime.Hour;
        return hour switch
        {
            < 6 => "yö",
            < 12 => "aamu",
            < 18 => "päivä",
            _ => "ilta"
        };
    }

    private static string GetGreeting(string clientId)
    {
        var timeOfDay = GetCurrentTimeOfDay();
        return clientId.ToLower() switch
        {
            "mom" => timeOfDay switch
            {
                "aamu" => "Hyvää huomenta kultaseni! ☀️",
                "päivä" => "Hyvää päivää rakas! 🌼",
                "ilta" => "Hyvää iltaa kulta! 🌙",
                "yö" => "Hyvää yötä rakas! 💤",
                _ => $"Hyvää {timeOfDay}a!"
            },
            _ => $"Hyvää {timeOfDay}a!"
        };
    }

    private async Task<HttpResponseData> HandleCreateReminder(HttpRequestData req, string clientId, Dictionary<string, object>? requestData)
    {
        var reminder = new Reminder
        {
            Id = $"reminder_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}_{Guid.NewGuid().ToString("N")[..9]}",
            ClientId = clientId,
            Type = "reminder",
            Text = requestData?.GetValueOrDefault("text")?.ToString() ?? "New reminder",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _cosmosDbService.CreateItemAsync(reminder, "Clients");
        if (created != null)
        {
            return await CreateJsonResponse(req, new
            {
                success = true,
                message = "Reminder created successfully",
                reminder = created,
                timestamp = DateTime.UtcNow.ToString("O")
            }, HttpStatusCode.Created);
        }

        return await CreateErrorResponse(req, HttpStatusCode.InternalServerError, "Failed to create reminder");
    }

    private static string GetMealEncouragement(string mealName)
    {
        return mealName switch
        {
            "aamupala" => "Hyvää huomenta kultaseni! Aloitetaan päivä hyvin! ☀️",
            "lounas" => "Lounas aika kulta! Nauti rauhassa 🍽️",
            "päivällinen" => "Päivällisen aika! Hyvää ruokahetkeä 🌅",
            "iltapala" => "Mukava iltapala ennen lepoa 🌙",
            _ => "Hyvää ruokahalua! 😊"
        };
    }

    private async Task<HttpResponseData> HandleFoodCompletion(HttpRequestData req, string clientId, Dictionary<string, object>? requestData)
    {
        // Implementation for food completion
        return await CreateJsonResponse(req, new
        {
            success = true,
            message = "Ruoka kuitattu onnistuneesti! 🍽️",
            timestamp = DateTime.UtcNow.ToString("O")
        });
    }

    private async Task<HttpResponseData> HandleMedicationCompletion(HttpRequestData req, string clientId, Dictionary<string, object>? requestData)
    {
        // Implementation for medication completion
        return await CreateJsonResponse(req, new
        {
            success = true,
            message = "Lääke otettu! 💊✅",
            timestamp = DateTime.UtcNow.ToString("O")
        });
    }

    private static string? GetQueryParameter(HttpRequestData req, string paramName)
    {
        return req.Query.AllKeys.Contains(paramName) ? req.Query[paramName] : null;
    }

    private async Task<HttpResponseData> CreateJsonResponse<T>(HttpRequestData req, T data, HttpStatusCode statusCode = HttpStatusCode.OK)
    {
        var response = req.CreateResponse(statusCode);
        response.Headers.Add("Content-Type", "application/json; charset=utf-8");
        
        var origin = req.Headers.Contains("Origin") ? req.Headers.GetValues("Origin").FirstOrDefault() : "";

        if (AllowedOrigins.Contains(origin))
        {
            response.Headers.Add("Access-Control-Allow-Origin", origin);
            response.Headers.Add("Access-Control-Allow-Credentials", "false");
        }
        // Ei aseteta CORS headeria ollenkaan jos origin ei sallittu
        
        var json = JsonSerializer.Serialize(data, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
        });
        await response.WriteStringAsync(json);
        
        return response;
    }

    private async Task<HttpResponseData> CreateErrorResponse(HttpRequestData req, HttpStatusCode statusCode, string error, string? details = null)
    {
        var errorData = new
        {
            success = false,
            error,
            message = details,
            timestamp = DateTime.UtcNow.ToString("O")
        };

        return await CreateJsonResponse(req, errorData, statusCode);
    }

    private HttpResponseData CreatePreflightResponse(HttpRequestData req)
    {
        var response = req.CreateResponse(HttpStatusCode.NoContent);
        var origin = req.Headers.Contains("Origin") ? req.Headers.GetValues("Origin").FirstOrDefault() : "";

        if (AllowedOrigins.Contains(origin))
        {
            response.Headers.Add("Access-Control-Allow-Origin", origin);
            response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization, x-ms-client-principal, x-functions-key");
            response.Headers.Add("Access-Control-Allow-Credentials", "false");
            response.Headers.Add("Access-Control-Max-Age", "3600");
        }

        return response;
    }
}
