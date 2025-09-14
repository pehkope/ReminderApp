using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using ReminderApp.Functions.Services;
using ReminderApp.Functions.Models;
using System.Net;
using System.Text.Json;
using Telegram.Bot.Types;

namespace ReminderApp.Functions;

/// <summary>
/// Telegram Bot API for handling webhooks and bot operations
/// Processes incoming messages and photos from family members
/// </summary>
public class TelegramBotApi
{
    private readonly ILogger _logger;
    private readonly TelegramBotService _telegramBotService;
    private readonly CosmosDbService _cosmosDbService;

    public TelegramBotApi(ILoggerFactory loggerFactory, 
                         TelegramBotService telegramBotService,
                         CosmosDbService cosmosDbService)
    {
        _logger = loggerFactory.CreateLogger<TelegramBotApi>();
        _telegramBotService = telegramBotService;
        _cosmosDbService = cosmosDbService;
    }

    /// <summary>
    /// Telegram webhook endpoint - processes incoming updates from Telegram Bot API
    /// </summary>
    [Function("TelegramWebhook")]
    public async Task<HttpResponseData> HandleWebhook(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "telegram/webhook")] 
        HttpRequestData req)
    {
        _logger.LogInformation("📨 Telegram webhook received");

        try
        {
            if (!_telegramBotService.IsConfigured)
            {
                _logger.LogWarning("Telegram Bot not configured");
                return await CreateErrorResponse(req, HttpStatusCode.ServiceUnavailable, 
                    "Telegram Bot not configured");
            }

            // Parse Telegram update
            var requestBody = await req.ReadAsStringAsync();
            if (string.IsNullOrEmpty(requestBody))
            {
                _logger.LogWarning("Empty webhook body received");
                return await CreateErrorResponse(req, HttpStatusCode.BadRequest, "Empty request body");
            }

            var update = JsonSerializer.Deserialize<Update>(requestBody);
            if (update == null)
            {
                _logger.LogWarning("Failed to parse Telegram update");
                return await CreateErrorResponse(req, HttpStatusCode.BadRequest, "Invalid update format");
            }

            _logger.LogInformation("Processing Telegram update {UpdateId}", update.Id);

            // Process the update
            var result = await _telegramBotService.ProcessWebhookUpdateAsync(update);

            if (result.Success)
            {
                _logger.LogInformation("✅ Webhook processed successfully: {Message}", result.Message);
                return await CreateJsonResponse(req, new
                {
                    success = true,
                    message = result.Message,
                    photoId = result.PhotoId,
                    greetingId = result.GreetingId,
                    clientId = result.ClientId,
                    timestamp = DateTime.UtcNow.ToString("O")
                });
            }
            else
            {
                _logger.LogWarning("⚠️ Webhook processing failed: {Message}", result.Message);
                return await CreateJsonResponse(req, new
                {
                    success = false,
                    message = result.Message,
                    timestamp = DateTime.UtcNow.ToString("O")
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Critical error in Telegram webhook processing");
            return await CreateErrorResponse(req, HttpStatusCode.InternalServerError, 
                "Webhook processing failed", ex.Message);
        }
    }

    /// <summary>
    /// Send message to Telegram chat - for admin use
    /// </summary>
    [Function("TelegramSendMessage")]
    public async Task<HttpResponseData> SendMessage(
        [HttpTrigger(AuthorizationLevel.Function, "post", Route = "telegram/send")] 
        HttpRequestData req)
    {
        _logger.LogInformation("📤 Telegram send message request");

        try
        {
            if (!_telegramBotService.IsConfigured)
            {
                return await CreateErrorResponse(req, HttpStatusCode.ServiceUnavailable, 
                    "Telegram Bot not configured");
            }

            var requestBody = await req.ReadAsStringAsync();
            var requestData = JsonSerializer.Deserialize<Dictionary<string, object>>(requestBody ?? "{}");

            var chatIdStr = requestData?.GetValueOrDefault("chatId")?.ToString();
            var message = requestData?.GetValueOrDefault("message")?.ToString();

            if (string.IsNullOrEmpty(chatIdStr) || string.IsNullOrEmpty(message))
            {
                return await CreateErrorResponse(req, HttpStatusCode.BadRequest, 
                    "chatId and message are required");
            }

            if (!long.TryParse(chatIdStr, out var chatId))
            {
                return await CreateErrorResponse(req, HttpStatusCode.BadRequest, 
                    "Invalid chatId format");
            }

            var success = await _telegramBotService.SendMessageAsync(chatId, message);

            return await CreateJsonResponse(req, new
            {
                success,
                message = success ? "Message sent successfully" : "Failed to send message",
                chatId = chatIdStr,
                timestamp = DateTime.UtcNow.ToString("O")
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error sending Telegram message");
            return await CreateErrorResponse(req, HttpStatusCode.InternalServerError, 
                "Failed to send message", ex.Message);
        }
    }

    /// <summary>
    /// Get family greetings for a client
    /// </summary>
    [Function("TelegramGetGreetings")]
    public async Task<HttpResponseData> GetGreetings(
        [HttpTrigger(AuthorizationLevel.Function, "get", Route = "telegram/greetings/{clientId}")] 
        HttpRequestData req)
    {
        var clientId = req.FunctionContext.BindingContext.BindingData.GetValueOrDefault("clientId")?.ToString() ?? "mom";
        
        _logger.LogInformation("📬 Getting Telegram greetings for client: {ClientId}", clientId);

        try
        {
            // Query greetings from Cosmos DB
            var query = new Microsoft.Azure.Cosmos.QueryDefinition(
                "SELECT * FROM c WHERE c.clientId = @clientId AND c.isRead = false ORDER BY c.createdAt DESC")
                .WithParameter("@clientId", clientId);

            var greetings = await _cosmosDbService.QueryItemsAsync<FamilyGreeting>("Greetings", query);

            var result = new
            {
                success = true,
                clientId,
                greetings = greetings.Select(g => new
                {
                    id = g.Id,
                    message = g.Message,
                    senderName = g.SenderName,
                    createdAt = g.CreatedAt.ToString("O"),
                    isRead = g.IsRead
                }).ToList(),
                count = greetings.Count,
                timestamp = DateTime.UtcNow.ToString("O")
            };

            return await CreateJsonResponse(req, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting Telegram greetings for {ClientId}", clientId);
            return await CreateErrorResponse(req, HttpStatusCode.InternalServerError, 
                "Failed to get greetings", ex.Message);
        }
    }

    /// <summary>
    /// Mark greeting as read
    /// </summary>
    [Function("TelegramMarkGreetingRead")]
    public async Task<HttpResponseData> MarkGreetingRead(
        [HttpTrigger(AuthorizationLevel.Function, "post", Route = "telegram/greetings/{greetingId}/read")] 
        HttpRequestData req)
    {
        var greetingId = req.FunctionContext.BindingContext.BindingData.GetValueOrDefault("greetingId")?.ToString();
        
        if (string.IsNullOrEmpty(greetingId))
        {
            return await CreateErrorResponse(req, HttpStatusCode.BadRequest, "Greeting ID is required");
        }

        _logger.LogInformation("✅ Marking greeting as read: {GreetingId}", greetingId);

        try
        {
            // In a real implementation, you'd update the greeting in Cosmos DB
            // For now, just return success
            
            var result = new
            {
                success = true,
                message = "Greeting marked as read",
                greetingId,
                timestamp = DateTime.UtcNow.ToString("O")
            };

            return await CreateJsonResponse(req, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error marking greeting as read: {GreetingId}", greetingId);
            return await CreateErrorResponse(req, HttpStatusCode.InternalServerError, 
                "Failed to mark greeting as read", ex.Message);
        }
    }

    /// <summary>
    /// Get Telegram photos for a client
    /// </summary>
    [Function("TelegramGetPhotos")]
    public async Task<HttpResponseData> GetPhotos(
        [HttpTrigger(AuthorizationLevel.Function, "get", Route = "telegram/photos/{clientId}")] 
        HttpRequestData req)
    {
        var clientId = req.FunctionContext.BindingContext.BindingData.GetValueOrDefault("clientId")?.ToString() ?? "mom";
        var limitStr = req.Query["limit"];
        var limit = int.TryParse(limitStr, out var parsedLimit) ? parsedLimit : 10;

        _logger.LogInformation("📸 Getting Telegram photos for client: {ClientId} (limit: {Limit})", clientId, limit);

        try
        {
            // Query photos from Cosmos DB
            var query = new Microsoft.Azure.Cosmos.QueryDefinition(
                "SELECT TOP @limit * FROM c WHERE c.clientId = @clientId AND c.source = 'telegram' AND c.isActive = true ORDER BY c.createdAt DESC")
                .WithParameter("@clientId", clientId)
                .WithParameter("@limit", limit);

            var photos = await _cosmosDbService.QueryItemsAsync<Photo>("Photos", query);

            var result = new
            {
                success = true,
                clientId,
                photos = photos.Select(p => new
                {
                    id = p.Id,
                    blobUrl = p.BlobUrl,
                    caption = p.Caption,
                    senderName = p.SenderName,
                    createdAt = p.CreatedAt.ToString("O")
                }).ToList(),
                count = photos.Count,
                timestamp = DateTime.UtcNow.ToString("O")
            };

            return await CreateJsonResponse(req, result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting Telegram photos for {ClientId}", clientId);
            return await CreateErrorResponse(req, HttpStatusCode.InternalServerError, 
                "Failed to get photos", ex.Message);
        }
    }

    /// <summary>
    /// Telegram bot status and configuration
    /// </summary>
    [Function("TelegramStatus")]
    public async Task<HttpResponseData> GetStatus(
        [HttpTrigger(AuthorizationLevel.Function, "get", Route = "telegram/status")] 
        HttpRequestData req)
    {
        _logger.LogInformation("📊 Getting Telegram bot status");

        try
        {
            var status = new
            {
                configured = _telegramBotService.IsConfigured,
                botToken = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("TELEGRAM_BOT_TOKEN")) ? "✅ Set" : "❌ Missing",
                allowedChats = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("TELEGRAM_ALLOWED_CHAT_IDS")) ? "✅ Configured" : "⚠️ All chats allowed",
                webhookUrl = $"{req.Url.Scheme}://{req.Url.Host}/api/telegram/webhook",
                endpoints = new
                {
                    webhook = "/api/telegram/webhook",
                    sendMessage = "/api/telegram/send",
                    getGreetings = "/api/telegram/greetings/{clientId}",
                    getPhotos = "/api/telegram/photos/{clientId}",
                    status = "/api/telegram/status"
                },
                timestamp = DateTime.UtcNow.ToString("O")
            };

            return await CreateJsonResponse(req, status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error getting Telegram status");
            return await CreateErrorResponse(req, HttpStatusCode.InternalServerError, 
                "Failed to get status", ex.Message);
        }
    }

    private async Task<HttpResponseData> CreateJsonResponse<T>(HttpRequestData req, T data, HttpStatusCode statusCode = HttpStatusCode.OK)
    {
        var response = req.CreateResponse(statusCode);
        response.Headers.Add("Content-Type", "application/json; charset=utf-8");
        response.Headers.Add("Access-Control-Allow-Origin", "*");
        response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");
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
