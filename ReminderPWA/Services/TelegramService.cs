using System.Text.Json;
using System.Net.Http.Json;
using ReminderTabletNew2.Models;

namespace ReminderTabletNew2.Services
{
    public class TelegramService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiUrl = "https://script.google.com/macros/s/AKfycbwwHZ3mPQZCWmN39d2y5advn7YWez6kBpOjg8x0oHN2wNTXqz0hYMql1ylrs4fUXu7V7A/exec";

        public TelegramService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<TelegramResponse> SendMessageAsync(string message, string sender = "Äiti")
        {
            try
            {
                var postData = new
                {
                    action = "sendTelegram",
                    clientID = "mom",
                    message = message,
                    sender = sender,
                    timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                };

                var response = await _httpClient.PostAsJsonAsync(_apiUrl, postData);
                
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    
                    // Try parse response - if successful JSON, return success
                    try
                    {
                        var jsonResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);
                        return new TelegramResponse 
                        { 
                            Success = true, 
                            Message = "Viesti lähetetty onnistuneesti Telegramiin! 📱✅" 
                        };
                    }
                    catch
                    {
                        // If not JSON, check if response indicates success
                        var isSuccess = responseContent.Contains("success", StringComparison.OrdinalIgnoreCase) ||
                                       responseContent.Contains("sent", StringComparison.OrdinalIgnoreCase) ||
                                       response.IsSuccessStatusCode;
                        
                        return new TelegramResponse 
                        { 
                            Success = isSuccess, 
                            Message = isSuccess ? "Viesti lähetetty Telegramiin! 📱✅" : $"Odottamaton vastaus: {responseContent}" 
                        };
                    }
                }
                else
                {
                    return new TelegramResponse 
                    { 
                        Success = false, 
                        Message = $"Virhe lähetyksessä: {response.StatusCode}" 
                    };
                }
            }
            catch (Exception ex)
            {
                return new TelegramResponse 
                { 
                    Success = false, 
                    Message = $"Telegram virhe: {ex.Message}" 
                };
            }
        }

        public async Task<bool> CheckTelegramStatusAsync()
        {
            try
            {
                var apiUrl = $"{_apiUrl}?clientID=mom";
                var response = await _httpClient.GetFromJsonAsync<ReminderApiResponse>(apiUrl);
                
                return response?.Settings?.UseTelegram == true;
            }
            catch
            {
                return false;
            }
        }
    }

    public class TelegramResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = "";
    }
} 