using ReminderApp.Functions.Models;
using System.Text.Json;

namespace ReminderApp.Functions.Services;

/// <summary>
/// Service to migrate data from Google Sheets to Cosmos DB
/// Converts Google Sheets format to Cosmos DB document format
/// </summary>
public class SheetsToCosmosService
{
    private readonly GoogleSheetsService _googleSheetsService;
    private readonly CosmosDbService _cosmosDbService;

    public SheetsToCosmosService(GoogleSheetsService googleSheetsService, CosmosDbService cosmosDbService)
    {
        _googleSheetsService = googleSheetsService;
        _cosmosDbService = cosmosDbService;
    }

    /// <summary>
    /// Migrate complete client data from Google Sheets to Cosmos DB
    /// </summary>
    public async Task<bool> MigrateClientDataAsync(string clientId)
    {
        try
        {
            Console.WriteLine($"Starting migration for client: {clientId}");

            // Get data from Google Sheets
            var sheetsData = await _googleSheetsService.GetCompleteClientDataAsync(clientId);
            if (sheetsData == null)
            {
                Console.WriteLine($"No data found in Google Sheets for client: {clientId}");
                return false;
            }

            // Migrate Client Configuration
            var clientSuccess = await MigrateClientConfigAsync(sheetsData);
            
            // Migrate Photos
            var photosSuccess = await MigratePhotosAsync(sheetsData);
            
            // Migrate Medications  
            var medicationsSuccess = await MigrateMedicationsAsync(sheetsData);
            
            // Migrate Foods
            var foodsSuccess = await MigrateFoodsAsync(sheetsData);
            
            // Migrate Messages
            var messagesSuccess = await MigrateMessagesAsync(sheetsData);
            
            // Migrate Appointments
            var appointmentsSuccess = await MigrateAppointmentsAsync(sheetsData);

            var overallSuccess = clientSuccess && photosSuccess && medicationsSuccess && 
                                 foodsSuccess && messagesSuccess && appointmentsSuccess;

            Console.WriteLine($"Migration completed for {clientId}. Success: {overallSuccess}");
            return overallSuccess;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error migrating client {clientId}: {ex.Message}");
            return false;
        }
    }

    private async Task<bool> MigrateClientConfigAsync(GoogleSheetsService.GoogleSheetsClientData sheetsData)
    {
        try
        {
            if (sheetsData.ConfigRow == null || sheetsData.ConfigRow.Count < 10)
            {
                Console.WriteLine($"Incomplete config data for {sheetsData.ClientId}");
                return false;
            }

            var row = sheetsData.ConfigRow;
            
            // Parse Google Sheets Config format:
            // A: ClientID | B: Nimi | C: Puhelin | D: TelegramID | ... | J: UsePhotos
            var client = new Client
            {
                Id = sheetsData.ClientId,
                ClientId = sheetsData.ClientId,
                Type = "client",
                Name = row.Count > 1 ? row[1] : "",
                DisplayName = row.Count > 1 ? row[1] : "",
                Timezone = "Europe/Helsinki",
                Language = "fi",
                Settings = new ClientSettings
                {
                    UseWeather = true,
                    UsePhotos = ParseBoolFromSheets(row, 9), // Column J
                    UseTelegram = !string.IsNullOrEmpty(row.Count > 3 ? row[3] : ""), // Has TelegramID
                    UseSMS = true,
                    UseFoodReminders = true,
                    FoodReminderType = "detailed", // Default to detailed from sheets
                    SimpleReminderText = "Muista syödä",
                    MealTimes = new Dictionary<string, string>() // Will be set if simplified
                },
                Contacts = new ClientContacts
                {
                    PrimaryFamily = "Perhe",
                    Phone = row.Count > 2 ? row[2] : "",
                    EmergencyContact = row.Count > 2 ? row[2] : ""
                },
                CreatedAt = DateTime.UtcNow.ToString("O"),
                UpdatedAt = DateTime.UtcNow.ToString("O")
            };

            // Save to Cosmos DB
            var savedClient = await _cosmosDbService.CreateItemAsync<Client>("Clients", client);
            var success = savedClient != null;
            
            Console.WriteLine($"Client config migration: {(success ? "SUCCESS" : "FAILED")}");
            return success;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error migrating client config: {ex.Message}");
            return false;
        }
    }

