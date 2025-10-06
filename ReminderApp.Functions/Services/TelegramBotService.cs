using Microsoft.Extensions.Logging;
using ReminderApp.Functions.Models;
using System.Text.Json;
using Telegram.Bot;
using Telegram.Bot.Types;
using Telegram.Bot.Types.Enums;

namespace ReminderApp.Functions.Services;

/// <summary>
/// Telegram Bot Service for handling incoming messages and photos from family members
/// Processes photos and messages from relatives and stores them for display in PWA
/// </summary>
public class TelegramBotService
{
    private readonly ILogger _logger;
    private readonly CosmosDbService _cosmosDbService;
    private readonly BlobStorageService _blobStorageService;
    private readonly string? _botToken;
    private readonly string? _allowedChatIds;
    private readonly TelegramBotClient? _botClient;

    public TelegramBotService(ILoggerFactory loggerFactory, 
                             CosmosDbService cosmosDbService,
                             BlobStorageService blobStorageService)
    {
        _logger = loggerFactory.CreateLogger<TelegramBotService>();
        _cosmosDbService = cosmosDbService;
        _blobStorageService = blobStorageService;
        
        _botToken = Environment.GetEnvironmentVariable("TELEGRAM_BOT_TOKEN");
        _allowedChatIds = Environment.GetEnvironmentVariable("TELEGRAM_ALLOWED_CHAT_IDS") ?? "";

        if (!string.IsNullOrEmpty(_botToken))
        {
            try
            {
                _botClient = new TelegramBotClient(_botToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize Telegram Bot client");
            }
        }
    }

    public bool IsConfigured => _botClient != null && !string.IsNullOrEmpty(_botToken);

    /// <summary>
    /// Process incoming Telegram webhook update
    /// </summary>
    public async Task<TelegramWebhookResponse> ProcessWebhookUpdateAsync(Update update)
    {
        try
        {
            if (update.Message == null)
            {
                _logger.LogWarning("Received Telegram update without message");
                return new TelegramWebhookResponse { Success = false, Message = "No message in update" };
            }

            var message = update.Message;
            var chatId = message.Chat.Id.ToString();
            var messageId = message.MessageId;

            _logger.LogInformation("📨 Processing Telegram message {MessageId} from chat {ChatId}", messageId, chatId);

            // Check if chat is allowed
            if (!IsChatAllowed(chatId))
            {
                _logger.LogWarning("⚠️ Unauthorized chat attempt: {ChatId}", chatId);
                await SendChatIdResponseAsync(chatId);
                return new TelegramWebhookResponse { Success = false, Message = "Unauthorized chat" };
            }

            // Check for duplicate processing
            var duplicateKey = $"telegram_msg_{update.Id}_{messageId}";
            if (await IsDuplicateMessage(duplicateKey))
            {
                _logger.LogInformation("🚫 Duplicate message detected: {Key}", duplicateKey);
                return new TelegramWebhookResponse { Success = true, Message = "Duplicate message ignored" };
            }

            // Mark as processed
            await MarkMessageAsProcessed(duplicateKey);

            // Extract client ID from message (default: mom)
            var clientId = ExtractClientId(message.Caption ?? message.Text ?? "");

            // Handle different message types
            if (message.Photo != null && message.Photo.Length > 0)
            {
                return await ProcessPhotoMessage(message, clientId);
            }
            else if (!string.IsNullOrEmpty(message.Text))
            {
                return await ProcessTextMessage(message, clientId);
            }
            else if (message.Document != null && IsImageDocument(message.Document))
            {
                return await ProcessDocumentMessage(message, clientId);
            }

            _logger.LogInformation("ℹ️ No processable content in message");
            return new TelegramWebhookResponse { Success = true, Message = "No processable content" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error processing Telegram webhook");
            return new TelegramWebhookResponse { Success = false, Message = ex.Message };
        }
    }

    /// <summary>
    /// Process photo message from family member
    /// </summary>
    private async Task<TelegramWebhookResponse> ProcessPhotoMessage(Message message, string clientId)
    {
        try
        {
            var photo = message.Photo!.OrderByDescending(p => p.FileSize).First(); // Get largest photo
            var caption = message.Caption ?? "";
            var senderName = GetSenderName(message.From);

            _logger.LogInformation("📸 Processing photo from {Sender} for client {ClientId}", senderName, clientId);

            // Download photo from Telegram
            var fileInfo = await _botClient!.GetFileAsync(photo.FileId);
            if (string.IsNullOrEmpty(fileInfo.FilePath))
            {
                return new TelegramWebhookResponse { Success = false, Message = "Could not get file path" };
            }

            using var fileStream = new MemoryStream();
            await _botClient.DownloadFileAsync(fileInfo.FilePath, fileStream);
            fileStream.Position = 0;

            // Generate filename
            var fileName = _blobStorageService.GenerateFileName(clientId, $"telegram_photo_{photo.FileUniqueId}.jpg");

            // Upload to Blob Storage
            var blobUrl = await _blobStorageService.UploadPhotoAsync(fileStream, fileName, "image/jpeg");
            if (string.IsNullOrEmpty(blobUrl))
            {
                return new TelegramWebhookResponse { Success = false, Message = "Failed to upload photo" };
            }

            // Create photo record in Cosmos DB
            var photoRecord = new Photo
            {
                Id = $"telegram_{photo.FileUniqueId}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}",
                ClientId = clientId,
                BlobUrl = blobUrl,
                TelegramFileId = photo.FileId,
                Caption = string.IsNullOrEmpty(caption) 
                    ? $"Kuva sukulaiselta: {senderName}" 
                    : $"{senderName}: {caption}",
                Source = "telegram",
                SenderName = senderName,
                SenderChatId = message.Chat.Id.ToString(),
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            var savedPhoto = await _cosmosDbService.CreateItemAsync(photoRecord, "Photos");
            if (savedPhoto == null)
            {
                _logger.LogError("❌ Failed to save photo record to Cosmos DB");
                _logger.LogError("❌ Photo details: Id={Id}, ClientId={ClientId}, BlobUrl={BlobUrl}", 
                    photoRecord.Id, photoRecord.ClientId, photoRecord.BlobUrl);
                return new TelegramWebhookResponse { Success = false, Message = "Failed to save photo record to Cosmos DB" };
            }

            _logger.LogInformation("✅ Photo processed successfully: {PhotoId} for {ClientId}", photoRecord.Id, clientId);

            // Send confirmation to sender
            await SendMessageAsync(message.Chat.Id, 
                $"✅ Kiitos kuvasta! Se näkyy nyt {clientId}:n sovelluksessa. 📱❤️");

            return new TelegramWebhookResponse 
            { 
                Success = true, 
                Message = "Photo processed successfully",
                PhotoId = photoRecord.Id,
                ClientId = clientId
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error processing photo message");
            return new TelegramWebhookResponse { Success = false, Message = ex.Message };
        }
    }

    /// <summary>
    /// Process text message from family member
    /// </summary>
    private async Task<TelegramWebhookResponse> ProcessTextMessage(Message message, string clientId)
    {
        try
        {
            var text = message.Text!;
            var senderName = GetSenderName(message.From);

            _logger.LogInformation("💬 Processing text message from {Sender} for client {ClientId}", senderName, clientId);

            // Handle commands
            if (text.StartsWith("/start") || text.StartsWith("/id") || text.StartsWith("/myid"))
            {
                await SendMessageAsync(message.Chat.Id, 
                    $"👋 Terve {senderName}!\n\n" +
                    $"🆔 Sinun Chat ID: **{message.Chat.Id}**\n\n" +
                    $"📸 Voit lähettää kuvia ja viestejä {clientId}:lle\n" +
                    $"💬 Viestit tallentuvat ja näkyvät PWA:ssa\n\n" +
                    $"💡 Vinkki: Jos haluat lähettää toiselle asiakkaalle, lisää kuvatekstiin #client:nimi");
                
                _logger.LogInformation("ℹ️ Sent Chat ID {ChatId} to {Sender}", message.Chat.Id, senderName);
                return new TelegramWebhookResponse { Success = true, Message = "Command processed" };
            }

            // Create greeting message record
            var greeting = new FamilyGreeting
            {
                Id = $"greeting_{message.MessageId}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}",
                ClientId = clientId,
                Message = text,
                SenderName = senderName,
                SenderChatId = message.Chat.Id.ToString(),
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            var savedGreeting = await _cosmosDbService.CreateItemAsync(greeting, "Greetings");
            if (savedGreeting == null)
            {
                _logger.LogError("Failed to save greeting to Cosmos DB");
                return new TelegramWebhookResponse { Success = false, Message = "Failed to save greeting" };
            }

            _logger.LogInformation("✅ Greeting saved: {GreetingId} for {ClientId}", greeting.Id, clientId);

            // Send confirmation to sender
            await SendMessageAsync(message.Chat.Id, 
                $"✅ Viesti lähetetty {clientId}:lle! 💌");

            return new TelegramWebhookResponse 
            { 
                Success = true, 
                Message = "Greeting processed successfully",
                GreetingId = greeting.Id,
                ClientId = clientId
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error processing text message");
            return new TelegramWebhookResponse { Success = false, Message = ex.Message };
        }
    }

    /// <summary>
    /// Process document message (if it's an image)
    /// </summary>
    private async Task<TelegramWebhookResponse> ProcessDocumentMessage(Message message, string clientId)
    {
        var document = message.Document!;
        var senderName = GetSenderName(message.From);

        _logger.LogInformation("📎 Processing document from {Sender} for client {ClientId}", senderName, clientId);

        // Treat document as photo if it's an image
        try
        {
            var fileInfo = await _botClient!.GetFileAsync(document.FileId);
            if (string.IsNullOrEmpty(fileInfo.FilePath))
            {
                return new TelegramWebhookResponse { Success = false, Message = "Could not get document file path" };
            }

            using var fileStream = new MemoryStream();
            await _botClient.DownloadFileAsync(fileInfo.FilePath, fileStream);
            fileStream.Position = 0;

            var fileName = _blobStorageService.GenerateFileName(clientId, document.FileName ?? $"telegram_doc_{document.FileUniqueId}");
            var blobUrl = await _blobStorageService.UploadPhotoAsync(fileStream, fileName, document.MimeType ?? "image/jpeg");

            if (string.IsNullOrEmpty(blobUrl))
            {
                return new TelegramWebhookResponse { Success = false, Message = "Failed to upload document" };
            }

            // Create photo record
            var photoRecord = new Photo
            {
                Id = $"telegram_doc_{document.FileUniqueId}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}",
                ClientId = clientId,
                BlobUrl = blobUrl,
                TelegramFileId = document.FileId,
                Caption = $"Kuva sukulaiselta: {senderName}",
                Source = "telegram",
                SenderName = senderName,
                SenderChatId = message.Chat.Id.ToString(),
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            var savedPhoto = await _cosmosDbService.CreateItemAsync(photoRecord, "Photos");
            if (savedPhoto != null)
            {
                await SendMessageAsync(message.Chat.Id, $"✅ Kuva vastaanotettu! 📸");
                return new TelegramWebhookResponse { Success = true, Message = "Document processed as photo" };
            }

            return new TelegramWebhookResponse { Success = false, Message = "Failed to save document" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error processing document");
            return new TelegramWebhookResponse { Success = false, Message = ex.Message };
        }
    }

    /// <summary>
    /// Send message to Telegram chat
    /// </summary>
    public async Task<bool> SendMessageAsync(long chatId, string message)
    {
        if (!IsConfigured) return false;

        try
        {
            await _botClient!.SendTextMessageAsync(chatId, message, parseMode: ParseMode.Html);
            _logger.LogInformation("📤 Telegram message sent to chat {ChatId}", chatId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send Telegram message to chat {ChatId}", chatId);
            return false;
        }
    }

    /// <summary>
    /// Send photo to Telegram chat
    /// </summary>
    public async Task<bool> SendPhotoAsync(long chatId, string photoUrl, string? caption = null)
    {
        if (!IsConfigured) return false;

        try
        {
            await _botClient!.SendPhotoAsync(chatId, InputFile.FromUri(photoUrl), caption: caption, parseMode: ParseMode.Html);
            _logger.LogInformation("📸 Telegram photo sent to chat {ChatId}", chatId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to send Telegram photo to chat {ChatId}", chatId);
            return false;
        }
    }

    // Helper methods
    private bool IsChatAllowed(string chatId)
    {
        if (string.IsNullOrEmpty(_allowedChatIds)) return true; // Allow all if not configured
        
        var allowedChats = _allowedChatIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                         .Select(id => id.Trim())
                                         .ToList();
        
        return allowedChats.Contains(chatId);
    }

    private async Task SendChatIdResponseAsync(string chatId)
    {
        try
        {
            if (long.TryParse(chatId, out var chatIdLong))
            {
                await SendMessageAsync(chatIdLong, 
                    $"Hei! Tunnisteesi (chat ID) on {chatId}.\n" +
                    $"Pyydä ylläpitoa lisäämään se sallittuihin lähettäjiin. 🔐");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send chat ID response");
        }
    }

    private Task<bool> IsDuplicateMessage(string key)
    {
        // Simple in-memory duplicate check - in production, use Redis or Cosmos DB
        // For now, return false to process all messages
        return Task.FromResult(false);
    }

    private Task MarkMessageAsProcessed(string key)
    {
        // Mark message as processed - in production, store in Redis or Cosmos DB
        // For now, just log
        _logger.LogInformation("Message marked as processed: {Key}", key);
        return Task.CompletedTask;
    }

    private static string ExtractClientId(string text)
    {
        var match = System.Text.RegularExpressions.Regex.Match(text, @"#client:([a-zA-Z0-9_-]+)");
        return match.Success ? match.Groups[1].Value : "mom";
    }

    private static string GetSenderName(User? user)
    {
        if (user == null) return "Tuntematon";
        
        var name = "";
        if (!string.IsNullOrEmpty(user.FirstName)) name += user.FirstName;
        if (!string.IsNullOrEmpty(user.LastName)) name += $" {user.LastName}";
        if (string.IsNullOrEmpty(name) && !string.IsNullOrEmpty(user.Username)) name = user.Username;
        
        return string.IsNullOrEmpty(name) ? "Perheenjäsen" : name;
    }

    private static bool IsImageDocument(Document document)
    {
        return !string.IsNullOrEmpty(document.MimeType) && document.MimeType.StartsWith("image/");
    }
}

/// <summary>
/// Response model for Telegram webhook processing
/// </summary>
public class TelegramWebhookResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = "";
    public string? PhotoId { get; set; }
    public string? GreetingId { get; set; }
    public string? ClientId { get; set; }
}

/// <summary>
/// Family greeting model for storing text messages from relatives
/// </summary>
public class FamilyGreeting
{
    public string Id { get; set; } = "";
    public string ClientId { get; set; } = "";
    public string Message { get; set; } = "";
    public string SenderName { get; set; } = "";
    public string SenderChatId { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public bool IsRead { get; set; }
}
