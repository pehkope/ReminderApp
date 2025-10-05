using Microsoft.Azure.Cosmos;
using ReminderApp.Functions.Models;
using System.Text.Json;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace ReminderApp.Functions.Services;

public class CosmosDbService
{
    private readonly CosmosClient? _cosmosClient;
    private readonly Database? _database;
    private readonly string _databaseId;

    public CosmosDbService()
    {
        var connectionString = Environment.GetEnvironmentVariable("COSMOS_CONNECTION_STRING");
        _databaseId = Environment.GetEnvironmentVariable("COSMOS_DATABASE") ?? "ReminderAppDB";

        if (!string.IsNullOrEmpty(connectionString))
        {
            try
            {
                // Configure Cosmos SDK to use Newtonsoft.Json with camelCase
                var options = new CosmosClientOptions
                {
                    SerializerOptions = new CosmosSerializationOptions
                    {
                        PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
                    }
                };
                
                _cosmosClient = new CosmosClient(connectionString, options);
                _database = _cosmosClient.GetDatabase(_databaseId);
                Console.WriteLine("CosmosDB initialized with camelCase serialization");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to initialize Cosmos DB: {ex.Message}");
            }
        }
    }

    public bool IsConfigured => _cosmosClient != null && _database != null;

    private Container? GetContainer(string containerName)
    {
        return _database?.GetContainer(containerName);
    }

    // Photo operations
    public async Task<List<Photo>> GetPhotosAsync(string clientId)
    {
        if (!IsConfigured)
        {
            Console.WriteLine("[GetPhotosAsync] CosmosDB not configured!");
            return new List<Photo>();
        }

        try
        {
            var container = GetContainer("Photos");
            if (container == null)
            {
                Console.WriteLine("[GetPhotosAsync] Container is null!");
                return new List<Photo>();
            }

            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.clientId = @clientId AND c.isActive = true")
                .WithParameter("@clientId", clientId);
            
            var iterator = container.GetItemQueryIterator<Photo>(query);
            var results = new List<Photo>();
            
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
            }

            Console.WriteLine($"✅ Fetched {results.Count} photos for {clientId}");
            return results;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"❌ Error fetching photos for {clientId}: {ex.Message}");
            return new List<Photo>();
        }
    }

    public async Task<Photo?> GetDailyPhotoAsync(string clientId)
    {
        var photos = await GetPhotosAsync(clientId);
        
        if (!photos.Any())
        {
            return null;
        }

        // Select photo based on current date
        var today = DateTime.Now;
        var photoIndex = today.Day % photos.Count;
        return photos[photoIndex];
    }

    // Reminder operations
    public async Task<List<Reminder>> GetRemindersAsync(string clientId)
    {
        if (!IsConfigured) return new List<Reminder>();

        try
        {
            var container = GetContainer("Clients"); // Legacy support - reminders stored in Clients container
            if (container == null) return new List<Reminder>();

            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.clientId = @clientId AND c.type = 'reminder'")
                .WithParameter("@clientId", clientId);

            var iterator = container.GetItemQueryIterator<Reminder>(query);
            var results = new List<Reminder>();

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
            }

            return results;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching reminders for {clientId}: {ex.Message}");
            return new List<Reminder>();
        }
    }

    // Appointment operations
    public async Task<List<Appointment>> GetUpcomingAppointmentsAsync(string clientId, int daysAhead = 7)
    {
        if (!IsConfigured) return new List<Appointment>();

        try
        {
            var container = GetContainer("Appointments");
            if (container == null) return new List<Appointment>();

            var today = DateTime.Today.ToString("yyyy-MM-dd");
            var nextWeek = DateTime.Today.AddDays(daysAhead).ToString("yyyy-MM-dd");

            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.clientId = @clientId AND c.date >= @today AND c.date <= @nextWeek ORDER BY c.date, c.time")
                .WithParameter("@clientId", clientId)
                .WithParameter("@today", today)
                .WithParameter("@nextWeek", nextWeek);

            var iterator = container.GetItemQueryIterator<Appointment>(query);
            var results = new List<Appointment>();

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
            }

            return results;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching appointments for {clientId}: {ex.Message}");
            return new List<Appointment>();
        }
    }

    // Food operations
    public async Task<List<Food>> GetTodaysFoodsAsync(string clientId)
    {
        if (!IsConfigured) return new List<Food>();

        try
        {
            var container = GetContainer("Foods");
            if (container == null) return new List<Food>();

            var today = DateTime.Today.ToString("yyyy-MM-dd");

            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.clientId = @clientId AND c.date = @today ORDER BY c.timeSlot")
                .WithParameter("@clientId", clientId)
                .WithParameter("@today", today);

            var iterator = container.GetItemQueryIterator<Food>(query);
            var results = new List<Food>();

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
            }

            return results;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching foods for {clientId}: {ex.Message}");
            return new List<Food>();
        }
    }

    // Medication operations
    public async Task<List<Medication>> GetTodaysMedicationsAsync(string clientId)
    {
        if (!IsConfigured) return new List<Medication>();

        try
        {
            var container = GetContainer("Medications");
            if (container == null) return new List<Medication>();

            var today = DateTime.Today.ToString("yyyy-MM-dd");

            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.clientId = @clientId AND (c.date = @today OR c.recurring = true) ORDER BY c.time")
                .WithParameter("@clientId", clientId)
                .WithParameter("@today", today);

            var iterator = container.GetItemQueryIterator<Medication>(query);
            var results = new List<Medication>();

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
            }

            return results;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching medications for {clientId}: {ex.Message}");
            return new List<Medication>();
        }
    }

    // Create operations
    public async Task<T?> CreateItemAsync<T>(T item, string containerName) where T : class
    {
        if (!IsConfigured) return null;

        try
        {
            var container = GetContainer(containerName);
            if (container == null) return null;

            var response = await container.CreateItemAsync(item);
            return response.Resource;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error creating item in {containerName}: {ex.Message}");
            return null;
        }
    }

    // Generic query method
    public async Task<List<T>> QueryItemsAsync<T>(string containerName, QueryDefinition query) where T : class
    {
        if (!IsConfigured) return new List<T>();

        try
        {
            var container = GetContainer(containerName);
            if (container == null) return new List<T>();

            var iterator = container.GetItemQueryIterator<T>(query);
            var results = new List<T>();

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response);
            }

            return results;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error querying {containerName}: {ex.Message}");
            return new List<T>();
        }
    }

    // Get client settings
    public async Task<Client?> GetClientAsync(string clientId)
    {
        if (!IsConfigured) return null;

        try
        {
            var container = GetContainer("Clients");
            if (container == null) return null;

            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.clientId = @clientId AND c.type = 'client'")
                .WithParameter("@clientId", clientId);

            var iterator = container.GetItemQueryIterator<Client>(query);
            
            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                var client = response.FirstOrDefault();
                if (client != null) return client;
            }

            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching client {clientId}: {ex.Message}");
            return null;
        }
    }
}
