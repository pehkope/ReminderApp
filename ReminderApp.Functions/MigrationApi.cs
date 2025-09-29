using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using ReminderApp.Functions.Services;
using System.Net;
using System.Text.Json;

namespace ReminderApp.Functions;

public class MigrationApi
{
    private readonly ILogger _logger;
    private readonly SheetsToCosmosService _migrationService;

    public MigrationApi(ILoggerFactory loggerFactory, SheetsToCosmosService migrationService)
    {
        _logger = loggerFactory.CreateLogger<MigrationApi>();
        _migrationService = migrationService;
    }

    [Function("MigrateSheets")]
    public async Task<HttpResponseData> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "api/migrate-sheets")] 
        HttpRequestData req)
    {
        _logger.LogInformation("Migration API called");

        try
        {
            var clientId = GetQueryParameter(req, "clientId") ?? "mom";
            _logger.LogInformation("Starting migration for client: {ClientId}", clientId);

            // Perform migration
            var success = await _migrationService.MigrateClientDataAsync(clientId);

            var result = new
            {
                success = success,
                clientId = clientId,
                timestamp = DateTime.UtcNow.ToString("O"),
                message = success 
                    ? $"Successfully migrated data for client: {clientId}" 
                    : $"Failed to migrate data for client: {clientId}"
            };

            var response = req.CreateResponse(success ? HttpStatusCode.OK : HttpStatusCode.InternalServerError);
            response.Headers.Add("Content-Type", "application/json; charset=utf-8");
            
            // CORS
            var origin = req.Headers.Contains("Origin") ? req.Headers.GetValues("Origin").FirstOrDefault() : "";
            var allowedOrigins = new[] { 
                "https://gentle-bush-0a3b2fd03.5.azurestaticapps.net",
                "https://localhost:5000", 
                "https://localhost:5001"
            };
            
            if (allowedOrigins.Contains(origin))
            {
                response.Headers.Add("Access-Control-Allow-Origin", origin);
            }
            else
            {
                response.Headers.Add("Access-Control-Allow-Origin", "null");
            }
            
            var json = JsonSerializer.Serialize(result, new JsonSerializerOptions 
            { 
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
            });
            await response.WriteStringAsync(json);
            
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during migration");
            
            var errorResponse = req.CreateResponse(HttpStatusCode.InternalServerError);
            errorResponse.Headers.Add("Content-Type", "application/json; charset=utf-8");
            
            var errorResult = new
            {
                success = false,
                error = ex.Message,
                timestamp = DateTime.UtcNow.ToString("O")
            };
            
            var errorJson = JsonSerializer.Serialize(errorResult, new JsonSerializerOptions 
            { 
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase 
            });
            await errorResponse.WriteStringAsync(errorJson);
            
            return errorResponse;
        }
    }

    private static string? GetQueryParameter(HttpRequestData req, string paramName)
    {
        return System.Web.HttpUtility.ParseQueryString(req.Url.Query).Get(paramName);
    }
}
