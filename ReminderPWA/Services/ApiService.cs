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
                
                var url = string.IsNullOrEmpty(_apiSettings.ApiKey) 
                    ? $"{_apiSettings.BaseUrl}?clientID={actualClientId}&_t={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}"
                    : $"{_apiSettings.BaseUrl}?clientID={actualClientId}&apiKey={_apiSettings.ApiKey}&_t={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
                
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(_apiSettings.TimeoutSeconds));
                
                // First get the raw response to check for errors
                var httpResponse = await _httpClient.GetAsync(url, cts.Token);
                var responseText = await httpResponse.Content.ReadAsStringAsync();
                
                Console.WriteLine($"📋 API vastaus: {responseText.Substring(0, Math.Min(200, responseText.Length))}...");
                
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
                
                Console.WriteLine("⚠️ API palautti null");
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