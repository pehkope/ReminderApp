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

    public async Task<ApiResult<ReminderApiResponse>> GetDataAsync(string? clientId = null, int? maxRetries = null, int? timeoutOverrideSeconds = null, bool fast = false)
    {
        var actualClientId = clientId ?? _apiSettings.DefaultClientId;
        var actualMaxRetries = maxRetries ?? _apiSettings.MaxRetries;
        var timeoutSeconds = timeoutOverrideSeconds ?? _apiSettings.TimeoutSeconds;
        
        for (int attempt = 1; attempt <= actualMaxRetries; attempt++)
        {
            try
            {
                Console.WriteLine($"API kutsu yritys {attempt}/{actualMaxRetries}");
                Console.WriteLine($"🔧 BaseUrl from config: '{_apiSettings.BaseUrl}'");
                Console.WriteLine($"🔧 GasDirectUrl from config: '{_apiSettings.GasDirectUrl}'");
                // Älä tulosta paljasta API-avainta lokeihin
                var maskedConfiguredKey = string.IsNullOrEmpty(_apiSettings.ApiKey) ? "" : "***";
                Console.WriteLine($"🔧 ApiKey configured: '{(string.IsNullOrEmpty(maskedConfiguredKey) ? "(empty)" : maskedConfiguredKey)}'");
                
                // Fallback for Azure deployment if config loading fails
                var baseUrl = string.IsNullOrEmpty(_apiSettings.BaseUrl) ? _apiSettings.GasDirectUrl : _apiSettings.BaseUrl;
                Console.WriteLine($"🔧 Selected baseUrl: '{baseUrl}' (isEmpty: {string.IsNullOrEmpty(_apiSettings.BaseUrl)})");
                var isProxy = baseUrl.Contains("/api/gas", StringComparison.OrdinalIgnoreCase);
                var apiKey = isProxy ? "" : (string.IsNullOrEmpty(_apiSettings.ApiKey) ? "reminder-tablet-2024" : _apiSettings.ApiKey);
                
                Console.WriteLine($"🔧 Using BaseUrl: '{baseUrl}'");
                var maskedRuntimeKey = string.IsNullOrEmpty(apiKey) ? "" : "***";
                Console.WriteLine($"🔧 Using ApiKey: '{(string.IsNullOrEmpty(maskedRuntimeKey) ? "(empty)" : maskedRuntimeKey)}'");
                
                // Build the Google Apps Script URL
                var targetUrl = string.IsNullOrEmpty(apiKey)
                    ? $"{baseUrl}?clientID={actualClientId}&_t={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}"
                    : $"{baseUrl}?clientID={actualClientId}&apiKey={apiKey}&_t={DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";

                if (fast)
                {
                    targetUrl += "&fast=1";
                }
                
                // Direct API call - let's try without CORS proxy
                var url = targetUrl;
                
                // Maskataan avain urleista
                var safeTargetUrl = string.IsNullOrEmpty(apiKey) ? targetUrl : targetUrl.Replace(apiKey, "***");
                var safeUrl = string.IsNullOrEmpty(apiKey) ? url : url.Replace(apiKey, "***");
                Console.WriteLine($"🌐 Target URL: {safeTargetUrl}");
                Console.WriteLine($"🌐 Request URL: {safeUrl}");
                
                using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(timeoutSeconds));
                
                // First get the raw response to check for errors
                var httpResponse = await _httpClient.GetAsync(url, cts.Token);
                Console.WriteLine($"🔍 HTTP Status: {httpResponse.StatusCode}");
                Console.WriteLine($"🔍 HTTP Headers: {string.Join(", ", httpResponse.Headers.Select(h => $"{h.Key}={string.Join(",", h.Value)}"))}");
                
                var responseText = await httpResponse.Content.ReadAsStringAsync();
                // Korjaa mahdollinen UTF-8 mojibake (Ã¤/Ã¶) jos lähde on väärin merkitty
                var repaired = EncodingHelpers.TryRepairUtf8Mojibake(responseText);
                if (!object.ReferenceEquals(repaired, responseText))
                {
                    Console.WriteLine("🔧 Korjattu merkistö mojibake → UTF-8");
                    responseText = repaired;
                }
                
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
                        ApiResponseNormalizer.NormalizeMojibake(response);
                        Console.WriteLine("✅ API kutsu onnistui");
                        // Debug log for photo
                        Console.WriteLine($"🖼️ Photo URL from API: '{response.DailyPhotoUrl}' Caption: '{response.DailyPhotoCaption}'");
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
            // Fallback URL + asetukset
            var baseUrl = string.IsNullOrEmpty(_apiSettings.BaseUrl)
                ? _apiSettings.GasDirectUrl
                : _apiSettings.BaseUrl;
            var apiKey = string.IsNullOrEmpty(_apiSettings.ApiKey) ? "reminder-tablet-2024" : _apiSettings.ApiKey;
            var clientId = string.IsNullOrEmpty(_apiSettings.DefaultClientId) ? "mom" : _apiSettings.DefaultClientId;

            Console.WriteLine($"🔘 Lähetetään kuittaus GET-pyynnöllä (CORS-välttämiseksi): {taskType} ({timeOfDay})");

            // Rakennetaan URL turvallisesti
            var query = new List<string>
            {
                $"action=acknowledge",
                string.IsNullOrEmpty(apiKey) ? "" : $"apiKey={Uri.EscapeDataString(apiKey)}",
                $"clientID={Uri.EscapeDataString(clientId)}",
                $"taskType={Uri.EscapeDataString(taskType)}",
                $"timeOfDay={Uri.EscapeDataString(timeOfDay)}",
                $"description={Uri.EscapeDataString(description)}",
                $"timestamp={Uri.EscapeDataString(DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"))}"
            }.Where(q => !string.IsNullOrEmpty(q));

            var fullUrl = $"{baseUrl}?{string.Join("&", query)}";

            // Älä paljasta avainta lokeissa
            var safeLogUrl = string.IsNullOrEmpty(apiKey) ? fullUrl : fullUrl.Replace(apiKey, "***");
            Console.WriteLine($"📤 GET URL: {safeLogUrl}");

            var response = await _httpClient.GetAsync(fullUrl);
            
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"✅ Kuittaus onnistui: {responseContent}");
                return true;
            }
            else
            {
                Console.WriteLine($"❌ Kuittaus epäonnistui status: {response.StatusCode}");
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"❌ Virhe vastaus: {errorContent}");
                return false;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Virhe kuittauksessa {taskType}: {ex.Message}");
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

