using System.Text.Json;
using System.Text.Json.Serialization;
using System.ComponentModel;

namespace ReminderTabletNew2.Models;

public class ReminderApiResponse
{
    [JsonPropertyName("clientID")]
    public string ClientID { get; set; }

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; }

    [JsonPropertyName("settings")]
    public Settings Settings { get; set; }

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
    public string Date { get; set; }

    [JsonPropertyName("time")]
    public string Time { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; }

    [JsonPropertyName("location")]
    public string Location { get; set; }

    [JsonPropertyName("daysFromNow")]
    public int DaysFromNow { get; set; }
}

public class Weather
{
    [JsonPropertyName("description")]
    public string Description { get; set; }

    [JsonPropertyName("temperature")]
    public string Temperature { get; set; }
}

public class Contact
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("phone")]
    [JsonConverter(typeof(FlexibleStringConverter))]
    public string Phone { get; set; } = "";
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