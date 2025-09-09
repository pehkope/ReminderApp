using Microsoft.Extensions.Hosting;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using ReminderApp.Functions.Services;

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
    })
    .Build();

host.Run();