static class EncodingHelpers
{
    public static string TryRepairUtf8Mojibake(string input)
    {
        if (string.IsNullOrEmpty(input)) return input;
        // Heuristiikka: jos esiintyy "Ã" tai "Â", koetetaan korjausta
        if (input.Contains("Ã") || input.Contains("Â") || input.Contains("��"))
        {
            try
            {
                var bytes = System.Text.Encoding.GetEncoding("ISO-8859-1").GetBytes(input);
                var repaired = System.Text.Encoding.UTF8.GetString(bytes);
                return repaired;
            }
            catch { }
        }
        return input;
    }
}

static class ApiResponseNormalizer
{
    public static void NormalizeMojibake(ReminderApiResponse data)
    {
        if (data == null) return;
        // Yleiset päänäkymän tekstit
        if (!string.IsNullOrEmpty(data.ImportantMessage))
            data.ImportantMessage = EncodingHelpers.TryRepairUtf8Mojibake(data.ImportantMessage);
        if (!string.IsNullOrEmpty(data.DailyPhotoCaption))
            data.DailyPhotoCaption = EncodingHelpers.TryRepairUtf8Mojibake(data.DailyPhotoCaption);
        if (!string.IsNullOrEmpty(data.LatestReminder))
            data.LatestReminder = EncodingHelpers.TryRepairUtf8Mojibake(data.LatestReminder);
        if (data.Weather != null && !string.IsNullOrEmpty(data.Weather.Description))
            data.Weather.Description = EncodingHelpers.TryRepairUtf8Mojibake(data.Weather.Description);
        if (!string.IsNullOrEmpty(data.Greeting))
            data.Greeting = EncodingHelpers.TryRepairUtf8Mojibake(data.Greeting);
        if (!string.IsNullOrEmpty(data.ActivityText))
            data.ActivityText = EncodingHelpers.TryRepairUtf8Mojibake(data.ActivityText);

        // Tulevat tapahtumat
        if (data.UpcomingAppointments != null)
        {
            foreach (var a in data.UpcomingAppointments)
            {
                if (a == null) continue;
                if (!string.IsNullOrEmpty(a.Message)) a.Message = EncodingHelpers.TryRepairUtf8Mojibake(a.Message);
                if (!string.IsNullOrEmpty(a.Location)) a.Location = EncodingHelpers.TryRepairUtf8Mojibake(a.Location);
                if (!string.IsNullOrEmpty(a.Type)) a.Type = EncodingHelpers.TryRepairUtf8Mojibake(a.Type);
            }
        }

        // Päivän tehtävät
        if (data.DailyTasks != null)
        {
            foreach (var t in data.DailyTasks)
            {
                if (t == null) continue;
                if (!string.IsNullOrEmpty(t.Message)) t.Message = EncodingHelpers.TryRepairUtf8Mojibake(t.Message);
                if (!string.IsNullOrEmpty(t.Description)) t.Description = EncodingHelpers.TryRepairUtf8Mojibake(t.Description);
                if (!string.IsNullOrEmpty(t.Type)) t.Type = EncodingHelpers.TryRepairUtf8Mojibake(t.Type);
            }
        }

        // Yhteystiedot
        if (data.Contacts != null)
        {
            foreach (var c in data.Contacts)
            {
                if (c == null) continue;
                if (!string.IsNullOrEmpty(c.Name)) c.Name = EncodingHelpers.TryRepairUtf8Mojibake(c.Name);
                if (!string.IsNullOrEmpty(c.Relationship)) c.Relationship = EncodingHelpers.TryRepairUtf8Mojibake(c.Relationship);
            }
        }

        // Viikkosuunnitelma
        if (data.WeeklyPlan?.Days != null)
        {
            foreach (var d in data.WeeklyPlan.Days)
            {
                if (d == null) continue;
                if (!string.IsNullOrEmpty(d.Label)) d.Label = EncodingHelpers.TryRepairUtf8Mojibake(d.Label);
                if (d.Meals != null)
                {
                    for (int i = 0; i < d.Meals.Count; i++)
                    {
                        if (!string.IsNullOrEmpty(d.Meals[i])) d.Meals[i] = EncodingHelpers.TryRepairUtf8Mojibake(d.Meals[i]);
                    }
                }
                if (d.Events != null)
                {
                    for (int i = 0; i < d.Events.Count; i++)
                    {
                        if (!string.IsNullOrEmpty(d.Events[i])) d.Events[i] = EncodingHelpers.TryRepairUtf8Mojibake(d.Events[i]);
                    }
                }
            }
        }
    }
}
