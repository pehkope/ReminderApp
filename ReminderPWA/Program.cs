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
    
    // Add browser-like headers to avoid Google Apps Script redirecting to HTML
    httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    httpClient.DefaultRequestHeaders.Add("Accept", "application/json, text/plain, */*");
    httpClient.DefaultRequestHeaders.Add("Accept-Language", "fi-FI,fi;q=0.9,en;q=0.8");
    
    return httpClient;
});
builder.Services.AddScoped<TelegramService>();
builder.Services.AddScoped<ApiService>();
builder.Services.AddSingleton<ClientConfigService>();

await builder.Build().RunAsync();
