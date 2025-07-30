using System.Net.Http.Json;
using ReminderTabletNew2.Models;

namespace ReminderTabletNew2.Services;

public class ApiService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiUrl = "https://script.google.com/macros/s/AKfycbwwHZ3mPQZCWmN39d2y5advn7YWez6kBpOjg8x0oHN2wNTXqz0hYMql1ylrs4fUXu7V7A/exec";

    public ApiService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<ApiResult<ReminderApiResponse>> GetDataAsync(string clientId = "mom", int maxRetries = 3)
    {
        for (int attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                Console.WriteLine($"API kutsu yritys {attempt}/{maxRetries}");
                
                var url = $"{_apiUrl}?clientID={clientId}&_t={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
                
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(15)); // 15s timeout per attempt
                var response = await _httpClient.GetFromJsonAsync<ReminderApiResponse>(url, cts.Token);
                
                if (response != null)
                {
                    Console.WriteLine("✅ API kutsu onnistui");
                    return ApiResult<ReminderApiResponse>.Success(response);
                }
                
                Console.WriteLine("⚠️ API palautti null");
            }
            catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException || ex.CancellationToken.IsCancellationRequested)
            {
                Console.WriteLine($"⏰ Timeout yritys {attempt}/{maxRetries}");
                if (attempt == maxRetries)
                {
                    return ApiResult<ReminderApiResponse>.Failure("API_TIMEOUT", "API vastaa liian hitaasti");
                }
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"🌐 HTTP virhe yritys {attempt}/{maxRetries}: {ex.Message}");
                if (attempt == maxRetries)
                {
                    return ApiResult<ReminderApiResponse>.Failure("NETWORK_ERROR", $"Verkkoyhteys ongelma: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Yleinen virhe yritys {attempt}/{maxRetries}: {ex.Message}");
                if (attempt == maxRetries)
                {
                    return ApiResult<ReminderApiResponse>.Failure("GENERAL_ERROR", ex.Message);
                }
            }

            // Wait before retry (exponential backoff)
            if (attempt < maxRetries)
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