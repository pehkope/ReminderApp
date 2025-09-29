using System.Text.Json.Serialization;

namespace ReminderApp.Functions.Models;

public class ReminderApiResponse
{
    [JsonPropertyName("success")]
    public bool Success { get; set; } = true;

    [JsonPropertyName("clientID")]
    public string ClientID { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public string Timestamp { get; set; } = DateTime.UtcNow.ToString("O");

    [JsonPropertyName("status")]
    public string Status { get; set; } = "OK";

    [JsonPropertyName("settings")]
    public ClientSettings Settings { get; set; } = new();

    [JsonPropertyName("importantMessage")]
    public string ImportantMessage { get; set; } = string.Empty;

    [JsonPropertyName("upcomingAppointments")]
    public List<Appointment> UpcomingAppointments { get; set; } = new();

    [JsonPropertyName("dailyPhotoUrl")]
    public string DailyPhotoUrl { get; set; } = string.Empty;

    [JsonPropertyName("dailyPhotoCaption")]
    public string DailyPhotoCaption { get; set; } = string.Empty;

    [JsonPropertyName("weeklyPhotos")]
    public List<object> WeeklyPhotos { get; set; } = new();

    [JsonPropertyName("profilePhoto")]
    public object? ProfilePhoto { get; set; }

    [JsonPropertyName("exerciseVideoUrl")]
    public string ExerciseVideoUrl { get; set; } = string.Empty;

    [JsonPropertyName("weather")]
    public WeatherInfo Weather { get; set; } = new();

    [JsonPropertyName("contacts")]
    public List<object> Contacts { get; set; } = new();

    [JsonPropertyName("latestReminder")]
    public string LatestReminder { get; set; } = string.Empty;

    [JsonPropertyName("dailyTasks")]
    public List<DailyTask> DailyTasks { get; set; } = new();

    [JsonPropertyName("currentTimeOfDay")]
    public string CurrentTimeOfDay { get; set; } = string.Empty;

    [JsonPropertyName("weeklyPlan")]
    public object WeeklyPlan { get; set; } = new { };

    [JsonPropertyName("greeting")]
    public string Greeting { get; set; } = string.Empty;

    [JsonPropertyName("activityText")]
    public string ActivityText { get; set; } = string.Empty;

    [JsonPropertyName("activityTags")]
    public List<string> ActivityTags { get; set; } = new();

    // New API fields
    [JsonPropertyName("reminders")]
    public List<Reminder> Reminders { get; set; } = new();

    [JsonPropertyName("count")]
    public int Count { get; set; }

    [JsonPropertyName("storage")]
    public string Storage { get; set; } = "in-memory";

    // Extended data
    [JsonPropertyName("foods")]
    public List<Food> Foods { get; set; } = new();

    [JsonPropertyName("medications")]
    public List<Medication> Medications { get; set; } = new();

    [JsonPropertyName("appointments")]
    public List<Appointment> Appointments { get; set; } = new();
}

public class ClientSettings
{
    [JsonPropertyName("useWeather")]
    public bool UseWeather { get; set; } = true;

    [JsonPropertyName("usePhotos")]
    public bool UsePhotos { get; set; } = true;

    [JsonPropertyName("useTelegram")]
    public bool UseTelegram { get; set; } = false;

    [JsonPropertyName("useSMS")]
    public bool UseSMS { get; set; } = false;

    // Food reminder settings
    [JsonPropertyName("useFoodReminders")]
    public bool UseFoodReminders { get; set; } = true;

    [JsonPropertyName("foodReminderType")]
    public string FoodReminderType { get; set; } = "detailed"; // "detailed" or "simple"

    [JsonPropertyName("simpleReminderText")]
    public string SimpleReminderText { get; set; } = "Muista syödä"; // Custom text for simple reminders

    [JsonPropertyName("mealTimes")]
    public Dictionary<string, string> MealTimes { get; set; } = new(); // Custom meal times: "08:00" -> "aamupala"
}

public class WeatherInfo
{
    [JsonPropertyName("description")]
    public string Description { get; set; } = "Pilvistä";

    [JsonPropertyName("temperature")]
    public string Temperature { get; set; } = "12°C";

    [JsonPropertyName("condition")]
    public string Condition { get; set; } = "clouds";

    [JsonPropertyName("humidity")]
    public int Humidity { get; set; } = 70;

    [JsonPropertyName("windSpeed")]
    public double WindSpeed { get; set; } = 3.0;

    [JsonPropertyName("recommendation")]
    public string Recommendation { get; set; } = string.Empty;

    [JsonPropertyName("isGood")]
    public bool IsGood { get; set; } = false;

    [JsonPropertyName("isRaining")]
    public bool IsRaining { get; set; } = false;

    [JsonPropertyName("isCold")]
    public bool IsCold { get; set; } = false;
}

public class DailyTask
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("time")]
    public string Time { get; set; } = string.Empty;

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;

    [JsonPropertyName("completed")]
    public bool Completed { get; set; }

    [JsonPropertyName("encouragingMessage")]
    public string EncouragingMessage { get; set; } = string.Empty;

    [JsonPropertyName("instructions")]
    public string Instructions { get; set; } = string.Empty;
}
