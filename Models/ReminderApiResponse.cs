namespace ReminderApp.Tablet.Models;

public class ReminderApiResponse
{
    public string ClientID { get; set; } = "";
    public DateTime Timestamp { get; set; }
    public string Status { get; set; } = "";
    public Settings Settings { get; set; } = new();
    public string ImportantMessage { get; set; } = "";
    public List<UpcomingAppointment> UpcomingAppointments { get; set; } = new();
    public string DailyPhotoUrl { get; set; } = "";
    public string DailyPhotoCaption { get; set; } = "";
    public Weather Weather { get; set; } = new();
    public List<Contact> Contacts { get; set; } = new();
    public string LatestReminder { get; set; } = "";
    public string? Error { get; set; }
}

public class Settings
{
    public bool UseTelegram { get; set; }
    public bool UsePhotos { get; set; }
}

public class UpcomingAppointment
{
    public string Date { get; set; } = "";
    public string Time { get; set; } = "";
    public string Type { get; set; } = "";
    public string Message { get; set; } = "";
    public string Location { get; set; } = "";
    public int DaysFromNow { get; set; }
}

public class Weather
{
    public string Description { get; set; } = "";
    public string Temperature { get; set; } = "";
}

public class Contact
{
    public string Name { get; set; } = "";
    public string Phone { get; set; } = "";
}