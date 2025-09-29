using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using ReminderApp.Functions.Services;
using System.Net;
using System.Text.Json;

namespace ReminderApp.Functions;

public class MessagesApi
{
    private readonly ILogger _logger;
    private readonly GoogleSheetsService _googleSheetsService;

    public MessagesApi(ILoggerFactory loggerFactory, GoogleSheetsService googleSheetsService)
    {
        _logger = loggerFactory.CreateLogger<MessagesApi>();
        _googleSheetsService = googleSheetsService;
    }

    [Function("MessagesApi")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "api/messages")] 
        HttpRequestData req)
    {
        _logger.LogInformation("MessagesAPI called");

        try
        {
            var clientId = GetQueryParameter(req, "clientID") ?? "mom";
            _logger.LogInformation("Fetching messages for client: {ClientId}", clientId);

            var messagesData = await _googleSheetsService.GetSheetDataAsync("messages");
            
            if (messagesData == null || messagesData.Count <= 1)
            {
                return await CreateJsonResponse(req, new
                {
                    success = false,
                    message = "Viesti-välilehti ei ole käytössä tai ei sisällä dataa",
                    clientID = clientId,
                    messages = new List<object>()
                });
            }

            // Parse messages from Google Sheets
            var messages = new List<object>();
            
            // Skip header row and process data
            foreach (var row in messagesData.Skip(1))
            {
                if (row.Count < 2) continue; // Need at least ClientID and Message
                
                // Check if this message is for our client or is global
                var messageClientId = row[0]?.Trim();
                if (!string.IsNullOrEmpty(messageClientId) && 
                    !string.Equals(messageClientId, clientId, StringComparison.OrdinalIgnoreCase) &&
                    !string.Equals(messageClientId, "all", StringComparison.OrdinalIgnoreCase))
                {
                    continue; // Skip messages not for this client
                }

                var message = new
                {
                    clientId = messageClientId,
                    message = row.Count > 1 ? row[1] : "",
                    category = row.Count > 2 ? row[2] : "general",
                    priority = row.Count > 3 ? row[3] : "normal",
                    timestamp = row.Count > 4 ? row[4] : "",
                    isActive = row.Count > 5 ? ParseBool(row[5]) : true
                };

                if (!string.IsNullOrWhiteSpace(message.message))
                {
                    messages.Add(message);
                }
            }

            _logger.LogInformation("Found {MessageCount} messages for client {ClientId}", messages.Count, clientId);

            var response = new
            {
                success = true,
                clientID = clientId,
                timestamp = DateTime.UtcNow.ToString("O"),
                messageCount = messages.Count,
                messages = messages.OrderByDescending(m => 
                {
                    var msgObj = (dynamic)m;
                    return msgObj.priority == "high" ? 2 : msgObj.priority == "medium" ? 1 : 0;
                }).ToList()
            };

            return await CreateJsonResponse(req, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in MessagesAPI");
            return await CreateErrorResponse(req, HttpStatusCode.InternalServerError, "Virhe viestien haussa", ex.Message);
        }
    }

    private static string? GetQueryParameter(HttpRequestData req, string paramName)
    {
        var query = System.Web.HttpUtility.ParseQueryString(req.Url.Query);
        return query[paramName];
    }

    private static bool ParseBool(string value)
    {
        if (string.IsNullOrWhiteSpace(value)) return true;
        
        return value.ToLowerInvariant() switch
        {
            "true" or "1" or "yes" or "kyllä" or "k" => true,
            "false" or "0" or "no" or "ei" or "e" => false,
            _ => true
        };
    }

    private async Task<HttpResponseData> CreateJsonResponse(HttpRequestData req, object data)
    {
        var response = req.CreateResponse(HttpStatusCode.OK);
        response.Headers.Add("Content-Type", "application/json; charset=utf-8");
        response.Headers.Add("Access-Control-Allow-Origin", "*");
        response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");

        var json = JsonSerializer.Serialize(data, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
        });
        
        await response.WriteStringAsync(json);
        return response;
    }

    private async Task<HttpResponseData> CreateErrorResponse(HttpRequestData req, HttpStatusCode statusCode, string message, string? details = null)
    {
        var response = req.CreateResponse(statusCode);
        response.Headers.Add("Content-Type", "application/json; charset=utf-8");
        response.Headers.Add("Access-Control-Allow-Origin", "*");

        var errorResponse = new
        {
            success = false,
            error = message,
            details = details ?? "",
            timestamp = DateTime.UtcNow.ToString("O")
        };

        var json = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions 
        { 
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
        });
        
        await response.WriteStringAsync(json);
        return response;
    }
}
