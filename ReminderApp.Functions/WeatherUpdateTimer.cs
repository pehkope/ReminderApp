using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using ReminderApp.Functions.Services;

namespace ReminderApp.Functions;

/// <summary>
/// Timer Function joka päivittää sään automaattisesti 6 kertaa päivässä (joka 4. tunti)
/// </summary>
public class WeatherUpdateTimer
{
    private readonly WeatherService _weatherService;
    private readonly CosmosDbService _cosmosDbService;
    private readonly ILogger _logger;

    public WeatherUpdateTimer(
        WeatherService weatherService, 
        CosmosDbService cosmosDbService,
        ILoggerFactory loggerFactory)
    {
        _weatherService = weatherService;
        _cosmosDbService = cosmosDbService;
        _logger = loggerFactory.CreateLogger<WeatherUpdateTimer>();
    }

    /// <summary>
    /// Ajastus: 0 */4 * * * (joka 4. tunti: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
    /// = 6 päivitystä päivässä
    /// </summary>
    [Function("WeatherUpdateTimer")]
    public async Task Run([TimerTrigger("0 */4 * * *")] object myTimer)
    {
        _logger.LogInformation("⏰ Weather update timer triggered at: {Time}", DateTime.UtcNow);

        try
        {
            // Hae uniikit sääsijainnit kaikista asiakkaista
            var locations = new HashSet<string>();
            
            // Fallback locations (jos ei ole asiakkaita tai Cosmos DB ei ole konfiguroitu)
            locations.Add("Helsinki,FI");

            if (_cosmosDbService.IsConfigured)
            {
                try
                {
                    // Hae kaikki asiakkaat (yksinkertaisuuden vuoksi oletetaan FI-asiakkaita)
                    // TODO: Toteuta GetAllClientsAsync() jos tarvitaan
                    
                    // Toistaiseksi käytetään yleisiä suomalaisia kaupunkeja
                    locations.Add("Helsinki,FI");
                    locations.Add("Tampere,FI");
                    locations.Add("Turku,FI");
                    locations.Add("Oulu,FI");
                    locations.Add("Espoo,FI");
                    
                    _logger.LogInformation("📍 Found {Count} unique weather locations from clients", locations.Count);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "⚠️ Could not fetch clients, using default locations");
                }
            }

            foreach (var location in locations)
            {
                try
                {
                    _logger.LogInformation("🌤️ Fetching weather for {Location}...", location);
                    
                    // Hae sää suoraan API:sta (ei cachesta)
                    var weather = await _weatherService.FetchWeatherFromApiAsync(location);
                    
                    _logger.LogInformation("✅ Weather updated for {Location}: {Temp}, {Description}", 
                        location, weather.Temperature, weather.Description);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Failed to update weather for {Location}", location);
                }

                // Pieni viive että ei ylikuormiteta API:a
                await Task.Delay(TimeSpan.FromSeconds(2));
            }

            _logger.LogInformation("✅ Weather update completed for {Count} locations", locations.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Weather update timer failed");
        }
    }
}

