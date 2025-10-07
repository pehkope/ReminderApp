using System.Text.Json.Serialization;
using Newtonsoft.Json;

namespace ReminderApp.Functions.Models;

// UUSI inspiroiva viesti-malli (ilman ruoka/lääke mainintoja)
public class MessageCard
{
    [JsonPropertyName("id")]
    [JsonProperty("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("clientId")]
    [JsonProperty("clientId")]
    public string ClientId { get; set; } = string.Empty;

    [JsonPropertyName("timeOfDay")]
    [JsonProperty("timeOfDay")]
    public string TimeOfDay { get; set; } = string.Empty; // morning, noon, afternoon, evening

    [JsonPropertyName("weatherCondition")]
    [JsonProperty("weatherCondition")]
    public string WeatherCondition { get; set; } = string.Empty; // sunny, cloudy, rain, any

    [JsonPropertyName("greeting")]
    [JsonProperty("greeting")]
    public string Greeting { get; set; } = string.Empty;

    [JsonPropertyName("activityTag")]
    [JsonProperty("activityTag")]
    public string ActivityTag { get; set; } = string.Empty; // outdoor, indoor, social

    [JsonPropertyName("activitySuggestion")]
    [JsonProperty("activitySuggestion")]
    public string ActivitySuggestion { get; set; } = string.Empty;

    [JsonPropertyName("isActive")]
    [JsonProperty("isActive")]
    public bool IsActive { get; set; } = true;
}

// VANHA tuntikohtainen viesti-malli (yhteensopivuus varten)
public class GreetingMessage
{
    [JsonPropertyName("id")]
    [JsonProperty("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("clientId")]
    [JsonProperty("clientId")]
    public string ClientId { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    [JsonProperty("type")]
    public string Type { get; set; } = "greeting_messages";

    [JsonPropertyName("timeSlot")]
    [JsonProperty("timeSlot")]
    public string TimeSlot { get; set; } = string.Empty; // morning, midday, afternoon, evening

    [JsonPropertyName("hour")]
    [JsonProperty("hour")]
    public int Hour { get; set; }

    [JsonPropertyName("messages")]
    [JsonProperty("messages")]
    public List<string> Messages { get; set; } = new();

    [JsonPropertyName("activities_indoor")]
    [JsonProperty("activities_indoor")]
    public List<string> ActivitiesIndoor { get; set; } = new();

    [JsonPropertyName("activities_outdoor")]
    [JsonProperty("activities_outdoor")]
    public List<string> ActivitiesOutdoor { get; set; } = new();

    [JsonPropertyName("isActive")]
    [JsonProperty("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("updatedAt")]
    [JsonProperty("updatedAt")]
    public string UpdatedAt { get; set; } = string.Empty;
}

public class Reminder
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("clientId")]
    public string ClientId { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "reminder";

    [JsonPropertyName("text")]
    public string Text { get; set; } = string.Empty;

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Photo
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("clientId")]
    public string ClientId { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "photo";

    [JsonPropertyName("fileName")]
    public string FileName { get; set; } = string.Empty;

    [JsonPropertyName("blobUrl")]
    [JsonProperty("blobUrl")] // For Cosmos DB Newtonsoft.Json deserialization
    public string BlobUrl { get; set; } = string.Empty;

    [JsonPropertyName("thumbnailUrl")]
    public string ThumbnailUrl { get; set; } = string.Empty;

    [JsonPropertyName("url")]
    [JsonProperty("url")] // For Cosmos DB Newtonsoft.Json deserialization
    public string Url { get; set; } = string.Empty; // For Google Drive fallback

    [JsonPropertyName("caption")]
    public string Caption { get; set; } = string.Empty;

    [JsonPropertyName("uploadedAt")]
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("uploadedBy")]
    public string UploadedBy { get; set; } = string.Empty;

    [JsonPropertyName("uploadSource")]
    public string UploadSource { get; set; } = string.Empty;

    [JsonPropertyName("source")]
    public string Source { get; set; } = ""; // "telegram", "upload", "google-drive"
    
    [JsonPropertyName("telegramFileId")]
    public string? TelegramFileId { get; set; }
    
    [JsonPropertyName("senderName")]
    public string? SenderName { get; set; }
    
    [JsonPropertyName("senderChatId")]
    public string? SenderChatId { get; set; }
    
    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("fileSize")]
    public long FileSize { get; set; }

    [JsonPropertyName("mimeType")]
    public string MimeType { get; set; } = string.Empty;

    [JsonPropertyName("isActive")]
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("tags")]
    public List<string> Tags { get; set; } = new();
}

public class Appointment
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("clientId")]
    public string ClientId { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "appointment";

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("time")]
    public string Time { get; set; } = string.Empty;

    [JsonPropertyName("location")]
    public string Location { get; set; } = string.Empty;

    [JsonPropertyName("reminderBefore")]
    public int ReminderBefore { get; set; } = 60; // minutes

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("createdBy")]
    public string CreatedBy { get; set; } = string.Empty;
}

public class Food
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("clientId")]
    public string ClientId { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "food";

    [JsonPropertyName("mealTime")]
    public string MealTime { get; set; } = string.Empty; // breakfast, lunch, dinner, evening

    [JsonPropertyName("timeSlot")]
    public string TimeSlot { get; set; } = string.Empty;

    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("suggestions")]
    public List<string> Suggestions { get; set; } = new();

    [JsonPropertyName("encouragingMessage")]
    public string EncouragingMessage { get; set; } = string.Empty;

    [JsonPropertyName("completed")]
    public bool Completed { get; set; }

    [JsonPropertyName("completedAt")]
    public DateTime? CompletedAt { get; set; }
}

public class Medication
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("clientId")]
    public string ClientId { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "medication";

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("dosage")]
    public string Dosage { get; set; } = string.Empty;

    [JsonPropertyName("timeSlot")]
    public string TimeSlot { get; set; } = string.Empty; // morning, afternoon, evening, night

    [JsonPropertyName("time")]
    public string Time { get; set; } = string.Empty;

    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty;

    [JsonPropertyName("instructions")]
    public string Instructions { get; set; } = string.Empty;

    [JsonPropertyName("completed")]
    public bool Completed { get; set; }

    [JsonPropertyName("completedAt")]
    public DateTime? CompletedAt { get; set; }

    [JsonPropertyName("recurring")]
    public bool Recurring { get; set; }

    [JsonPropertyName("recurringPattern")]
    public string RecurringPattern { get; set; } = string.Empty;
}

public class Client
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("clientId")]
    public string ClientId { get; set; } = string.Empty;

    [JsonPropertyName("type")]
    public string Type { get; set; } = "client";

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty;

    [JsonPropertyName("timezone")]
    public string Timezone { get; set; } = "Europe/Helsinki";

    [JsonPropertyName("language")]
    public string Language { get; set; } = "fi";

    [JsonPropertyName("settings")]
    public ClientSettings Settings { get; set; } = new();

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
