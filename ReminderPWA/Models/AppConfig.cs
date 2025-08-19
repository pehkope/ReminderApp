namespace ReminderTabletNew2.Models;

public class AppConfig
{
    public ApiSettings ApiSettings { get; set; } = new();
    public AppInfo AppInfo { get; set; } = new();
    public FeatureFlags FeatureFlags { get; set; } = new();
}

public class ApiSettings
{
    public string BaseUrl { get; set; } = "";
    public string ApiKey { get; set; } = "";
    public string DefaultClientId { get; set; } = "mom";
    public int TimeoutSeconds { get; set; } = 15;
    public int MaxRetries { get; set; } = 3;
}

public class AppInfo
{
    public string Version { get; set; } = "1.0.9";
    public string BuildDate { get; set; } = "";
    public string Environment { get; set; } = "Development";
}

public class FeatureFlags
{
    public bool EnableOfflineMode { get; set; } = true;
    public bool EnableTelegramIntegration { get; set; } = true;
    public bool EnableAudioNotifications { get; set; } = true;
    public bool EnablePhotoModal { get; set; } = true;
    public bool PreferHeavyOnFirstLoad { get; set; } = false;
    public bool ShowMealOptionsList { get; set; } = false;
}

