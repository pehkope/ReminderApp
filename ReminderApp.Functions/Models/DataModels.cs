using System.Text.Json.Serialization;

namespace ReminderApp.Functions.Models;

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
    public string BlobUrl { get; set; } = string.Empty;

    [JsonPropertyName("thumbnailUrl")]
    public string ThumbnailUrl { get; set; } = string.Empty;

    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty; // For Google Drive fallback

    [JsonPropertyName("caption")]
    public string Caption { get; set; } = string.Empty;

    [JsonPropertyName("uploadedAt")]
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("uploadedBy")]
    public string UploadedBy { get; set; } = string.Empty;

    [JsonPropertyName("uploadSource")]
    public string UploadSource { get; set; } = string.Empty;

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
