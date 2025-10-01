using Microsoft.Extensions.Hosting;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using ReminderApp.Functions.Services;

// .NET Azure Functions Host Configuration
// Version: 2025-10-01 v2 - CORS + deployment fix
var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices(services =>
    {
        services.AddApplicationInsightsTelemetryWorkerService();
        services.ConfigureFunctionsApplicationInsights();
        
        // Register our services
services.AddSingleton<CosmosDbService>();
services.AddSingleton<BlobStorageService>();
services.AddSingleton<GoogleSheetsService>();
services.AddSingleton<WeatherService>();
services.AddSingleton<TwilioService>();
services.AddSingleton<TelegramBotService>();
services.AddSingleton<SheetsToCosmosService>();
    })
    .Build();

host.Run();
