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

    [JsonPropertyName("fullName")]
    public string FullName { get; set; } = string.Empty; // Koko nimi: "Anna Virtanen"

    [JsonPropertyName("preferredName")]
    public string PreferredName { get; set; } = string.Empty; // Kutsumanimi: "Anna"

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty; // Vanha kenttä (yhteensopivuus)

    [JsonPropertyName("displayName")]
    public string DisplayName { get; set; } = string.Empty; // Vanha kenttä (yhteensopivuus)

    [JsonPropertyName("gender")]
    public string Gender { get; set; } = "female"; // "male", "female", "other"

    [JsonPropertyName("dateOfBirth")]
    public string DateOfBirth { get; set; } = string.Empty; // ISO 8601: "1950-03-15"

    [JsonPropertyName("contacts")]
    public List<ContactPerson> Contacts { get; set; } = new();

    [JsonPropertyName("address")]
    public Address? Address { get; set; }

    [JsonPropertyName("emergencyInfo")]
    public EmergencyInfo? EmergencyInfo { get; set; }

    [JsonPropertyName("timezone")]
    public string Timezone { get; set; } = "Europe/Helsinki";

    [JsonPropertyName("language")]
    public string Language { get; set; } = "fi";

    [JsonPropertyName("weatherLocation")]
    public string? WeatherLocation { get; set; } // Optional: "Tampere,FI" (defaults to address.city)

    [JsonPropertyName("settings")]
    public ClientSettings Settings { get; set; } = new();

    [JsonPropertyName("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("updatedAt")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Get weather location (prioritizes custom weatherLocation, then address.city, then default)
    /// </summary>
    public string GetWeatherLocation()
    {
        // Priority 1: Custom weatherLocation
        if (!string.IsNullOrEmpty(WeatherLocation))
            return WeatherLocation;

        // Priority 2: address.city
        if (Address != null && !string.IsNullOrEmpty(Address.City))
            return $"{Address.City},FI";

        // Priority 3: Default
        return "Helsinki,FI";
    }

    /// <summary>
    /// Get family contacts (Poika, Tytär, Puoliso, etc.)
    /// </summary>
    public List<ContactPerson> GetFamilyContacts()
    {
        return Contacts.Where(c => 
            c.Relationship.Contains("Poika", StringComparison.OrdinalIgnoreCase) ||
            c.Relationship.Contains("Tytär", StringComparison.OrdinalIgnoreCase) ||
            c.Relationship.Contains("Puoliso", StringComparison.OrdinalIgnoreCase) ||
            c.Relationship.Contains("Sisar", StringComparison.OrdinalIgnoreCase) ||
            c.Relationship.Contains("Veli", StringComparison.OrdinalIgnoreCase))
        .ToList();
    }

    /// <summary>
    /// Get friends
    /// </summary>
    public List<ContactPerson> GetFriends()
    {
        return Contacts.Where(c => 
            c.Relationship.Equals("Ystävä", StringComparison.OrdinalIgnoreCase) ||
            c.Relationship.Equals("Friend", StringComparison.OrdinalIgnoreCase))
        .OrderBy(c => c.Name)
        .ToList();
    }

    /// <summary>
    /// Get caregivers/nurses
    /// </summary>
    public List<ContactPerson> GetCaregivers()
    {
        return Contacts.Where(c => 
            c.Relationship.Contains("Hoitaja", StringComparison.OrdinalIgnoreCase) ||
            c.Relationship.Contains("Sairaanhoitaja", StringComparison.OrdinalIgnoreCase))
        .ToList();
    }

    /// <summary>
    /// Get primary contact (for emergencies)
    /// </summary>
    public ContactPerson? GetPrimaryContact()
    {
        return Contacts.FirstOrDefault(c => c.IsPrimary);
    }
}

public class ContactPerson
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("relationship")]
    public string Relationship { get; set; } = string.Empty; // "Poika", "Tytär", "Hoitaja", "Puoliso"

    [JsonPropertyName("phone")]
    public string Phone { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [JsonPropertyName("isPrimary")]
    public bool IsPrimary { get; set; } = false;

    [JsonPropertyName("canReceiveAlerts")]
    public bool CanReceiveAlerts { get; set; } = true;

    [JsonPropertyName("telegramChatId")]
    public string TelegramChatId { get; set; } = string.Empty;

    [JsonPropertyName("notes")]
    public string Notes { get; set; } = string.Empty;
}

public class Address
{
    [JsonPropertyName("street")]
    public string Street { get; set; } = string.Empty;

    [JsonPropertyName("city")]
    public string City { get; set; } = string.Empty;

    [JsonPropertyName("postalCode")]
    public string PostalCode { get; set; } = string.Empty;

    [JsonPropertyName("country")]
    public string Country { get; set; } = "Finland";
}

public class EmergencyInfo
{
    [JsonPropertyName("allergies")]
    public List<string> Allergies { get; set; } = new();

    [JsonPropertyName("medications")]
    public List<string> Medications { get; set; } = new();

    [JsonPropertyName("medicalConditions")]
    public List<string> MedicalConditions { get; set; } = new();

    [JsonPropertyName("emergencyNotes")]
    public string EmergencyNotes { get; set; } = string.Empty;
}

public class WeatherCache
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty; // "weather_<location>"

    [JsonPropertyName("location")]
    public string Location { get; set; } = string.Empty; // "Helsinki,FI"

    [JsonPropertyName("temperature")]
    public double Temperature { get; set; }

    [JsonPropertyName("feelsLike")]
    public double FeelsLike { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("icon")]
    public string Icon { get; set; } = string.Empty;

    [JsonPropertyName("humidity")]
    public int Humidity { get; set; }

    [JsonPropertyName("windSpeed")]
    public double WindSpeed { get; set; }

    [JsonPropertyName("isRaining")]
    public bool IsRaining { get; set; }

    [JsonPropertyName("isCold")]
    public bool IsCold { get; set; }

    [JsonPropertyName("recommendation")]
    public string Recommendation { get; set; } = string.Empty;

    [JsonPropertyName("fetchedAt")]
    public DateTime FetchedAt { get; set; } = DateTime.UtcNow;

    [JsonPropertyName("expiresAt")]
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(4);

    [JsonPropertyName("source")]
    public string Source { get; set; } = "OpenWeatherMap";

    // Weather change detection
    [JsonPropertyName("previousTemperature")]
    public double? PreviousTemperature { get; set; }

    [JsonPropertyName("temperatureTrend")]
    public string TemperatureTrend { get; set; } = "stable"; // "warming", "cooling", "stable"

    [JsonPropertyName("forecast")]
    public List<WeatherForecastItem> Forecast { get; set; } = new();

    [JsonPropertyName("smartSuggestion")]
    public string SmartSuggestion { get; set; } = string.Empty; // Proactive suggestion
}

public class WeatherForecastItem
{
    [JsonPropertyName("date")]
    public string Date { get; set; } = string.Empty; // "2025-10-08"

    [JsonPropertyName("dayOfWeek")]
    public string DayOfWeek { get; set; } = string.Empty; // "Tiistai"

    [JsonPropertyName("tempMax")]
    public double TempMax { get; set; }

    [JsonPropertyName("tempMin")]
    public double TempMin { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = string.Empty;

    [JsonPropertyName("icon")]
    public string Icon { get; set; } = string.Empty;

    [JsonPropertyName("rainProbability")]
    public int RainProbability { get; set; }

    [JsonPropertyName("isGoodForOutdoor")]
    public bool IsGoodForOutdoor { get; set; }
}
