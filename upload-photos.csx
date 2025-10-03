#r "nuget: Microsoft.Azure.Cosmos, 3.35.4"
#r "nuget: System.Text.Json, 8.0.0"

using Microsoft.Azure.Cosmos;
using System.Text.Json;

var connString = Environment.GetEnvironmentVariable("COSMOS_CONNECTION_STRING");
var client = new CosmosClient(connString);
var container = client.GetContainer("ReminderAppDB", "Photos");

var photoFiles = Directory.GetFiles(".", "photo-mom-*.json");
Console.WriteLine($"Found {photoFiles.Length} photo files");

foreach (var file in photoFiles)
{
    var json = File.ReadAllText(file);
    var photo = JsonSerializer.Deserialize<JsonElement>(json);
    
    var id = photo.GetProperty("id").GetString();
    var url = photo.GetProperty("url").GetString();
    var caption = photo.GetProperty("caption").GetString();
    
    Console.WriteLine($"Uploading: {id} - {caption} - {url}");
    
    await container.UpsertItemAsync(photo, new PartitionKey("mom"));
    Console.WriteLine($"✓ Uploaded {id}");
}

Console.WriteLine("All photos uploaded!");

