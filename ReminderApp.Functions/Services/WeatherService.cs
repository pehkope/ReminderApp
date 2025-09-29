using ReminderApp.Functions.Models;
using System.Text.Json;

namespace ReminderApp.Functions.Services;

/// <summary>
/// Weather service that provides weather data and smart activity recommendations
/// </summary>
public class WeatherService
{
    private readonly HttpClient _httpClient;
    private readonly string? _weatherApiKey;

    public WeatherService()
    {
        _httpClient = new HttpClient();
        _weatherApiKey = Environment.GetEnvironmentVariable("WEATHER_API_KEY");
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

            // Use same logic as GAS code
            var isGood = temp >= 15 && !description.Contains("sade");
            var isRaining = mainWeather == "rain" || description.Contains("sade");

            return new WeatherInfo
            {
                Description = $"Sää tänään: {temp:F1}°C, {weatherData.Weather[0].Description}.",
                Temperature = $"{temp:F1}°C",
                Condition = mainWeather,
                Humidity = weatherData.Main.Humidity,
                WindSpeed = weatherData.Wind?.Speed ?? 0,
                IsGood = isGood,
                IsRaining = isRaining
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

        // Use GAS-style logic: isGood and isRaining
        if (weather.IsRaining)
        {
            recommendations.Add("🌧️ Sataa - hyvä päivä sisäpuuhille");
            recommendations.Add("☔ Jos lähdet ulos, ota sateenvarjo mukaan");
            recommendations.Add("📚 Ehkä lukuhetki tai käsityöt?");
            recommendations.Add("📞 Soita jollekulle - mukava hetki jutteluun");
        }
        else if (weather.IsGood) // >= 15°C and not raining
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
        else if (temp < 0)
        {
            recommendations.Add("❄️ Pakkasta! Ole varovainen liukkailla");
            recommendations.Add("🔥 Pysy lämpimässä sisällä");
            recommendations.Add("📞 Ehkä soittaa ystävälle sisältä lämpimästä");
        }
        else if (temp < 10)
        {
            recommendations.Add("🧣 Kylmähköä, pukeudu lämpimästi jos menet ulos");
            recommendations.Add("🏠 Hyvä päivä sisäpuuhille");
            recommendations.Add("☕ Lämmin juoma lämmittää");
        }
        else // 10-15°C, not raining
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
            IsRaining = false
        };
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
