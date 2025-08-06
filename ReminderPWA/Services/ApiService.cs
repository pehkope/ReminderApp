using System.Net.Http.Json;
using ReminderTabletNew2.Models;

namespace ReminderTabletNew2.Services;

public class ApiService
{
    private readonly HttpClient _httpClient;
    private readonly ApiSettings _apiSettings;

    public ApiService(HttpClient httpClient, AppConfig config)
    {
        _httpClient = httpClient;
        //
        _apiSettings = config.ApiSettings;
    }

    public async Task<ApiResult<ReminderApiResponse>> GetDataAsync(string? clientId = null, int? maxRetries = null)
    {
        var actualClientId = clientId ?? _apiSettings.DefaultClientId;
        var actualMaxRetries = maxRetries ?? _apiSettings.MaxRetries;
        
        for (int attempt = 1; attempt <= actualMaxRetries; attempt++)
        {
            try
            {
                Console.WriteLine($"API kutsu yritys {attempt}/{actualMaxRetries}");
                Console.WriteLine($"🔧 BaseUrl: '{_apiSettings.BaseUrl}'");
                Console.WriteLine($"🔧 ApiKey: '{_apiSettings.ApiKey}'");
                
                // Fallback for Azure deployment if config loading fails
                var baseUrl = string.IsNullOrEmpty(_apiSettings.BaseUrl) ? "https://script.google.com/macros/s/AKfycbzRt10UaYWaJMWKEk_T9kHBmLoRbd3wu5tVZOUjqfno8kgg171PB7uK54hFPfgS4LyS8Q/exec" : _apiSettings.BaseUrl;
                    
                var apiKey = string.IsNullOrEmpty(_apiSettings.ApiKey) ? "reminder-tablet-2024" : _apiSettings.ApiKey;
                
                Console.WriteLine($"🔧 Using BaseUrl: '{baseUrl}'");
                Console.WriteLine($"🔧 Using ApiKey: '{apiKey}'");
                
                // Build the Google Apps Script URL
                var targetUrl = string.IsNullOrEmpty(apiKey) 
                    ? $"{baseUrl}?clientID={actualClientId}&_t={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}"
                    : $"{baseUrl}?clientID={actualClientId}&apiKey={apiKey}&_t={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
                
                // Direct API call - let's try without CORS proxy
                var url = targetUrl;
                
                Console.WriteLine($"🌐 Target URL: {targetUrl}");
                Console.WriteLine($"🌐 Request URL: {url}");
                
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(_apiSettings.TimeoutSeconds));
                
                // First get the raw response to check for errors
                var httpResponse = await _httpClient.GetAsync(url, cts.Token);
                Console.WriteLine($"🔍 HTTP Status: {httpResponse.StatusCode}");
                Console.WriteLine($"🔍 HTTP Headers: {string.Join(", ", httpResponse.Headers.Select(h => $"{h.Key}={string.Join(",", h.Value)}"))}");
                
                var responseText = await httpResponse.Content.ReadAsStringAsync();
                
                Console.WriteLine($"📋 API vastaus pituus: {responseText.Length} merkkiä");
                Console.WriteLine($"📋 API vastaus alku: {responseText.Substring(0, Math.Min(500, responseText.Length))}...");
                
                // Check for HTML response (wrong endpoint)
                if (responseText.TrimStart().StartsWith("<!DOCTYPE html>") || responseText.TrimStart().StartsWith("<html"))
                {
                    Console.WriteLine("🌐 API palautti HTML-sivun JSON:n sijaan");
                    return ApiResult<ReminderApiResponse>.Failure("HTML_RESPONSE", "API URL on väärä - palauttaa HTML-sivun");
                }
                
                // Check for common error responses
                if (responseText.Contains("Unauthorized") || responseText.Contains("UNAUTHORIZED"))
                {
                    Console.WriteLine("🔒 API key virhe");
                    return ApiResult<ReminderApiResponse>.Failure("UNAUTHORIZED", "API-avain virheellinen");
                }
                
                if (responseText.Contains("error") || responseText.Contains("Error"))
                {
                    Console.WriteLine("❌ API virheviesti");
                    return ApiResult<ReminderApiResponse>.Failure("API_ERROR", $"API virhe: {responseText}");
                }
                
                // Try to parse as JSON
                try 
                {
                    var response = System.Text.Json.JsonSerializer.Deserialize<ReminderApiResponse>(responseText);
                    if (response != null)
                    {
                        Console.WriteLine("✅ API kutsu onnistui");
                        return ApiResult<ReminderApiResponse>.Success(response);
                    }
                }
                            catch (System.Text.Json.JsonException jsonEx)
            {
                Console.WriteLine($"🔧 JSON parsing virhe: {jsonEx.Message}");
                
                // Handle specific JSON errors
                if (jsonEx.Message.Contains("ExpectedStartOfValueNotFound"))
                {
                    return ApiResult<ReminderApiResponse>.Failure("EMPTY_RESPONSE", "API palautti tyhjän vastauksen");
                }
                
                return ApiResult<ReminderApiResponse>.Failure("JSON_ERROR", $"Virheellinen JSON vastaus: {jsonEx.Message}");
            }
                
                Console.WriteLine("⚠️ API palautti null datan");
            }
            catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException || ex.CancellationToken.IsCancellationRequested)
            {
                Console.WriteLine($"⏰ Timeout yritys {attempt}/{actualMaxRetries}");
                if (attempt == actualMaxRetries)
                {
                    return ApiResult<ReminderApiResponse>.Failure("API_TIMEOUT", "API vastaa liian hitaasti");
                }
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"🌐 HTTP virhe yritys {attempt}/{actualMaxRetries}: {ex.Message}");
                if (attempt == actualMaxRetries)
                {
                    return ApiResult<ReminderApiResponse>.Failure("NETWORK_ERROR", $"Verkkoyhteys ongelma: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Yleinen virhe yritys {attempt}/{actualMaxRetries}: {ex.Message}");
                if (attempt == actualMaxRetries)
                {
                    return ApiResult<ReminderApiResponse>.Failure("GENERAL_ERROR", ex.Message);
                }
            }

