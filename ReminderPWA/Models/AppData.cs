using System.Text.Json;
using System.Text.Json.Serialization;
using System.ComponentModel;

namespace ReminderTabletNew2.Models;

public class ReminderApiResponse
{
    [JsonPropertyName("clientID")]
    public string ClientID { get; set; } = "";

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = "";

    [JsonPropertyName("settings")]
    public Settings Settings { get; set; } = new();

    [JsonPropertyName("importantMessage")]
    public string ImportantMessage { get; set; }

    [JsonPropertyName("upcomingAppointments")]
    public List<UpcomingAppointment> UpcomingAppointments { get; set; }

    [JsonPropertyName("dailyPhotoUrl")]
    public string DailyPhotoUrl { get; set; }

    [JsonPropertyName("dailyPhotoCaption")]
    public string DailyPhotoCaption { get; set; }

    [JsonPropertyName("weeklyPhotos")]
    public List<DrivePhoto> WeeklyPhotos { get; set; } = new();

    [JsonPropertyName("profilePhoto")]
    public DrivePhoto? ProfilePhoto { get; set; }

    [JsonPropertyName("exerciseVideoUrl")]
    public string ExerciseVideoUrl { get; set; }

    [JsonPropertyName("weather")]
    public Weather Weather { get; set; }

    [JsonPropertyName("contacts")]
    public List<Contact> Contacts { get; set; }

    [JsonPropertyName("latestReminder")]
    public string LatestReminder { get; set; }

    [JsonPropertyName("dailyTasks")]
    public List<DailyTask> DailyTasks { get; set; } = new();

    [JsonPropertyName("currentTimeOfDay")]
    public string CurrentTimeOfDay { get; set; } = "";

    [JsonPropertyName("weeklyPlan")]
    public WeeklyPlan WeeklyPlan { get; set; } = new();

    // Uudet kentät: puuhaa ja ruokaehdotukset
    [JsonPropertyName("greeting")]
    public string? Greeting { get; set; }

    [JsonPropertyName("activityText")]
    public string? ActivityText { get; set; }

    [JsonPropertyName("activityTags")]
    public List<string>? ActivityTags { get; set; }

    [JsonPropertyName("activityTimeOfDay")]
    public string? ActivityTimeOfDay { get; set; }

    [JsonPropertyName("nextMealType")]
    public string? NextMealType { get; set; }

    [JsonPropertyName("nextMealTime")]
    public string? NextMealTime { get; set; }

    [JsonPropertyName("mealOptions")]
    public List<string>? MealOptions { get; set; }
}

/// <summary>
/// Google Drive kuva-objekti
/// </summary>
public class DrivePhoto
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("url")]
    public string Url { get; set; } = "";

    [JsonPropertyName("date")]
    public DateTime Date { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("fileId")]
    public string FileId { get; set; } = "";
}

public class DailyTask
{
    [JsonPropertyName("date")]
    public string Date { get; set; } = "";

    [JsonPropertyName("time")]
    public string Time { get; set; } = "";

    [JsonPropertyName("type")]
    public string Type { get; set; } = "";

    [JsonPropertyName("message")]
    public string Message { get; set; } = "";

    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("requiresAck")]
    public bool RequiresAck { get; set; }

    [JsonPropertyName("isAckedToday")]
    public bool IsAckedToday { get; set; }

    [JsonPropertyName("timeOfDay")]
    public string TimeOfDay { get; set; } = "";

    [JsonPropertyName("acknowledgmentTimestamp")]
    public string? AcknowledgmentTimestamp { get; set; }
}

public class Settings
{
    [JsonPropertyName("useTelegram")]
    public bool UseTelegram { get; set; }

    [JsonPropertyName("usePhotos")]
    public bool UsePhotos { get; set; }
}

public class UpcomingAppointment
{
    [JsonPropertyName("date")]
    public string Date { get; set; } = "";

    [JsonPropertyName("time")]
    public string Time { get; set; } = "";

    [JsonPropertyName("type")]
    public string Type { get; set; } = "";

    [JsonPropertyName("message")]
    public string Message { get; set; } = "";

    [JsonPropertyName("location")]
    public string Location { get; set; } = "";

    [JsonPropertyName("daysFromNow")]
    public int DaysFromNow { get; set; }
}

public class Weather
{
    [JsonPropertyName("description")]
    public string Description { get; set; } = "";

    [JsonPropertyName("temperature")]
    public string Temperature { get; set; } = "";
}

public class WeeklyPlan
{
    [JsonPropertyName("days")]
    public List<WeeklyDay> Days { get; set; } = new();
}

public class WeeklyDay
{
    [JsonPropertyName("date")]
    public string Date { get; set; } = "";

    [JsonPropertyName("label")]
    public string Label { get; set; } = "";

    [JsonPropertyName("meals")]
    public List<string> Meals { get; set; } = new();

    [JsonPropertyName("medicines")]
    public List<string> Medicines { get; set; } = new();

    [JsonPropertyName("events")]
    public List<string> Events { get; set; } = new();
}

public class Contact
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("phone")]
    [JsonConverter(typeof(FlexibleStringConverter))]
    public string Phone { get; set; } = "";

    [JsonPropertyName("photoUrl")]
    public string PhotoUrl { get; set; } = "";

    [JsonPropertyName("relationship")]
    public string Relationship { get; set; } = "";

    [JsonPropertyName("telegramChatID")]
    public string TelegramChatID { get; set; } = "";
}

public class FlexibleStringConverter : JsonConverter<string>
{
    public override string Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        switch (reader.TokenType)
        {
            case JsonTokenType.String:
                return reader.GetString() ?? "";
            case JsonTokenType.Number:
                if (reader.TryGetInt64(out var longValue))
                    return longValue.ToString();
                if (reader.TryGetDouble(out var doubleValue))
                    return doubleValue.ToString("F0");
                return "";
            case JsonTokenType.True:
                return "true";
            case JsonTokenType.False:
                return "false";
            case JsonTokenType.Null:
                return "";
            default:
                return "";
        }
    }

    public override void Write(Utf8JsonWriter writer, string value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value);
    }
} 