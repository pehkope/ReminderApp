namespace ReminderTabletAndroid.Services
{
    public static class LoggingService
    {
        public static void LogImageLoad(string imageUrl, bool success)
        {
            if (success)
            {
                Console.WriteLine($"✅ Kuva ladattu onnistuneesti: {imageUrl}");
            }
            else
            {
                Console.WriteLine($"❌ Kuvan lataus epäonnistui: {imageUrl}");
            }
        }

        public static void LogError(string message, Exception? exception = null)
        {
            Console.WriteLine($"❌ ERROR: {message}");
            if (exception != null)
            {
                Console.WriteLine($"   Exception: {exception.Message}");
            }
        }

        public static void LogInfo(string message)
        {
            Console.WriteLine($"ℹ️ INFO: {message}");
        }

        public static void LogWarning(string message)
        {
            Console.WriteLine($"⚠️ WARNING: {message}");
        }
    }
}