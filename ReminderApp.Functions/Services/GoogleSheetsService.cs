using ReminderApp.Functions.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ReminderApp.Functions.Services;

public class GoogleSheetsService
{
    private readonly HttpClient _httpClient;
    private readonly string? _webAppUrl;
    private readonly string _sheetsId;
    private readonly Dictionary<string, string> _sheetNames;

    public GoogleSheetsService()
    {
        _httpClient = new HttpClient();
        _webAppUrl = Environment.GetEnvironmentVariable("SHEETS_WEBAPP_URL");
        _sheetsId = "14i3QPYquqSqyE7fTp_pa2LNBq2Jb_re2rwsuUpRRSHo";
        _sheetNames = new Dictionary<string, string>
        {
            { "config", "Konfiguraatio" },
            { "medications", "Lääkkeet" },
            { "foods", "Ruoka-ajat" },
            { "messages", "Viestit" },
            { "appointments", "Tapaamiset" },
            { "photos", "Kuvat" },
            { "completions", "Kuittaukset" },
            { "activities", "Puuhaa-asetukset" }
        };
    }

    public async Task<Photo?> GetFallbackPhotoAsync(string clientId)
    {
        if (string.IsNullOrEmpty(_webAppUrl))
        {
            Console.WriteLine("Google Sheets Web App URL not configured");
            return null;
        }

        try
        {
            var url = $"{_webAppUrl}?spreadsheetId={_sheetsId}&sheetName={_sheetNames["photos"]}";
            Console.WriteLine($"Fetching photos from Google Sheets Web App: {url}");

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"Google Sheets Web App request failed: {response.StatusCode}");
                return null;
            }

            var jsonContent = await response.Content.ReadAsStringAsync();
            var sheetsResponse = JsonSerializer.Deserialize<GoogleSheetsResponse>(jsonContent);

            if (sheetsResponse?.Success != true || sheetsResponse.Values == null || sheetsResponse.Values.Count <= 1)
            {
                Console.WriteLine("No photo data found in Google Sheets response");
                return null;
            }

            // Find photos for this client (skip header row)
            var clientPhotos = sheetsResponse.Values.Skip(1)
                .Where(row => row.Count > 0 && 
                             string.Equals(row[0], clientId, StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (!clientPhotos.Any())
            {
                Console.WriteLine($"No photos found for client: {clientId}");
                
                // Log available clients for debugging
                var availableClients = sheetsResponse.Values.Skip(1)
                    .Where(row => row.Count > 0)
                    .Select(row => row[0])
                    .Distinct()
                    .ToList();
                Console.WriteLine($"Available clients: {string.Join(", ", availableClients)}");
                
                return null;
            }

            // Select photo based on current date
            var today = DateTime.Now;
            var photoIndex = today.Day % clientPhotos.Count;
            var selectedPhotoRow = clientPhotos[photoIndex];

            var photo = new Photo
            {
                Id = $"sheets_photo_{clientId}_{photoIndex}",
                ClientId = clientId,
                Url = selectedPhotoRow.Count > 1 ? selectedPhotoRow[1] : string.Empty,
                Caption = selectedPhotoRow.Count > 2 ? selectedPhotoRow[2] : $"Photo {photoIndex + 1}",
                UploadSource = "google_sheets_fallback",
                IsActive = true,
                Tags = new List<string> { "fallback", "google_sheets" }
            };

            Console.WriteLine($"Selected photo from Google Sheets for {clientId}: {photo.Caption}");
            return photo;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching photo from Google Sheets: {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// Get data from any Google Sheets tab for migration to Cosmos DB
    /// </summary>
    public async Task<List<List<string>>?> GetSheetDataAsync(string sheetType)
    {
        if (string.IsNullOrEmpty(_webAppUrl) || !_sheetNames.ContainsKey(sheetType))
        {
            Console.WriteLine($"Google Sheets Web App URL not configured or invalid sheet type: {sheetType}");
            return null;
        }

        try
        {
            var sheetName = _sheetNames[sheetType];
            var url = $"{_webAppUrl}?spreadsheetId={_sheetsId}&sheetName={sheetName}";
            Console.WriteLine($"Fetching {sheetType} from Google Sheets Web App: {url}");

            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"Google Sheets Web App request failed: {response.StatusCode}");
                return null;
            }

            var jsonContent = await response.Content.ReadAsStringAsync();
            var sheetsResponse = JsonSerializer.Deserialize<GoogleSheetsResponse>(jsonContent);

            if (sheetsResponse?.Success != true || sheetsResponse.Values == null)
            {
                Console.WriteLine($"No data found in Google Sheets for {sheetType}");
                return null;
            }

            Console.WriteLine($"Retrieved {sheetsResponse.Values.Count} rows from {sheetType}");
            return sheetsResponse.Values;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching {sheetType} from Google Sheets: {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// Get complete client data from all Google Sheets tabs
    /// </summary>
    public async Task<GoogleSheetsClientData?> GetCompleteClientDataAsync(string clientId)
    {
        try
        {
            var clientData = new GoogleSheetsClientData { ClientId = clientId };

            // Get Config data
            var configData = await GetSheetDataAsync("config");
            if (configData != null && configData.Count > 1)
            {
                var configRow = configData.Skip(1).FirstOrDefault(row => 
                    row.Count > 0 && string.Equals(row[0], clientId, StringComparison.OrdinalIgnoreCase));
                if (configRow != null) clientData.ConfigRow = configRow;
            }

            // Get all other sheet data
            clientData.MedicationsData = await GetSheetDataAsync("medications");
            clientData.FoodsData = await GetSheetDataAsync("foods");
            clientData.MessagesData = await GetSheetDataAsync("messages");
            clientData.AppointmentsData = await GetSheetDataAsync("appointments");
            clientData.PhotosData = await GetSheetDataAsync("photos");
            clientData.CompletionsData = await GetSheetDataAsync("completions");

            return clientData;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error getting complete client data: {ex.Message}");
            return null;
        }
    }

    public class GoogleSheetsClientData
    {
        public string ClientId { get; set; } = string.Empty;
        public List<string>? ConfigRow { get; set; }
        public List<List<string>>? MedicationsData { get; set; }
        public List<List<string>>? FoodsData { get; set; }
        public List<List<string>>? MessagesData { get; set; }
        public List<List<string>>? AppointmentsData { get; set; }
        public List<List<string>>? PhotosData { get; set; }
        public List<List<string>>? CompletionsData { get; set; }
    }

    private class GoogleSheetsResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("values")]
        public List<List<string>> Values { get; set; } = new();

        [JsonPropertyName("timestamp")]
        public string Timestamp { get; set; } = string.Empty;

        [JsonPropertyName("sheetName")]
        public string SheetName { get; set; } = string.Empty;

        [JsonPropertyName("rowCount")]
        public int RowCount { get; set; }
    }
}
