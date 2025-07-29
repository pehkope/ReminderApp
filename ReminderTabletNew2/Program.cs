using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using ReminderTabletNew2;
using ReminderTabletNew2.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => 
{
    var httpClient = new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) };
    httpClient.Timeout = TimeSpan.FromSeconds(30); // Reduce timeout for better UX
    return httpClient;
});
builder.Services.AddScoped<TelegramService>();
builder.Services.AddScoped<ApiService>();

await builder.Build().RunAsync();
