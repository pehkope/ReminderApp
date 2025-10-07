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
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", "options", Route = "ReminderAPI")]
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

        // Get daily photo (fetch client settings first for rotation days)
        _logger.LogInformation("Fetching daily photo for client: {ClientId}", clientId);
        var photoRotationDays = client?.Settings?.PhotoRotationDays ?? 1;
        var photo = await GetDailyPhoto(clientId, photoRotationDays);
        
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

        // Get client settings (use defaults if not found)
        var clientSettings = client?.Settings ?? new ClientSettings();

        // Build daily tasks - UUSI LOGIIKKA: Vain NYKYISEN AJAN mukaiset tehtävät
        // Sisältää: RUOKA (kuitattava), PUUHAA (ei kuittausta), LÄÄKKEET (yleinen kuitattava)
        var dailyTasks = CreateDynamicDailyTasks(clientId, clientSettings);

        // Get weather with smart greetings and activities (klo 8, 12, 16, 20)
        var (weather, smartGreeting, smartActivity) = await GetWeatherWithGreetingAndActivity(clientId);

        // Build quick call contacts (top 3 friends + primary contact)
        var quickCallContacts = new List<QuickCallContact>();
        if (client != null && clientSettings.EnableCallFeature)
        {
            // Add primary contact first (family)
            var primaryContact = client.GetPrimaryContact();
            if (primaryContact != null)
            {
                quickCallContacts.Add(new QuickCallContact
                {
                    Name = primaryContact.Name.Split(' ')[0], // Etunimi vain
                    Phone = primaryContact.Phone,
                    Relationship = primaryContact.Relationship
                });
            }

            // Add top 3 friends
            var friends = client.GetFriends().Take(3);
            foreach (var friend in friends)
            {
                quickCallContacts.Add(new QuickCallContact
                {
                    Name = friend.Name.Split(' ')[0], // Etunimi vain
                    Phone = friend.Phone,
                    Relationship = friend.Relationship
                });
            }

            _logger.LogInformation("📞 Quick call contacts prepared: {Count} contacts", quickCallContacts.Count);
        }

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
            Appointments = upcomingAppointments,
            QuickCallContacts = quickCallContacts
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

    private async Task<Photo?> GetDailyPhoto(string clientId, int rotationDays = 1)
    {
        // Try Cosmos DB first
        if (_cosmosDbService.IsConfigured)
        {
            var photo = await _cosmosDbService.GetDailyPhotoAsync(clientId, rotationDays);
            if (photo != null)
            {
                _logger.LogInformation("Found photo from Cosmos DB for {ClientId} (rotation: {RotationDays} days)", clientId, rotationDays);
                return photo;
            }
        }

        // Fallback to Google Sheets (uses daily rotation by default)
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
        // Hae asiakaskohtainen sääsijainti
        var client = await _cosmosDbService.GetClientAsync(clientId);
        var weatherLocation = client?.GetWeatherLocation() ?? "Helsinki,FI";
        
        _logger.LogInformation("🌍 Using weather location for {ClientId}: {Location}", clientId, weatherLocation);
        
        var weather = await _weatherService.GetWeatherAsync(weatherLocation);
        
        // Käytä Suomen aikavyöhykettä (EET/EEST)
        var helsinkiTimeZone = TimeZoneInfo.FindSystemTimeZoneById("FLE Standard Time"); // Finland/Helsinki
        var helsinkiTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, helsinkiTimeZone);
        var hour = helsinkiTime.Hour;
        
        _logger.LogInformation("🕐 Current hour (Helsinki): {Hour}, UTC: {UtcHour}", hour, DateTime.UtcNow.Hour);
        
        // Hae älykkäät tervehdykset ja puuhaa CosmosDB:stä (päivitetään klo 8, 12, 16, 20)
        // Viestit näkyvät koko ajan, mutta vaihtuvat vain näinä aikoina
        var (greeting, activity) = await _weatherService.GetGreetingAndActivityAsync(weather, hour, clientId);
        _logger.LogInformation("👋 Viesti haettu tunniksi {Hour}: Greeting='{Greeting}', Activity='{Activity}'", hour, greeting, activity);
        
        // Lisää myös vanha recommendation
        var timeOfDay = GetCurrentTimeOfDay();
        weather.Recommendation = _weatherService.GetActivityRecommendation(weather, timeOfDay, clientId);
        
        return (weather, greeting, activity);
    }

    /// <summary>
    /// Luo NYKYISEN KELLONAJAN mukaiset RUOKA, PUUHAA ja LÄÄKKEET tehtävät
    /// </summary>
    private List<DailyTask> CreateDynamicDailyTasks(string clientId, ClientSettings settings)
    {
        var tasks = new List<DailyTask>();
        var today = DateTime.Today.ToString("yyyyMMdd");
        
        // Käytä Suomen aikavyöhykettä
        var helsinkiTimeZone = TimeZoneInfo.FindSystemTimeZoneById("FLE Standard Time");
        var helsinkiTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, helsinkiTimeZone);
        var hour = helsinkiTime.Hour;

        // Määritä nykyinen aikavälä ja luo VAIN sille sopivat tehtävät
        string mealTime, mealDescription, activityDescription, timeOfDay;
        bool hasActivity = true;

        if (hour >= 6 && hour < 10) // Aamu 06:00-09:59
        {
            mealTime = "08:00";
            mealDescription = "🍽️ Muista syödä";  // YLEINEN - ei spesifistä ruokaa
            activityDescription = "🧘‍♀️ Verryttele ja venyttele - hyvä alku päivälle!";
            timeOfDay = "Aamu";
        }
        else if (hour >= 10 && hour < 14) // Päivä 10:00-13:59
        {
            mealTime = "12:00";
            mealDescription = "🍽️ Muista syödä";  // YLEINEN - ei spesifistä ruokaa
            activityDescription = "🚶‍♀️ Ulkoile ja nauti luonnosta - sään mukaan!";
            timeOfDay = "Päivä";
        }
        else if (hour >= 14 && hour < 18) // Iltapäivä 14:00-17:59
        {
            mealTime = "16:00";
            mealDescription = "🍽️ Muista syödä";  // YLEINEN - ei spesifistä ruokaa
            activityDescription = "🌳 Käy kävelyllä tai soita ystävälle";
            timeOfDay = "Ilta";
        }
        else if (hour >= 18 && hour < 22) // Ilta 18:00-21:59
        {
            mealTime = "20:00";
            mealDescription = "🍽️ Muista syödä";  // YLEINEN - ei spesifistä ruokaa
            activityDescription = string.Empty; // Ei puuhaata illalla
            timeOfDay = "Ilta";
            hasActivity = false;
        }
        else // Yö 22:00-05:59
        {
            mealTime = "20:00";
            mealDescription = "🍽️ Lepää rauhassa";
            activityDescription = string.Empty;
            timeOfDay = "Yö";
            hasActivity = false;
        }

        // RUOKA - NYKYISEN AJAN mukainen (KUITATTAVA!)
        // Asiakaskohtainen asetus: useFoodReminders
        if (settings.UseFoodReminders)
        {
            tasks.Add(new DailyTask
            {
                Id = $"food_{mealTime.Replace(":", "")}_{today}",
                Type = "RUOKA",
                Time = mealTime,
                Description = mealDescription,
                TimeOfDay = timeOfDay,
                RequiresAck = true,
                IsAckedToday = false
            });
        }

        // PUUHAA - NYKYISEN AJAN mukainen (EI kuittausta)
        if (hasActivity)
        {
            tasks.Add(new DailyTask
            {
                Id = $"activity_{mealTime.Replace(":", "")}_{today}",
                Type = "PUUHAA",
                Time = mealTime,
                Description = activityDescription,
                TimeOfDay = timeOfDay,
                RequiresAck = false,
                IsAckedToday = false
            });
        }

        // LÄÄKKEET - VAIN aamulla klo 8:00 (KUITATTAVA!)
        // TÄRKEÄ: EI SAA SANOA MITÄ LÄÄKKEITÄ OTTAA (laki kieltää ilman lääkeviraston lupaa)
        // Vain yleinen muistutus!
        // Asiakaskohtainen asetus: useMedicationReminders
        if (settings.UseMedicationReminders && hour == 8)
        {
            tasks.Add(new DailyTask
            {
                Id = $"medication_morning_{today}",
                Type = "LÄÄKKEET",
                Time = settings.MedicationReminderTime,
                Description = "💊 Muista lääkkeet", // YLEINEN - ei spesifisiä lääkkeitä
                TimeOfDay = "Aamu",
                RequiresAck = true,
                IsAckedToday = false
            });
        }

        _logger.LogInformation($"✅ Luotu {tasks.Count} tehtävää asiakkaalle {clientId} klo {hour}:00 ({timeOfDay}) - LAKI-MUKAINEN v2");
        return tasks;
    }

    /// <summary>
    /// Määritä vuorokaudenaika tunnista (esim. "08:00" -> "Aamu")
    /// </summary>
    private static string GetTimeOfDayForHour(string timeStr)
    {
        if (string.IsNullOrEmpty(timeStr)) return "Aamu";
        
        // Parse hour from "HH:mm" format
        var parts = timeStr.Split(':');
        if (parts.Length > 0 && int.TryParse(parts[0], out var hour))
        {
            return hour switch
            {
                < 6 => "Yö",
                < 12 => "Aamu",
                < 18 => "Päivä",
                _ => "Ilta"
            };
        }
        
        return "Aamu";
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
