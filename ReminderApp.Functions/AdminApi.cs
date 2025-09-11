using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using ReminderApp.Functions.Services;
using System.Net;
using System.Text.Json;

namespace ReminderApp.Functions;

/// <summary>
/// Admin API for managing ReminderApp system
/// Provides webhook management, system status, and admin operations
/// </summary>
public class AdminApi
{
    private readonly ILogger _logger;
    private readonly CosmosDbService _cosmosDbService;
    private readonly TwilioService _twilioService;
    private readonly BlobStorageService _blobStorageService;

    public AdminApi(ILoggerFactory loggerFactory, 
                   CosmosDbService cosmosDbService,
                   TwilioService twilioService,
                   BlobStorageService blobStorageService)
    {
        _logger = loggerFactory.CreateLogger<AdminApi>();
        _cosmosDbService = cosmosDbService;
        _twilioService = twilioService;
        _blobStorageService = blobStorageService;
    }

    /// <summary>
    /// Admin dashboard - system status and overview
    /// </summary>
    [Function("AdminDashboard")]
    public async Task<HttpResponseData> GetAdminDashboard(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "admin")] 
        HttpRequestData req)
    {
        _logger.LogInformation("Admin dashboard requested");

        try
        {
            // Check system status
            var systemStatus = new
            {
                timestamp = DateTime.UtcNow.ToString("O"),
                services = new
                {
                    cosmosDb = new
                    {
                        configured = _cosmosDbService.IsConfigured,
                        status = _cosmosDbService.IsConfigured ? "✅ Connected" : "❌ Not configured"
                    },
                    blobStorage = new
                    {
                        configured = _blobStorageService.IsConfigured,
                        status = _blobStorageService.IsConfigured ? "✅ Connected" : "❌ Not configured"
                    },
                    twilio = new
                    {
                        configured = _twilioService.IsConfigured,
                        status = _twilioService.IsConfigured ? "✅ Connected" : "❌ Not configured"
                    }
                },
                environment = new
                {
                    runtime = ".NET 8",
                    functionsVersion = "v4",
                    hostEnvironment = Environment.GetEnvironmentVariable("AZURE_FUNCTIONS_ENVIRONMENT") ?? "Development"
                },
                endpoints = new
                {
                    reminderApi = "/api/ReminderAPI",
                    healthCheck = "/api/health",
                    twilioVoice = "/api/twilio/voice",
                    twilioSms = "/api/twilio/sms",
                    adminDashboard = "/admin"
                }
            };

            return await CreateJsonResponse(req, systemStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting admin dashboard");
            return await CreateErrorResponse(req, HttpStatusCode.InternalServerError, 
                "Admin dashboard error", ex.Message);
        }
    }

    /// <summary>
    /// Webhook management - list and control webhooks
    /// </summary>
    [Function("WebhookManagement")]
    public async Task<HttpResponseData> ManageWebhooks(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", Route = "admin/webhooks")] 
        HttpRequestData req)
    {
        _logger.LogInformation("Webhook management: {Method}", req.Method);

        try
        {
            if (req.Method == "GET")
            {
                return await GetWebhookStatus(req);
            }
            else if (req.Method == "POST")
            {
                return await UpdateWebhookStatus(req);
            }

            return await CreateErrorResponse(req, HttpStatusCode.MethodNotAllowed, "Method not allowed");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error managing webhooks");
            return await CreateErrorResponse(req, HttpStatusCode.InternalServerError, 
                "Webhook management error", ex.Message);
        }
    }

    /// <summary>
    /// System configuration management
    /// </summary>
    [Function("SystemConfig")]
    public async Task<HttpResponseData> ManageSystemConfig(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", "put", Route = "admin/config")] 
        HttpRequestData req)
    {
        _logger.LogInformation("System config management: {Method}", req.Method);

        try
        {
            switch (req.Method)
            {
                case "GET":
                    return await GetSystemConfig(req);
                case "POST":
                case "PUT":
                    return await UpdateSystemConfig(req);
                default:
                    return await CreateErrorResponse(req, HttpStatusCode.MethodNotAllowed, "Method not allowed");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error managing system config");
            return await CreateErrorResponse(req, HttpStatusCode.InternalServerError, 
                "System config error", ex.Message);
        }
    }

    /// <summary>
    /// Client management - list and manage clients
    /// </summary>
    [Function("ClientManagement")]
    public async Task<HttpResponseData> ManageClients(
        [HttpTrigger(AuthorizationLevel.Anonymous, "get", "post", "put", "delete", Route = "admin/clients/{clientId?}")] 
        HttpRequestData req)
    {
        _logger.LogInformation("Client management: {Method}", req.Method);

        try
        {
            var clientId = req.FunctionContext.BindingContext.BindingData.GetValueOrDefault("clientId")?.ToString();

            switch (req.Method)
            {
                case "GET":
                    return string.IsNullOrEmpty(clientId) 
                        ? await GetAllClients(req)
                        : await GetClient(req, clientId);
                case "POST":
                    return await CreateClient(req);
                case "PUT":
                    if (string.IsNullOrEmpty(clientId))
                        return await CreateErrorResponse(req, HttpStatusCode.BadRequest, "Client ID required for updates");
                    return await UpdateClient(req, clientId);
                case "DELETE":
                    if (string.IsNullOrEmpty(clientId))
                        return await CreateErrorResponse(req, HttpStatusCode.BadRequest, "Client ID required for deletion");
                    return await DeleteClient(req, clientId);
                default:
                    return await CreateErrorResponse(req, HttpStatusCode.MethodNotAllowed, "Method not allowed");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error managing clients");
            return await CreateErrorResponse(req, HttpStatusCode.InternalServerError, 
                "Client management error", ex.Message);
        }
    }

    private async Task<HttpResponseData> GetWebhookStatus(HttpRequestData req)
    {
        // Mock webhook status - in production this would check actual webhook configurations
        var webhookStatus = new
        {
            webhooks = new[]
            {
                new
                {
                    name = "Telegram Bot",
                    url = Environment.GetEnvironmentVariable("TELEGRAM_WEBHOOK_URL") ?? "Not configured",
                    status = "✅ Active",
                    lastUpdate = DateTime.UtcNow.AddMinutes(-15).ToString("O"),
                    errorCount = 0
                },
                new
                {
                    name = "Twilio SMS",
                    url = "/api/twilio/sms",
                    status = _twilioService.IsConfigured ? "✅ Active" : "❌ Not configured",
                    lastUpdate = DateTime.UtcNow.AddHours(-1).ToString("O"),
                    errorCount = 0
                }
            },
            summary = new
            {
                total = 2,
                active = _twilioService.IsConfigured ? 2 : 1,
                errors = 0,
                lastCheck = DateTime.UtcNow.ToString("O")
            }
        };

        return await CreateJsonResponse(req, webhookStatus);
    }

    private async Task<HttpResponseData> UpdateWebhookStatus(HttpRequestData req)
    {
        var requestBody = await req.ReadAsStringAsync();
        var requestData = JsonSerializer.Deserialize<Dictionary<string, object>>(requestBody ?? "{}");

        var action = requestData?.GetValueOrDefault("action")?.ToString() ?? "unknown";
        var webhookName = requestData?.GetValueOrDefault("webhook")?.ToString() ?? "unknown";

        _logger.LogInformation("Webhook action: {Action} for {WebhookName}", action, webhookName);

        // Mock webhook update - in production this would actually enable/disable webhooks
        var result = new
        {
            success = true,
            message = $"Webhook '{webhookName}' {action} successfully",
            webhook = webhookName,
            action = action,
            timestamp = DateTime.UtcNow.ToString("O")
        };

        return await CreateJsonResponse(req, result);
    }

    private async Task<HttpResponseData> GetSystemConfig(HttpRequestData req)
    {
        var config = new
        {
            system = new
            {
                version = "1.0.0",
                environment = Environment.GetEnvironmentVariable("AZURE_FUNCTIONS_ENVIRONMENT") ?? "Development",
                region = Environment.GetEnvironmentVariable("WEBSITE_SITE_NAME")?.Split('-').LastOrDefault() ?? "unknown"
            },
            features = new
            {
                cosmosDb = _cosmosDbService.IsConfigured,
                blobStorage = _blobStorageService.IsConfigured,
                twilio = _twilioService.IsConfigured,
                googleSheets = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("GOOGLE_SHEETS_CREDENTIALS"))
            },
            limits = new
            {
                maxClients = 100,
                maxPhotosPerClient = 1000,
                maxRemindersPerClient = 500
            }
        };

        return await CreateJsonResponse(req, config);
    }

    private async Task<HttpResponseData> UpdateSystemConfig(HttpRequestData req)
    {
        var requestBody = await req.ReadAsStringAsync();
        var requestData = JsonSerializer.Deserialize<Dictionary<string, object>>(requestBody ?? "{}");

        _logger.LogInformation("System config update requested");

        // Mock config update - in production this would update actual system configuration
        var result = new
        {
            success = true,
            message = "System configuration updated successfully",
            updatedFields = requestData?.Keys.ToArray() ?? Array.Empty<string>(),
            timestamp = DateTime.UtcNow.ToString("O")
        };

        return await CreateJsonResponse(req, result);
    }

    private async Task<HttpResponseData> GetAllClients(HttpRequestData req)
    {
        // Mock client list - in production this would query Cosmos DB
        var clients = new[]
        {
            new
            {
                clientId = "mom",
                name = "Äiti",
                status = "✅ Active",
                lastActivity = DateTime.UtcNow.AddMinutes(-30).ToString("O"),
                remindersCount = 5,
                photosCount = 25
            },
            new
            {
                clientId = "test",
                name = "Test User",
                status = "⚠️ Testing",
                lastActivity = DateTime.UtcNow.AddHours(-2).ToString("O"),
                remindersCount = 2,
                photosCount = 5
            }
        };

        return await CreateJsonResponse(req, new { clients, total = clients.Length });
    }

    private async Task<HttpResponseData> GetClient(HttpRequestData req, string clientId)
    {
        // Mock client details - in production this would query Cosmos DB
        var client = new
        {
            clientId,
            name = clientId == "mom" ? "Äiti" : "Test User",
            status = "✅ Active",
            created = DateTime.UtcNow.AddDays(-30).ToString("O"),
            lastActivity = DateTime.UtcNow.AddMinutes(-30).ToString("O"),
            settings = new
            {
                useWeather = true,
                usePhotos = true,
                useTelegram = false,
                useSMS = false,
                timezone = "Europe/Helsinki",
                language = "fi"
            },
            statistics = new
            {
                remindersCount = 5,
                photosCount = 25,
                appointmentsCount = 3,
                medicationsCount = 4
            }
        };

        return await CreateJsonResponse(req, client);
    }

    private async Task<HttpResponseData> CreateClient(HttpRequestData req)
    {
        var requestBody = await req.ReadAsStringAsync();
        var clientData = JsonSerializer.Deserialize<Dictionary<string, object>>(requestBody ?? "{}");

        var clientId = clientData?.GetValueOrDefault("clientId")?.ToString();
        if (string.IsNullOrEmpty(clientId))
        {
            return await CreateErrorResponse(req, HttpStatusCode.BadRequest, "Client ID is required");
        }

        _logger.LogInformation("Creating new client: {ClientId}", clientId);

        var result = new
        {
            success = true,
            message = $"Client '{clientId}' created successfully",
            clientId,
            timestamp = DateTime.UtcNow.ToString("O")
        };

        return await CreateJsonResponse(req, result, HttpStatusCode.Created);
    }

    private async Task<HttpResponseData> UpdateClient(HttpRequestData req, string clientId)
    {
        var requestBody = await req.ReadAsStringAsync();
        var updateData = JsonSerializer.Deserialize<Dictionary<string, object>>(requestBody ?? "{}");

        _logger.LogInformation("Updating client: {ClientId}", clientId);

        var result = new
        {
            success = true,
            message = $"Client '{clientId}' updated successfully",
            clientId,
            updatedFields = updateData?.Keys.ToArray() ?? Array.Empty<string>(),
            timestamp = DateTime.UtcNow.ToString("O")
        };

        return await CreateJsonResponse(req, result);
    }

    private async Task<HttpResponseData> DeleteClient(HttpRequestData req, string clientId)
    {
        _logger.LogWarning("Deleting client: {ClientId}", clientId);

        var result = new
        {
            success = true,
            message = $"Client '{clientId}' deleted successfully",
            clientId,
            timestamp = DateTime.UtcNow.ToString("O")
        };

        return await CreateJsonResponse(req, result);
    }

    private async Task<HttpResponseData> CreateJsonResponse<T>(HttpRequestData req, T data, HttpStatusCode statusCode = HttpStatusCode.OK)
    {
        var response = req.CreateResponse(statusCode);
        response.Headers.Add("Content-Type", "application/json; charset=utf-8");
        response.Headers.Add("Access-Control-Allow-Origin", "*");
        response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
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
