using ReminderApp.Functions.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ReminderApp.Functions.Services;

/// <summary>
/// Weather service that provides weather data and smart activity recommendations
/// </summary>
public class WeatherService
{
    private readonly HttpClient _httpClient;
    private readonly string? _weatherApiKey;
    private readonly CosmosDbService _cosmosDbService;
    private static readonly Random _random = new Random();

    public WeatherService(CosmosDbService cosmosDbService)
    {
        _httpClient = new HttpClient();
        _weatherApiKey = Environment.GetEnvironmentVariable("WEATHER_API_KEY");
        _cosmosDbService = cosmosDbService;
    }

    public bool IsConfigured => !string.IsNullOrEmpty(_weatherApiKey);

    /// <summary>
    /// Get weather information for location using same logic as GAS code
    /// </summary>
    public async Task<WeatherInfo> GetWeatherAsync(string location = "Helsinki")
    {
        var fallbackWeather = GetFallbackWeather();
        
        if (!IsConfigured)
        {
            Console.WriteLine("Weather API key not configured");
            return fallbackWeather;
        }

        try
        {
            var url = $"https://api.openweathermap.org/data/2.5/weather?q={location}&units=metric&lang=fi&appid={_weatherApiKey}";
            
            var response = await _httpClient.GetAsync(url);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"Weather API Error: {response.StatusCode} - {content}");
                fallbackWeather.Description = "Sääpalvelu ei vastaa. Katso ulos ikkunasta! 😊";
                return fallbackWeather;
            }

            var weatherData = JsonSerializer.Deserialize<OpenWeatherResponse>(content);

            if (weatherData?.Weather?.Any() != true || weatherData.Main == null)
            {
                Console.WriteLine("Weather API response was successful but data is not in expected format.");
                fallbackWeather.Description = "Emme saaneet säätietoja, katso säätiedot itse. Nauti päivästä! 😊";
                return fallbackWeather;
            }

            var temp = weatherData.Main.Temp;
            var description = weatherData.Weather[0].Description?.ToLowerInvariant() ?? "";
            var mainWeather = weatherData.Weather[0].Main?.ToLowerInvariant() ?? "";

            // Use same logic as GAS code + add cold logic with wind chill
            var isRaining = mainWeather == "rain" || description.Contains("sade");
            var windSpeed = weatherData.Wind?.Speed ?? 0; // m/s
            var isCold = IsTemperatureCold(temp, DateTime.Now.Month, windSpeed);
            var isGood = temp >= 15 && !isRaining && !isCold;

