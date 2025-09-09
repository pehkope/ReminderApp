using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace ReminderApp.Functions.Services;

public class BlobStorageService
{
    private readonly BlobServiceClient? _blobServiceClient;
    private readonly string _photosContainerName;
    private readonly string _thumbnailsContainerName;

    public BlobStorageService()
    {
        var connectionString = Environment.GetEnvironmentVariable("AZURE_STORAGE_CONNECTION_STRING");
        _photosContainerName = Environment.GetEnvironmentVariable("PHOTOS_CONTAINER_NAME") ?? "photos";
        _thumbnailsContainerName = Environment.GetEnvironmentVariable("THUMBNAILS_CONTAINER_NAME") ?? "thumbnails";

        if (!string.IsNullOrEmpty(connectionString))
        {
            try
            {
                _blobServiceClient = new BlobServiceClient(connectionString);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to initialize Blob Storage: {ex.Message}");
            }
        }
    }

    public bool IsConfigured => _blobServiceClient != null;

    public async Task<string?> UploadPhotoAsync(Stream photoStream, string fileName, string contentType = "image/jpeg")
    {
        if (!IsConfigured || _blobServiceClient == null)
        {
            Console.WriteLine("Blob Storage not configured");
            return null;
        }

        try
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_photosContainerName);
            var blobClient = containerClient.GetBlobClient(fileName);

            var blobHttpHeaders = new BlobHttpHeaders
            {
                ContentType = contentType
            };

            await blobClient.UploadAsync(photoStream, new BlobUploadOptions
            {
                HttpHeaders = blobHttpHeaders
            });

            return blobClient.Uri.ToString();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error uploading photo {fileName}: {ex.Message}");
            return null;
        }
    }

    public async Task<bool> DeletePhotoAsync(string fileName)
    {
        if (!IsConfigured || _blobServiceClient == null)
        {
            return false;
        }

        try
        {
            var containerClient = _blobServiceClient.GetBlobContainerClient(_photosContainerName);
            var blobClient = containerClient.GetBlobClient(fileName);

            await blobClient.DeleteIfExistsAsync();
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error deleting photo {fileName}: {ex.Message}");
            return false;
        }
    }

    public string GenerateFileName(string clientId, string originalFileName)
    {
        var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        return $"{clientId}/photo_{timestamp}{extension}";
    }
}
