using System.Text.Json;
using ReminderApp.Tablet.Models;

namespace ReminderApp.Tablet.Services;

public class ReminderApiService
{
    private readonly HttpClient _httpClient;
    private readonly JsonSerializerOptions _jsonOptions;
    
    // TODO: Korvaa tämä oikealla Google Apps Script URL:lla
    private const string API_BASE_URL = "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE";
    
    public ReminderApiService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };
    }
    
    public async Task<ReminderApiResponse?> GetReminderDataAsync(string clientId = "mom")
    {
        try
        {
            var url = $"{API_BASE_URL}?clientID={clientId}";
            var response = await _httpClient.GetStringAsync(url);
            
            var data = JsonSerializer.Deserialize<ReminderApiResponse>(response, _jsonOptions);
            return data;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching reminder data: {ex.Message}");
            
            // Palauta demo-data jos API ei toimi
            return GetDemoData();
        }
    }
    
    // Demo-data testauksia varten
    private ReminderApiResponse GetDemoData()
    {
        return new ReminderApiResponse
        {
            ClientID = "mom",
            Timestamp = DateTime.Now,
            Status = "DEMO MODE",
            Settings = new Settings { UseTelegram = true, UsePhotos = true },
            ImportantMessage = "📅 Lääkäri kello 14:00 - Muista ottaa lääkkeet mukaan",
            UpcomingAppointments = new List<UpcomingAppointment>
            {
                new() { Date = "2024-12-24", Time = "18:00", Type = "Jouluateria", Message = "Koko perhe kokoontuu", DaysFromNow = 2 }
            },
            DailyPhotoUrl = "https://picsum.photos/400/300",
            DailyPhotoCaption = "📸 Kaunis kuva äidille (demo-kuva)",
            Weather = new Weather { Description = "Aurinkoinen, 8°C. Loistava päivä ulkoiluun! ☀️", Temperature = "8°C" },
            Contacts = new List<Contact>
            {
                new() { Name = "Petri", Phone = "+358401234567" },
                new() { Name = "Anna", Phone = "+358407654321" }
            },
            LatestReminder = "Muista ottaa aamulääkkeet ja nauttia aamukahvi. Päivä on täynnä mahdollisuuksia! 😊 (DEMO MODE - Yhdistä Google Apps Script API)"
        };
    }
}