    private async Task<bool> MigratePhotosAsync(GoogleSheetsService.GoogleSheetsClientData sheetsData)
    {
        try
        {
            if (sheetsData.PhotosData == null || sheetsData.PhotosData.Count <= 1)
            {
                Console.WriteLine($"No photos to migrate for {sheetsData.ClientId}");
                return true; // Not an error, just no photos
            }

            var successCount = 0;
            var totalCount = 0;

            // Skip header row
            foreach (var row in sheetsData.PhotosData.Skip(1))
            {
                // Google Sheets format: ClientID | URL | Kuvaus | Tyyppi | Järjestys
                if (row.Count < 3 || !string.Equals(row[0], sheetsData.ClientId, StringComparison.OrdinalIgnoreCase))
                    continue;

                totalCount++;

                var photo = new Photo
                {
                    Id = $"sheets_{sheetsData.ClientId}_{totalCount}",
                    ClientId = sheetsData.ClientId,
                    Url = row[1],
                    Caption = row.Count > 2 ? row[2] : $"Photo {totalCount}",
                    UploadSource = "google_sheets_migration",
                    IsActive = true,
                    Tags = new List<string> { "migration", "google_sheets" },
                    CreatedAt = DateTime.UtcNow.ToString("O")
                };

                var savedPhoto = await _cosmosDbService.CreateItemAsync<Photo>("Photos", photo);
                if (savedPhoto != null) successCount++;
            }

            Console.WriteLine($"Photos migration: {successCount}/{totalCount} SUCCESS");
            return successCount == totalCount;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error migrating photos: {ex.Message}");
            return false;
        }
    }

    private async Task<bool> MigrateMedicationsAsync(GoogleSheetsService.GoogleSheetsClientData sheetsData)
    {
        try
        {
            if (sheetsData.MedicationsData == null || sheetsData.MedicationsData.Count <= 1)
            {
                Console.WriteLine($"No medications to migrate for {sheetsData.ClientId}");
                return true;
            }

            var successCount = 0;
            var totalCount = 0;

            // Skip header row
            foreach (var row in sheetsData.MedicationsData.Skip(1))
            {
                // Google Sheets format: ClientID | Aika | Kellonaika | Lääke | Annostus
                if (row.Count < 4 || !string.Equals(row[0], sheetsData.ClientId, StringComparison.OrdinalIgnoreCase))
                    continue;

                totalCount++;

                var medication = new Medication
                {
                    Id = $"sheets_med_{sheetsData.ClientId}_{totalCount}",
                    ClientId = sheetsData.ClientId,
                    TimeSlot = ConvertTimeOfDayToTimeSlot(row[1]), // AAMU -> 08:00
                    Description = row.Count > 3 ? row[3] : "Lääke",
                    Instructions = row.Count > 4 ? row[4] : "",
                    Completed = false,
                    CompletedAt = null,
                    EncouragingMessage = GetMedicationEncouragement(),
                    CreatedAt = DateTime.UtcNow.ToString("O")
                };

                var savedMedication = await _cosmosDbService.CreateItemAsync<Medication>("Medications", medication);
                if (savedMedication != null) successCount++;
            }

            Console.WriteLine($"Medications migration: {successCount}/{totalCount} SUCCESS");
            return successCount == totalCount;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error migrating medications: {ex.Message}");
            return false;
        }
    }

    private async Task<bool> MigrateFoodsAsync(GoogleSheetsService.GoogleSheetsClientData sheetsData)
    {
        try
        {
            if (sheetsData.FoodsData == null || sheetsData.FoodsData.Count <= 1)
            {
                Console.WriteLine($"No foods to migrate for {sheetsData.ClientId}");
                return true;
            }

            var successCount = 0;
            var totalCount = 0;

            // Skip header row
            foreach (var row in sheetsData.FoodsData.Skip(1))
            {
                // Google Sheets format: ClientID | Aika | Ateria | Ehdotus | Kellonaika
                if (row.Count < 4 || !string.Equals(row[0], sheetsData.ClientId, StringComparison.OrdinalIgnoreCase))
                    continue;

                totalCount++;

                var food = new Food
                {
                    Id = $"sheets_food_{sheetsData.ClientId}_{totalCount}",
                    ClientId = sheetsData.ClientId,
                    TimeSlot = ConvertTimeOfDayToTimeSlot(row[1]), // AAMU -> 08:00
                    Suggestions = new List<string> { row.Count > 3 ? row[3] : "Ruokailu" },
                    Completed = false,
                    CompletedAt = null,
                    EncouragingMessage = GetFoodEncouragement(),
                    CreatedAt = DateTime.UtcNow.ToString("O")
                };

                var savedFood = await _cosmosDbService.CreateItemAsync<Food>("Foods", food);
                if (savedFood != null) successCount++;
            }

            Console.WriteLine($"Foods migration: {successCount}/{totalCount} SUCCESS");
            return successCount == totalCount;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error migrating foods: {ex.Message}");
            return false;
        }
    }

