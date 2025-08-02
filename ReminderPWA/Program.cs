using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using ReminderTabletNew2;
using ReminderTabletNew2.Models;
using ReminderTabletNew2.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

// Load configuration from appsettings.json
var appConfig = new AppConfig();
builder.Configuration.Bind(appConfig);
builder.Services.AddSingleton(appConfig);

builder.Services.AddScoped(sp => 
{
    var httpClient = new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) };
    httpClient.Timeout = TimeSpan.FromSeconds(30); // Reduce timeout for better UX
    return httpClient;
});
builder.Services.AddScoped<TelegramService>();
builder.Services.AddScoped<ApiService>();
builder.Services.AddSingleton<ClientConfigService>();

await builder.Build().RunAsync();
