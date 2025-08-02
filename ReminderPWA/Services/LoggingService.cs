using Microsoft.Extensions.Logging;

namespace ReminderTabletNew2.Services;

/// <summary>
/// PARAS KÄYTÄNTÖ: Keskitetty lokitus ja virheenkäsittely
/// Telerik Blazor Best Practice #8: Error Handling and Logging
/// </summary>
public static class LoggingService
{
    private static ILogger? _logger;

    public static void Initialize(ILogger logger)
    {
        _logger = logger;
    }

    public static void LogInfo(string message, params object[] args)
    {
        _logger?.LogInformation(message, args);
        // Yksinkertainen string interpolation args[0] kanssa
        if (args != null && args.Length > 0)
        {
            Console.WriteLine($"ℹ️ INFO: {message.Replace("{PhotoUrl}", args[0]?.ToString()).Replace("{ImageUrl}", args[0]?.ToString()).Replace("{FolderId}", args[0]?.ToString()).Replace("{Endpoint}", args[0]?.ToString())}");
        }
        else
        {
            Console.WriteLine($"ℹ️ INFO: {message}");
        }
    }

    public static void LogWarning(string message, params object[] args)
    {
        _logger?.LogWarning(message, args);
        // Yksinkertainen string interpolation args[0] kanssa
        if (args != null && args.Length > 0)
        {
            Console.WriteLine($"⚠️ WARNING: {message.Replace("{PhotoUrl}", args[0]?.ToString()).Replace("{ImageUrl}", args[0]?.ToString()).Replace("{FolderId}", args[0]?.ToString()).Replace("{Endpoint}", args[0]?.ToString())}");
        }
        else
        {
            Console.WriteLine($"⚠️ WARNING: {message}");
        }
    }

    public static void LogError(Exception ex, string message, params object[] args)
    {
        _logger?.LogError(ex, message, args);
        // Yksinkertainen string interpolation args[0] kanssa
        if (args != null && args.Length > 0)
        {
            Console.WriteLine($"❌ ERROR: {message.Replace("{PhotoUrl}", args[0]?.ToString()).Replace("{ImageUrl}", args[0]?.ToString()).Replace("{FolderId}", args[0]?.ToString()).Replace("{Endpoint}", args[0]?.ToString())} - {ex.Message}");
        }
        else
        {
            Console.WriteLine($"❌ ERROR: {message} - {ex.Message}");
        }
    }

    public static void LogImageLoad(string imageUrl, bool success)
    {
        if (success)
        {
            LogInfo("Kuva ladattiin onnistuneesti: {ImageUrl}", imageUrl);
        }
        else
        {
            LogWarning("Kuvan lataus epäonnistui: {ImageUrl}", imageUrl);
        }
    }

    public static void LogApiCall(string endpoint, bool success, string? error = null)
    {
        if (success)
        {
            LogInfo("API kutsu onnistui: {Endpoint}", endpoint);
        }
        else
        {
            LogError(new Exception(error ?? "Unknown API error"), "API kutsu epäonnistui: {Endpoint}", endpoint);
        }
    }
} 