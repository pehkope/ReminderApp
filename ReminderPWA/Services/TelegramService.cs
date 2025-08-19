using System.Text.Json;
using System.Net.Http.Json;
using ReminderTabletNew2.Models;

namespace ReminderTabletNew2.Services
{
    public class TelegramService
    {
        private readonly HttpClient _httpClient;
        private readonly ApiSettings _apiSettings;
        private const string _legacyTelegramUrl = "https://script.google.com/macros/s/AKfycbwwHZ3mPQZCWmN39d2y5advn7YWez6kBpOjg8x0oHN2wNTXqz0hYMql1ylrs4fUXu7V7A/exec";

        public TelegramService(HttpClient httpClient, AppConfig config)
        {
            _httpClient = httpClient;
            _apiSettings = config.ApiSettings;
        }

        public async Task<TelegramResponse> SendMessageAsync(string message, string sender = "Äiti", string? targetChatId = null)
        {
            try
            {
                var baseUrl = string.IsNullOrEmpty(_apiSettings.BaseUrl) ? _legacyTelegramUrl : _apiSettings.BaseUrl;
                var apiKey = string.IsNullOrEmpty(_apiSettings.ApiKey) ? "reminder-tablet-2024" : _apiSettings.ApiKey;
                var clientId = string.IsNullOrEmpty(_apiSettings.DefaultClientId) ? "mom" : _apiSettings.DefaultClientId;

                var url = $"{baseUrl}?action=sendTelegram&clientID={Uri.EscapeDataString(clientId)}&apiKey={Uri.EscapeDataString(apiKey)}&sender={Uri.EscapeDataString(sender)}&message={Uri.EscapeDataString(message)}&timestamp={Uri.EscapeDataString(DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"))}";
                if (!string.IsNullOrWhiteSpace(targetChatId))
                {
                    url += $"&chatId={Uri.EscapeDataString(targetChatId)}";
                }

                var response = await _httpClient.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    try
                    {
                        var _ = JsonSerializer.Deserialize<JsonElement>(responseContent);
                        return new TelegramResponse { Success = true, Message = "Viesti lähetetty onnistuneesti Telegramiin! 📱✅" };
                    }
                    catch
                    {
                        var isSuccess = responseContent.Contains("success", StringComparison.OrdinalIgnoreCase) ||
                                       responseContent.Contains("sent", StringComparison.OrdinalIgnoreCase) ||
                                       response.IsSuccessStatusCode;
                        return new TelegramResponse { Success = isSuccess, Message = isSuccess ? "Viesti lähetetty Telegramiin! 📱✅" : $"Odottamaton vastaus: {responseContent}" };
                    }
                }
                else
                {
                    return new TelegramResponse { Success = false, Message = $"Virhe lähetyksessä: {response.StatusCode}" };
                }
            }
            catch (Exception ex)
            {
                return new TelegramResponse { Success = false, Message = $"Telegram virhe: {ex.Message}" };
            }
        }

        public async Task<bool> CheckTelegramStatusAsync()
        {
            try
            {
                var baseUrl = string.IsNullOrEmpty(_apiSettings.BaseUrl) ? _legacyTelegramUrl : _apiSettings.BaseUrl;
                var apiKey = string.IsNullOrEmpty(_apiSettings.ApiKey) ? "reminder-tablet-2024" : _apiSettings.ApiKey;
                var clientId = string.IsNullOrEmpty(_apiSettings.DefaultClientId) ? "mom" : _apiSettings.DefaultClientId;

                var url = string.IsNullOrEmpty(apiKey)
                    ? $"{baseUrl}?clientID={Uri.EscapeDataString(clientId)}"
                    : $"{baseUrl}?clientID={Uri.EscapeDataString(clientId)}&apiKey={Uri.EscapeDataString(apiKey)}";

                var response = await _httpClient.GetFromJsonAsync<ReminderApiResponse>(url);
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