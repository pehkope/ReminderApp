using Microsoft.Extensions.Logging;
using ReminderTabletAndroid.Services;

namespace ReminderTabletAndroid;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Bold.ttf", "OpenSansBold");
            });

        // Blazor WebView
        builder.Services.AddMauiBlazorWebView();

        // HTTP Client konfiguraatio
        builder.Services.AddSingleton<HttpClient>(serviceProvider =>
        {
            var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromSeconds(30); // Pidempi timeout tablet verkoille
            return httpClient;
        });

        // Omat servicet
        builder.Services.AddScoped<ApiService>();
        builder.Services.AddScoped<TelegramService>();
        
        // Logging vain debug-tilassa
#if DEBUG
        builder.Services.AddBlazorWebViewDeveloperTools();
        builder.Logging.AddDebug();
        builder.Logging.SetMinimumLevel(LogLevel.Debug);
#else
        builder.Logging.SetMinimumLevel(LogLevel.Warning);
#endif

        return builder.Build();
    }
}