            // Wait before retry (exponential backoff)
            if (attempt < actualMaxRetries)
            {
                var delay = TimeSpan.FromSeconds(Math.Pow(2, attempt)); // 2s, 4s, 8s...
                Console.WriteLine($"⏳ Odotetaan {delay.TotalSeconds}s ennen uutta yritystä...");
                await Task.Delay(delay);
            }
        }

        return ApiResult<ReminderApiResponse>.Failure("MAX_RETRIES_EXCEEDED", "Kaikki yritykset epäonnistuivat");
    }

    public async Task<bool> AcknowledgeTaskAsync(string taskType, string timeOfDay, string description = "")
    {
        try
        {
            // Fallback for Azure deployment if config loading fails
            var baseUrl = string.IsNullOrEmpty(_apiSettings.BaseUrl) ? "https://script.google.com/macros/s/AKfycbzRt10UaYWaJMWKEk_T9kHBmLoRbd3wu5tVZOUjqfno8kgg171PB7uK54hFPfgS4LyS8Q/exec" : _apiSettings.BaseUrl;
                
            var apiKey = string.IsNullOrEmpty(_apiSettings.ApiKey) ? "reminder-tablet-2024" : _apiSettings.ApiKey;
            var clientId = string.IsNullOrEmpty(_apiSettings.DefaultClientId) ? "mom" : _apiSettings.DefaultClientId;

            // Build acknowledgment URL with description for unique identification
            var fullUrl = $"{baseUrl}?action=acknowledge&apiKey={apiKey}&clientID={clientId}&taskType={taskType}&timeOfDay={timeOfDay}&description={Uri.EscapeDataString(description)}";

            Console.WriteLine($"Sending acknowledgment request: {taskType} for {timeOfDay}");

            var response = await _httpClient.GetAsync(fullUrl);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Acknowledgment successful: {responseContent}");
                return true;
            }
            else
            {
                Console.WriteLine($"Acknowledgment failed with status: {response.StatusCode}");
                return false;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error acknowledging task {taskType}: {ex.Message}");
            return false;
        }
    }
}

public class ApiResult<T>
{
    public bool IsSuccess { get; private set; }
    public T? Data { get; private set; }
    public string ErrorCode { get; private set; } = "";
    public string ErrorMessage { get; private set; } = "";

    private ApiResult() { }

    public static ApiResult<T> Success(T data)
    {
        return new ApiResult<T>
        {
            IsSuccess = true,
            Data = data
        };
    }

    public static ApiResult<T> Failure(string errorCode, string errorMessage)
    {
        return new ApiResult<T>
        {
            IsSuccess = false,
            ErrorCode = errorCode,
            ErrorMessage = errorMessage
        };
    }
} 
