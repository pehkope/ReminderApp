using ReminderApp.Functions.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ReminderApp.Functions.Services;

public class GoogleSheetsService
{
    private readonly HttpClient _httpClient;
    private readonly string? _webAppUrl;
    private readonly string _sheetsId;
    private readonly string _photosSheetName;

    public GoogleSheetsService()
    {
        _httpClient = new HttpClient();
        _webAppUrl = Environment.GetEnvironmentVariable("SHEETS_WEBAPP_URL");
        _sheetsId = "14i3QPYquqSqyE7fTp_pa2LNBq2Jb_re2rwsuUpRRSHo";
        _photosSheetName = "Kuvat";
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
            var url = $"{_webAppUrl}?spreadsheetId={_sheetsId}&sheetName={_photosSheetName}";
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
