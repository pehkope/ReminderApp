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

    public ReminderApi(ILoggerFactory loggerFactory, 
                      CosmosDbService cosmosDbService, 
                      GoogleSheetsService googleSheetsService,
                      WeatherService weatherService)
    {
        _logger = loggerFactory.CreateLogger<ReminderApi>();
        _cosmosDbService = cosmosDbService;
        _googleSheetsService = googleSheetsService;
        _weatherService = weatherService;
    }

    [Function("ReminderApi")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = "api/ReminderAPI")] 
        HttpRequestData req)
    {
            _logger.LogInformation("ReminderAPI (.NET v2) called with method: {Method}", req.Method);

        try
        {
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
        var dailyPhotoUrl = photo?.BlobUrl ?? photo?.Url ?? string.Empty;
        var dailyPhotoCaption = photo?.Caption ?? string.Empty;

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

        // Get weather with recommendations
        var weather = await GetWeatherWithRecommendation(clientId);

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
            Greeting = GetGreeting(clientId),
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

    private async Task<WeatherInfo> GetWeatherWithRecommendation(string clientId)
    {
        var weather = await _weatherService.GetWeatherAsync("Helsinki,FI");
        var timeOfDay = GetCurrentTimeOfDay();
        
        // Add activity recommendation based on weather
        weather.Recommendation = _weatherService.GetActivityRecommendation(weather, timeOfDay, clientId);
        
        return weather;
    }

    private static string GetCurrentTimeOfDay()
    {
        var hour = DateTime.Now.Hour;
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
        
        // SECURITY: Restrict CORS to specific domains only
        var origin = req.Headers.Contains("Origin") ? req.Headers.GetValues("Origin").FirstOrDefault() : "";
        var allowedOrigins = new[] { 
            "https://lively-forest-0b274f703.1.azurestaticapps.net", // PWA production (current)
            "https://gentle-bush-0a3b2fd03.5.azurestaticapps.net", // PWA production (old)
            "https://localhost:5000", // Local development
            "https://localhost:5001"  // Local development HTTPS
        };
        
        if (allowedOrigins.Contains(origin))
        {
            response.Headers.Add("Access-Control-Allow-Origin", origin);
        }
        else
        {
            response.Headers.Add("Access-Control-Allow-Origin", "null"); // Block unknown origins
        }
        
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
}