    private async Task<bool> MigrateMessagesAsync(GoogleSheetsService.GoogleSheetsClientData sheetsData)
    {
        try
        {
            if (sheetsData.MessagesData == null || sheetsData.MessagesData.Count <= 1)
            {
                Console.WriteLine($"No messages to migrate for {sheetsData.ClientId}");
                return true;
            }

            var successCount = 0;
            var totalCount = 0;

            // Skip header row - Messages are typically daily greetings/reminders
            foreach (var row in sheetsData.MessagesData.Skip(1))
            {
                if (row.Count < 2) continue;

                totalCount++;

                var message = new Message
                {
                    Id = $"sheets_msg_{sheetsData.ClientId}_{totalCount}",
                    ClientId = sheetsData.ClientId,
                    Content = row[1], // Message content
                    Priority = row.Count > 2 ? ParseIntFromSheets(row[2]) : 2,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow.ToString("O")
                };

                var savedMessage = await _cosmosDbService.CreateItemAsync<Message>("Messages", message);
                if (savedMessage != null) successCount++;
            }

            Console.WriteLine($"Messages migration: {successCount}/{totalCount} SUCCESS");
            return successCount == totalCount;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error migrating messages: {ex.Message}");
            return false;
        }
    }

    private async Task<bool> MigrateAppointmentsAsync(GoogleSheetsService.GoogleSheetsClientData sheetsData)
    {
        try
        {
            if (sheetsData.AppointmentsData == null || sheetsData.AppointmentsData.Count <= 1)
            {
                Console.WriteLine($"No appointments to migrate for {sheetsData.ClientId}");
                return true;
            }

            var successCount = 0;
            var totalCount = 0;

            // Skip header row
            foreach (var row in sheetsData.AppointmentsData.Skip(1))
            {
                // Google Sheets format: Päivämäärä | Viesti | Prioriteetti | Päiviä ennen | Päiviä jälkeen | Kellonaika
                if (row.Count < 6) continue;

                totalCount++;

                var appointment = new Appointment
                {
                    Id = $"sheets_app_{sheetsData.ClientId}_{totalCount}",
                    ClientId = sheetsData.ClientId,
                    DateTime = ParseDateFromSheets(row[0], row[5]), // Date + Time
                    Title = row[1],
                    Description = row[1],
                    Location = "",
                    Priority = ParseIntFromSheets(row[2]),
                    NotificationDaysBefore = ParseIntFromSheets(row[3]),
                    IsCompleted = false,
                    CreatedAt = DateTime.UtcNow.ToString("O")
                };

                var savedAppointment = await _cosmosDbService.CreateItemAsync<Appointment>("Appointments", appointment);
                if (savedAppointment != null) successCount++;
            }

            Console.WriteLine($"Appointments migration: {successCount}/{totalCount} SUCCESS");
            return successCount == totalCount;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error migrating appointments: {ex.Message}");
            return false;
        }
    }

    // Helper methods for parsing Google Sheets data
    private static bool ParseBoolFromSheets(List<string> row, int index)
    {
        if (row.Count <= index) return false;
        var value = row[index]?.ToUpperInvariant();
        return value == "YES" || value == "TRUE" || value == "KYLLÄ" || value == "1";
    }

    private static int ParseIntFromSheets(string value)
    {
        return int.TryParse(value, out int result) ? result : 0;
    }

    private static string ConvertTimeOfDayToTimeSlot(string timeOfDay)
    {
        return timeOfDay.ToUpperInvariant() switch
        {
            "AAMU" => "08:00",
            "PÄIVÄ" => "12:00",
            "ILTA" => "18:00",
            "YÖ" => "21:00",
            _ => "12:00"
        };
    }

    private static string ParseDateFromSheets(string dateStr, string timeStr)
    {
        try
        {
            // Try to parse various date formats
            DateTime date;
            if (DateTime.TryParseExact(dateStr, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out date) ||
                DateTime.TryParseExact(dateStr, "dd.MM.yyyy", null, System.Globalization.DateTimeStyles.None, out date) ||
                DateTime.TryParse(dateStr, out date))
            {
                // Parse time if provided
                if (TimeSpan.TryParse(timeStr?.Replace("klo ", ""), out var time))
                {
                    date = date.Add(time);
                }

                return date.ToString("O");
            }
        }
        catch { }

        // Fallback to current date
        return DateTime.UtcNow.ToString("O");
    }

    private static string GetMedicationEncouragement()
    {
        var messages = new[]
        {
            "Hyvä! Lääke on tärkeä terveydelle 💊",
            "Mahtavaa! Säännöllisyys on avain hyvinvointiin ⏰",
            "Erinomaista! Huolehdit itsestäsi hyvin 👍"
        };
        return messages[Random.Shared.Next(messages.Length)];
    }

    private static string GetFoodEncouragement()
    {
        var messages = new[]
        {
            "Hyvä! Kunnollinen ravinto antaa voimia 🍽️",
            "Mahtavaa! Säännöllinen ateriarytmi on tärkeää ⏰",
            "Herkullista! Nautitpa varmasti ateriasta 😊"
        };
        return messages[Random.Shared.Next(messages.Length)];
    }
}
