using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using System.Net;

namespace ReminderApp.Functions;

/// <summary>
/// Simple test endpoint to verify Telegram webhook routing works
/// </summary>
public class TelegramTestApi
{
    private readonly ILogger _logger;

    public TelegramTestApi(ILoggerFactory loggerFactory)
    {
        _logger = loggerFactory.CreateLogger<TelegramTestApi>();
    }

    [Function("TelegramTest")]
    public async Task<HttpResponseData> TestWebhook(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = "telegram/test")] 
        HttpRequestData req)
    {
        _logger.LogInformation("✅ Telegram test endpoint called!");

        var response = req.CreateResponse(HttpStatusCode.OK);
        await response.WriteAsJsonAsync(new
        {
            success = true,
            message = "Telegram test endpoint works! (12.40)",
            timestamp = DateTime.UtcNow
        });

        return response;
    }
}


