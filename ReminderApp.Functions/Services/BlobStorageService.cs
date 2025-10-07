using Azure.Storage;
using Azure.Storage.Blobs;
using Azure.Storage.Sas;

namespace ReminderApp.Functions.Services;

public class BlobStorageService
{
    private readonly string _connectionString;
    private readonly BlobServiceClient? _blobServiceClient;

    public BlobStorageService()
    {
        _connectionString = Environment.GetEnvironmentVariable("AzureWebJobsStorage") ?? "";
        if (!string.IsNullOrEmpty(_connectionString))
        {
            _blobServiceClient = new BlobServiceClient(_connectionString);
            Console.WriteLine("BlobStorageService initialized");
        }
    }

    public bool IsConfigured => !string.IsNullOrEmpty(_connectionString);

    /// <summary>
    /// Generoi uniikki tiedostonimi
    /// </summary>
    public string GenerateFileName(string clientId, string fileExtension)
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
        return $"{clientId}_{timestamp}{fileExtension}";
    }

    /// <summary>
    /// Upload kuva Blob Storageen
    /// </summary>
    public async Task<string> UploadPhotoAsync(string containerName, string fileName, byte[] photoData)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("Blob Storage not configured");
        }

        var containerClient = _blobServiceClient!.GetBlobContainerClient(containerName);
        await containerClient.CreateIfNotExistsAsync();

        var blobClient = containerClient.GetBlobClient(fileName);
        using var stream = new MemoryStream(photoData);
        await blobClient.UploadAsync(stream, overwrite: true);

        return blobClient.Uri.ToString();
    }

    /// <summary>
    /// Upload kuva Blob Storageen (stream overload)
    /// </summary>
    public async Task<string> UploadPhotoAsync(MemoryStream stream, string fileName, string contentType)
    {
        if (!IsConfigured)
        {
            throw new InvalidOperationException("Blob Storage not configured");
        }

        var containerClient = _blobServiceClient!.GetBlobContainerClient("photos");
        await containerClient.CreateIfNotExistsAsync();

        var blobClient = containerClient.GetBlobClient(fileName);
        stream.Position = 0;
        await blobClient.UploadAsync(stream, overwrite: true);

        return blobClient.Uri.ToString();
    }

    /// <summary>
    /// Luo SAS token blob URL:lle
    /// </summary>
    public string GenerateSasUrlForBlob(string blobUrl)
    {
        if (string.IsNullOrEmpty(blobUrl) || !IsConfigured)
        {
            return blobUrl;
        }

        try
        {
            // Parse blob URL
            var uri = new Uri(blobUrl);
            var containerName = uri.Segments[1].TrimEnd('/');
            var blobName = string.Join("", uri.Segments.Skip(2));

            if (_blobServiceClient == null)
                return blobUrl;

            var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
            var blobClient = containerClient.GetBlobClient(blobName);

            // Luo SAS token (voimassa 24h - sama URL koko päivän ajan)
            if (blobClient.CanGenerateSasUri)
            {
                // Pyöristä alkuaika päivän alkuun jotta sama token koko päivän
                var today = DateTime.UtcNow.Date;
                var tomorrow = today.AddDays(1);
                
                var sasBuilder = new BlobSasBuilder
                {
                    BlobContainerName = containerName,
                    BlobName = blobName,
                    Resource = "b", // b = blob
                    StartsOn = new DateTimeOffset(today),
                    ExpiresOn = new DateTimeOffset(tomorrow.AddHours(2)) // Vanhenee huomenna klo 02:00
                };

                sasBuilder.SetPermissions(BlobSasPermissions.Read);

                var sasUri = blobClient.GenerateSasUri(sasBuilder);
                Console.WriteLine($"Generated SAS URL for blob: {blobName}");
                return sasUri.ToString();
            }
            else
            {
                Console.WriteLine("Cannot generate SAS URI for blob (using connection string without AccountKey?)");
                return blobUrl;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error generating SAS URL: {ex.Message}");
            return blobUrl;
        }
    }
}