            return new WeatherInfo
            {
                Description = $"Sää tänään: {temp:F1}°C, {weatherData.Weather[0].Description}.",
                Temperature = $"{temp:F1}°C",
                Condition = mainWeather,
                Humidity = weatherData.Main.Humidity,
                WindSpeed = weatherData.Wind?.Speed ?? 0,
                IsGood = isGood,
                IsRaining = isRaining,
                IsCold = isCold
            };
        }
        catch (JsonException ex)
        {
            Console.WriteLine($"JSON parsing error getting weather: {ex.Message}");
            fallbackWeather.Description = "Säätietojen luku epäonnistui. Kokeile hetken kuluttua uudelleen tai nauti säästä sellaisenaan! 😊";
            return fallbackWeather;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Exception getting weather: {ex.Message}");
            fallbackWeather.Description = "Sääpalveluun ei saatu yhteyttä. Pieni kävelylenkki piristää aina! 😊";
            return fallbackWeather;
        }
    }

    /// <summary>
    /// Hae tervehdys ja puuhaa-ehdotus äidille (klo 8, 12, 16, 20) CosmosDB:stä
    /// </summary>
    public async Task<(string greeting, string activity)> GetGreetingAndActivityAsync(WeatherInfo weather, int hour, string clientId = "mom")
    {
        // Määritä oikea tunti tarkan ajan sijaan (8, 12, 16, 20)
        var targetHour = hour switch
        {
            >= 6 and < 10 => 8,
            >= 10 and < 14 => 12,
            >= 14 and < 18 => 16,
            >= 18 and < 22 => 20,
            _ => 20 // Default to evening
        };

        // Hae viestit CosmosDB:stä
        var greetingMessage = await _cosmosDbService.GetGreetingMessageAsync(clientId, targetHour);
        
        if (greetingMessage == null || !greetingMessage.Messages.Any())
        {
            Console.WriteLine($"⚠️ No greeting messages found for hour {targetHour}, using fallback");
            return GetFallbackGreetingAndActivity(weather, hour);
        }

        // 1. TERVEHDYS - Satunnaisesti listalta
        var greeting = greetingMessage.Messages[_random.Next(greetingMessage.Messages.Count)];

        // 2. PUUHAA - Sään mukaan
        string activity;
        
        if (weather.IsRaining || weather.IsCold)
        {
            // SISÄPUUHAA (huono sää)
            if (greetingMessage.ActivitiesIndoor.Any())
            {
                var indoorActivities = greetingMessage.ActivitiesIndoor;
                activity = indoorActivities[_random.Next(indoorActivities.Count)];
            }
            else
            {
                activity = "🏠 Rentoudu kotona ja nauti lämpimästä juomasta ☕";
            }
        }
        else
        {
            // ULKOILU (hyvä sää!)
            if (greetingMessage.ActivitiesOutdoor.Any())
            {
                var outdoorActivities = greetingMessage.ActivitiesOutdoor;
                activity = outdoorActivities[_random.Next(outdoorActivities.Count)];
            }
            else
            {
                activity = "🚶‍♀️ Kävele ulos nauttimaan hyvästä säästä! ☀️";
            }
        }

        Console.WriteLine($"✅ Selected greeting and activity from CosmosDB for hour {targetHour}");
        return (greeting, activity);
    }

    /// <summary>
    /// Fallback tervehdykset ja aktiviteetit jos CosmosDB:stä ei löydy
    /// </summary>
    private (string greeting, string activity) GetFallbackGreetingAndActivity(WeatherInfo weather, int hour)
    {
        // 1. TERVEHDYS (paljon emojeja!)
        var greeting = hour switch
        {
            >= 6 and < 10 => "🌅 Hyvää huomenta kultaseni! ☀️ Uusi päivä on täynnä mahdollisuuksia! 💛",
            >= 10 and < 14 => "🌞 Mukavaa päivää rakas! ☀️ Toivottavasti lounas maistuu hyvin! 🍽️",
            >= 14 and < 18 => "☕ Hyvää iltapäivää kulta! 🌅 Hetki rentoutumiseen! 💕",
            >= 18 and < 22 => "🌙 Hyvää iltaa rakas! ✨ Rauhallista iltaa ja lepoa! 💤",
            _ => "💤 Hyvää yötä kultaseni! Nukku hyvin! 🌙"
        };

        // 2. PUUHAA (sään mukaan)
        var activity = "";
        
        if (weather.IsRaining || weather.IsCold)
        {
            // SISÄPUUHAA (huono sää)
            activity = hour switch
            {
                >= 6 and < 10 => "☎️ Soita jollekin ystävälle ja kysy kuulumisia! Mukava juttuhetki piristää aamua 💕 | 📚 Tai lue hyvä lehti kahvikupillisen kera ☕",
                >= 10 and < 14 => "🧹 Pieni siivoushetki kotona? Laita pyykkikoneeseen pyykki tai järjestele kaappeja 🏠 | 🎵 Kuuntele musiikkia ja nauti kahvihetkestä ☕",
                >= 14 and < 18 => "☎️ Soita Hannelelle tai Marjalle - mukava juttuhetki! 💬 | 📺 Katso joku kiinnostava ohjelma televisiosta 📺",
                >= 18 and < 22 => "🛀 Lämmin suihku ja sitten sohvalle rentoutumaan 💤 | 📖 Lue hetki hyvää kirjaa ennen nukkumaanmenoa 🌙",
                _ => "💤 Rentoudu ja valmistaudu lepoon 🌙"
            };
        }
        else
        {
            // ULKOILU / KÄVELYREITTEJÄ (hyvä sää!)
            activity = hour switch
            {
                >= 6 and < 10 => "🚶‍♀️ AAMUKÄVELY: Lähde kävelylle Lauttasaaren rantaan 🌊 Kaunis maisema piristää! Kävele pieni lenkki, ihana aamu! ☀️",
                >= 10 and < 14 => "🚶‍♀️ LOUNASKÄVELY: Kävele Lauttasaaren keskustaan ja takaisin 🛍️ Ehkä poikkea kaupassa? Ulkoilu auttaa ruoansulatukseen! 😊",
                >= 14 and < 18 => "🚶‍♀️ ILTAPÄIVÄKÄVELY: Käy kävelemässä Hevossalmen puistossa 🌳 Kaunis reitti ja rauhoittava metsä! Nauti luonnosta! 🍃",
                >= 18 and < 22 => "🌆 ILTAKÄVELY: Pieni iltalenkki Lauttasaaren rantaan 🌅 Auringonlasku on kaunis! Rauhoittava päätös päivälle 💕",
                _ => "💤 Rentoudu kotona - hyvä aika levätä 🏠"
            };
        }

        return (greeting, activity);
    }

    /// <summary>
    /// Get smart activity recommendations based on weather using GAS-style logic
    /// </summary>
    public string GetActivityRecommendation(WeatherInfo weather, string timeOfDay, string clientId = "mom")
    {
        var temp = ExtractTemperature(weather.Temperature);
        var hour = DateTime.Now.Hour;
        var recommendations = new List<string>();

        // Start with weather description message
        if (!string.IsNullOrEmpty(weather.Description))
        {
            recommendations.Add(weather.Description);
        }

        // Indoor recommendations for rain or cold weather
        if (weather.IsRaining || weather.IsCold)
        {
            if (weather.IsRaining)
            {
                recommendations.Add("🌧️ Sataa - hyvä päivä sisäpuuhille");
                recommendations.Add("☔ Jos lähdet ulos, ota sateenvarjo mukaan");
            }
            
            if (weather.IsCold)
            {
                if (temp < 0)
                {
                    recommendations.Add("❄️ Pakkasta! Ole varovainen liukkailla");
                }
                else
                {
                    recommendations.Add("🧣 Kylmää - pukeudu lämpimästi jos menet ulos");
                }
            }
            
            // Indoor activity suggestions
            recommendations.Add("🏠 Hyvä päivä sisäpuuhille");
            recommendations.Add("📚 Ehkä lukuhetki tai käsityöt?");
            recommendations.Add("📞 Soita jollekulle - mukava hetki jutteluun");
            recommendations.Add("☕ Lämmin juoma lämmittää");
        }
        else if (weather.IsGood) // Good weather: not raining, not cold, >= 15°C
        {
            recommendations.Add("🌞 Ihana sää! Loistava päivä ulkoiluun");
            
            // Time-based suggestions for good weather
            if (hour >= 8 && hour <= 10)
            {
                recommendations.Add("🌅 Aamukävely olisi virkistävää");
            }
            else if (hour >= 11 && hour <= 15)
            {
                recommendations.Add("🚶‍♀️ Lounaan jälkeen pieni kävely auttaa ruoansulatukseen");
            }
            else if (hour >= 14 && hour <= 17)
            {
                recommendations.Add("👥 Hyvä sää - ehkä soittaa ystävälle ja tavata?");
            }
            else if (hour >= 16 && hour <= 19)
            {
                recommendations.Add("🌆 Ihana ilta istuskeluun parvekkeella tai pihalla");
            }
        }
        else // Neutral weather: not good, not bad
        {
            recommendations.Add("🧥 Mukava sää, ota takki mukaan ja mene ulos");
            recommendations.Add("☕ Ehkä kahvikierros naapurin kanssa?");
        }

        // Return 1-2 recommendations
        if (recommendations.Count >= 2)
        {
            var selected = recommendations.Take(2).ToList();
            return string.Join(" ", selected);
        }

        return recommendations.FirstOrDefault() ?? "🌤️ Nauti päivästä omaan tahtiin";
    }

    private static WeatherInfo GetFallbackWeather()
    {
        return new WeatherInfo
        {
            Description = "Säätietoja ei saatu - nauti päivästä! 😊",
            Temperature = "12°C",
            Condition = "clouds",
            IsGood = false,
            IsRaining = false,
            IsCold = false
        };
    }

    /// <summary>
    /// Determine if temperature is cold based on season (Finnish climate) and wind chill
    /// </summary>
    private static bool IsTemperatureCold(double temperature, int month, double windSpeedMs)
    {
        // Calculate wind chill (feels like temperature)
        var feelsLike = CalculateWindChill(temperature, windSpeedMs);
        
        // Seasonal cold thresholds for Finland based on user requirements
        return month switch
        {
            12 or 1 or 2 => feelsLike < -5,     // Talvi: < -5°C on kylmää
            3 or 4 or 5 => feelsLike < 5,       // Kevät (maalis-touko): < 5°C on kylmää
            6 or 7 or 8 => feelsLike < 10,      // Kesä (kesä-elo): < 10°C on kylmää
            9 or 10 or 11 => feelsLike < 5,     // Syksy (syys-marras): < 5°C on kylmää
            _ => feelsLike < 5                  // Default: < 5°C is cold
        };
    }

    /// <summary>
    /// Calculate wind chill (feels like temperature)
    /// </summary>
    private static double CalculateWindChill(double temperatureC, double windSpeedMs)
    {
        // Convert wind speed from m/s to km/h
        var windSpeedKmh = windSpeedMs * 3.6;
        
        // Only apply wind chill if temperature is below 10°C and wind speed > 4.8 km/h
        if (temperatureC >= 10 || windSpeedKmh <= 4.8)
        {
            return temperatureC;
        }
        
        // Simplified wind chill formula for Finnish conditions
        // For every 1 m/s of wind over 3 m/s, it feels 1.5°C colder
        var windChillEffect = windSpeedMs > 3 ? (windSpeedMs - 3) * 1.5 : 0;
        return temperatureC - windChillEffect;
    }

    private static double ExtractTemperature(string tempStr)
    {
        if (double.TryParse(tempStr?.Replace("°C", ""), out double temp))
        {
            return temp;
        }
        return 10; // Default fallback
    }

    // OpenWeather API response models
    private class OpenWeatherResponse
    {
        [JsonPropertyName("weather")]
        public List<WeatherCondition>? Weather { get; set; }

        [JsonPropertyName("main")]
        public MainWeatherData? Main { get; set; }

        [JsonPropertyName("wind")]
        public WindData? Wind { get; set; }
    }

    private class WeatherCondition
    {
        [JsonPropertyName("main")]
        public string? Main { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }
    }

    private class MainWeatherData
    {
        [JsonPropertyName("temp")]
        public double Temp { get; set; }

        [JsonPropertyName("humidity")]
        public int Humidity { get; set; }
    }

    private class WindData
    {
        [JsonPropertyName("speed")]
        public double Speed { get; set; }
    }
}
