using System.Net;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Configuration;
using System.Text;

namespace GasProxyFunctions;

public class GasProxy
{
    private readonly Proxy.GasForwarder _forwarder;
    private readonly string _allowedOrigins;

    public GasProxy(Proxy.GasForwarder forwarder, IConfiguration configuration)
    {
        _forwarder = forwarder;
        _allowedOrigins = configuration["ALLOWED_ORIGINS"] ?? "*";
    }

    [Function("GasGet")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "gas")] HttpRequestData req,
        FunctionContext executionContext)
    {
        var logger = executionContext.GetLogger("GasGet");

        // Build an HttpRequestMessage from HttpRequestData
        var uriBuilder = new UriBuilder(req.Url);
        var incoming = new HttpRequestMessage(HttpMethod.Get, uriBuilder.Uri);

        var upstreamResponse = await _forwarder.ForwardGetAsync(incoming);

        var response = req.CreateResponse(upstreamResponse.StatusCode);
        response.Headers.Add("Access-Control-Allow-Origin", _allowedOrigins);
        response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");
        response.Headers.Add("X-Content-Type-Options", "nosniff");

        var contentType = upstreamResponse.Content.Headers.ContentType?.ToString();
        if (string.IsNullOrWhiteSpace(contentType))
        {
            contentType = "application/json; charset=utf-8";
        }
        response.Headers.Add("Content-Type", contentType);

        using (var upstreamStream = await upstreamResponse.Content.ReadAsStreamAsync())
        {
            await upstreamStream.CopyToAsync(response.Body);
        }
        return response;
    }

    [Function("GasOptions")]
    public HttpResponseData Options(
        [HttpTrigger(AuthorizationLevel.Anonymous, "options", Route = "gas")] HttpRequestData req,
        FunctionContext ctx)
    {
        var response = req.CreateResponse(HttpStatusCode.OK);
        response.Headers.Add("Access-Control-Allow-Origin", _allowedOrigins);
        response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS");
        response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");
        return response;
    }
}
