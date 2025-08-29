using System.Net;
using System.Web;

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
    }

    public async Task<HttpResponseMessage> ForwardGetAsync(HttpRequestMessage incoming)
    {
        var uri = incoming.RequestUri ?? new Uri("/");
        var query = HttpUtility.ParseQueryString(uri.Query);

        // Inject apiKey if not present
        if (string.IsNullOrWhiteSpace(query["apiKey"]) && !string.IsNullOrEmpty(_gasApiKey))
        {
            query.Set("apiKey", _gasApiKey);
        }

        // Build target query
        var queryPairs = query.AllKeys
            .Where(k => k != null)
            .Select(k => $"{WebUtility.UrlEncode(k!)}={WebUtility.UrlEncode(query[k])}");
        var targetUrl = $"{_gasBaseUrl}?{string.Join("&", queryPairs)}";

        var request = new HttpRequestMessage(HttpMethod.Get, targetUrl);
        return await _httpClient.SendAsync(request);
    }
}
