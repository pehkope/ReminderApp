using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using ReminderApp.Functions.Services;
using System.Net;
using System.Text.Json;

namespace ReminderApp.Functions;

public class TwilioApi
{
    private readonly ILogger _logger;
    private readonly TwilioService _twilioService;

    public TwilioApi(ILoggerFactory loggerFactory, TwilioService twilioService)
    {
        _logger = loggerFactory.CreateLogger<TwilioApi>();
        _twilioService = twilioService;
    }

    /// <summary>
    /// Generate Twilio access token for voice calls
    /// </summary>
    [Function("TwilioToken")]
    public async Task<HttpResponseData> GetToken(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/twilio/token")] 
        HttpRequestData req)
    {
        _logger.LogInformation("Twilio token request received");

        try
        {
            if (!_twilioService.IsConfigured)
            {
                return await CreateErrorResponse(req, HttpStatusCode.ServiceUnavailable, 
                    "Twilio not configured", "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN required");
            }

            var clientId = GetQueryParameter(req, "clientID") ?? "default";
            var identity = GetQueryParameter(req, "identity") ?? $"user-{clientId}";

            // Note: For voice token generation, you'd need Twilio.Jwt package
            // This is a placeholder - actual token generation requires additional setup
            var response = new
            {
                success = true,
                clientID = clientId,
                identity = identity,
                message = "Token generation requires Twilio.Jwt package setup",
                timestamp = DateTime.UtcNow.ToString("O")
            };

            return await CreateJsonResponse(req, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating Twilio token");
            return await CreateErrorResponse(req, HttpStatusCode.InternalServerError, 
                "Token generation failed", ex.Message);
        }
    }

    /// <summary>
    /// Handle voice calls - return TwiML response
    /// </summary>
    [Function("VoiceTwiML")]
    public async Task<HttpResponseData> HandleVoiceCall(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = "api/twilio/voice")] 
        HttpRequestData req)
    {
        _logger.LogInformation("Voice TwiML request: {Method}", req.Method);

        try
        {
            var clientId = GetQueryParameter(req, "clientID") ?? "default";
            var from = GetQueryParameter(req, "From") ?? "";
            var to = GetQueryParameter(req, "To") ?? "";

            _logger.LogInformation("📞 Voice call: {From} → {To} (client: {ClientId})", from, to, clientId);

            var twimlResponse = _twilioService.GenerateVoiceTwiML(clientId);

            var response = req.CreateResponse(HttpStatusCode.OK);
            response.Headers.Add("Content-Type", "application/xml; charset=utf-8");
            response.Headers.Add("Access-Control-Allow-Origin", "*");
            
            await response.WriteStringAsync(twimlResponse);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating voice TwiML");
            
            // Return error as TwiML
            var errorTwiML = _twilioService.GenerateVoiceTwiML(null, 
                "Pahoittelut, järjestelmässä on ongelma. Yritä myöhemmin uudelleen.");

            var response = req.CreateResponse(HttpStatusCode.OK);
            response.Headers.Add("Content-Type", "application/xml; charset=utf-8");
            await response.WriteStringAsync(errorTwiML);
            return response;
        }
    }

    /// <summary>
    /// Handle SMS messages - return TwiML response
    /// </summary>
    [Function("SmsTwiML")]
    public async Task<HttpResponseData> HandleSmsMessage(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/twilio/sms")] 
        HttpRequestData req)
    {
        _logger.LogInformation("SMS TwiML request received");

        try
        {
            // Parse form data from Twilio webhook
            var body = await req.ReadAsStringAsync();
            var formData = System.Web.HttpUtility.ParseQueryString(body ?? "");
            
            var from = formData["From"] ?? "";
            var messageBody = formData["Body"] ?? "";
            var to = formData["To"] ?? "";

            _logger.LogInformation("📱 SMS received: {From} → {To}: \"{Message}\"", from, to, messageBody);

            var twimlResponse = _twilioService.GenerateSmsTwiML(messageBody);

            var response = req.CreateResponse(HttpStatusCode.OK);
            response.Headers.Add("Content-Type", "application/xml; charset=utf-8");
            response.Headers.Add("Access-Control-Allow-Origin", "*");
            
            await response.WriteStringAsync(twimlResponse);
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling SMS message");
            
            // Return error as TwiML
            var errorTwiML = _twilioService.GenerateSmsTwiML();

            var response = req.CreateResponse(HttpStatusCode.OK);
            response.Headers.Add("Content-Type", "application/xml; charset=utf-8");
            await response.WriteStringAsync(errorTwiML);
            return response;
        }
    }

    /// <summary>
    /// Send emergency notification
    /// </summary>
    [Function("EmergencyNotification")]
    public async Task<HttpResponseData> SendEmergencyNotification(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/twilio/emergency")] 
        HttpRequestData req)
    {
        _logger.LogInformation("Emergency notification request received");

        try
        {
            if (!_twilioService.IsConfigured)
            {
                return await CreateErrorResponse(req, HttpStatusCode.ServiceUnavailable, 
                    "Twilio not configured");
            }

            var requestBody = await req.ReadAsStringAsync();
            var requestData = JsonSerializer.Deserialize<Dictionary<string, object>>(requestBody ?? "{}");

            var clientId = requestData?.GetValueOrDefault("clientID")?.ToString() ?? "default";
            var toNumber = requestData?.GetValueOrDefault("toNumber")?.ToString();
            var details = requestData?.GetValueOrDefault("details")?.ToString();

            if (string.IsNullOrEmpty(toNumber))
            {
                return await CreateErrorResponse(req, HttpStatusCode.BadRequest, 
                    "toNumber is required");
            }

            _logger.LogWarning("🚨 EMERGENCY notification for client: {ClientId} to: {ToNumber}", clientId, toNumber);

            var success = await _twilioService.SendEmergencyNotificationAsync(toNumber, clientId, details);

            var response = new
            {
                success,
                message = success ? "Emergency notification sent" : "Failed to send notification",
                clientID = clientId,
                timestamp = DateTime.UtcNow.ToString("O")
            };

            return await CreateJsonResponse(req, response, success ? HttpStatusCode.OK : HttpStatusCode.InternalServerError);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending emergency notification");
            return await CreateErrorResponse(req, HttpStatusCode.InternalServerError, 
                "Emergency notification failed", ex.Message);
        }
    }

    private static string? GetQueryParameter(HttpRequestData req, string paramName)
    {
        return req.Query.AllKeys.Contains(paramName) ? req.Query[paramName] : null;
    }

    private async Task<HttpResponseData> CreateJsonResponse<T>(HttpRequestData req, T data, HttpStatusCode statusCode = HttpStatusCode.OK)
    {
        var response = req.CreateResponse(statusCode);
        response.Headers.Add("Content-Type", "application/json; charset=utf-8");
        response.Headers.Add("Access-Control-Allow-Origin", "*");
        response.Headers.Add("X-Content-Type-Options", "nosniff");
        response.Headers.Add("X-Frame-Options", "DENY");
        
        var json = JsonSerializer.Serialize(data, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
        });
        await response.WriteStringAsync(json);
        
        return response;
    }

    private async Task<HttpResponseData> CreateErrorResponse(HttpRequestData req, HttpStatusCode statusCode, string error, string? details = null)
    {
        var errorData = new
        {
            success = false,
            error,
            message = details,
            timestamp = DateTime.UtcNow.ToString("O")
        };

        return await CreateJsonResponse(req, errorData, statusCode);
    }
}
