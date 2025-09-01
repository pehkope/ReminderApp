using System.Net;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;

namespace GasProxyFunctions.Proxy;

public class GasForwarder
{
    private readonly HttpClient _httpClient;
    private readonly string _gasBaseUrl;
    private readonly string _gasApiKey;

    public GasForwarder(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _gasBaseUrl = configuration["GAS_BASE_URL"] ?? string.Empty;
        _gasApiKey = configuration["GAS_API_KEY"] ?? string.Empty;

        // Prefer UTF-8 JSON from upstream
        try
        {
            _httpClient.DefaultRequestHeaders.Accept.Clear();
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            _httpClient.DefaultRequestHeaders.AcceptCharset.Clear();
            _httpClient.DefaultRequestHeaders.AcceptCharset.Add(new StringWithQualityHeaderValue("utf-8"));
        }
        catch { }
    }

    public async Task<HttpResponseMessage> ForwardGetAsync(HttpRequestMessage incoming)
    {
        var uri = incoming.RequestUri ?? new Uri("/");
        var parsed = QueryHelpers.ParseQuery(uri.Query);
        var queryParams = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        foreach (var kv in parsed)
        {
            // Use last value if multiple
            queryParams[kv.Key] = kv.Value.LastOrDefault();
        }

        // Inject apiKey if not present
        if (!queryParams.ContainsKey("apiKey") && !string.IsNullOrEmpty(_gasApiKey))
        {
            queryParams["apiKey"] = _gasApiKey;
        }

        var targetUrl = QueryHelpers.AddQueryString(_gasBaseUrl, queryParams!);

        var request = new HttpRequestMessage(HttpMethod.Get, targetUrl);
        return await _httpClient.SendAsync(request);
    }
}
