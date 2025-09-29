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
    /// Get weather information for location
    /// </summary>
    public async Task<WeatherInfo> GetWeatherAsync(string location = "Helsinki,FI")
    {
        if (!IsConfigured)
        {
            return GetFallbackWeather();
        }

        try
        {
            var url = $"https://api.openweathermap.org/data/2.5/weather?q={location}&appid={_weatherApiKey}&units=metric&lang=fi";
            
            var response = await _httpClient.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                Console.WriteLine($"Weather API request failed: {response.StatusCode}");
                return GetFallbackWeather();
            }

            var content = await response.Content.ReadAsStringAsync();
            var weatherData = JsonSerializer.Deserialize<OpenWeatherResponse>(content);

            if (weatherData?.Weather?.Any() == true && weatherData.Main != null)
            {
                var temperature = Math.Round(weatherData.Main.Temp);
                var weatherCondition = weatherData.Weather[0].Main?.ToLowerInvariant() ?? "unknown";
                var description = weatherData.Weather[0].Description ?? "tuntematon";

                return new WeatherInfo
                {
                    Description = char.ToUpperInvariant(description[0]) + description[1..],
                    Temperature = $"{temperature}°C",
                    Condition = weatherCondition,
                    Humidity = weatherData.Main.Humidity,
                    WindSpeed = weatherData.Wind?.Speed ?? 0
                };
            }

            return GetFallbackWeather();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error fetching weather: {ex.Message}");
            return GetFallbackWeather();
        }
    }

    /// <summary>
    /// Get smart activity recommendations based on weather, time and client
    /// </summary>
    public string GetActivityRecommendation(WeatherInfo weather, string timeOfDay, string clientId = "mom")
    {
        var temp = ExtractTemperature(weather.Temperature);
        var condition = weather.Condition?.ToLowerInvariant() ?? "";
        var hour = DateTime.Now.Hour;

        // Weather-based recommendations
        var recommendations = new List<string>();

        // Temperature-based suggestions
        if (temp >= 20)
        {
            recommendations.Add("🌞 Ihana lämpöä! Hyvä päivä kävelylle tai pihan hoitoon");
            if (hour >= 10 && hour <= 16)
            {
                recommendations.Add("🚶‍♀️ Lähde kävelylle - aurinko paistaa!");
            }
        }
        else if (temp >= 10)
        {
            recommendations.Add("🧥 Mukava sää, ota takki mukaan ja mene ulos");
            recommendations.Add("☕ Ehkä kahvikierros naapurin kanssa?");
        }
        else if (temp >= 0)
        {
            recommendations.Add("🧣 Kylmähköä, pukeudu lämpimästi jos menet ulos");
            recommendations.Add("🏠 Hyvä päivä sisäpuuhille");
        }
        else
        {
            recommendations.Add("❄️ Pakkasta! Ole varovainen liukkailla");
            recommendations.Add("🔥 Pysy lämpimässä sisällä");
        }

        // Weather condition based
        if (condition.Contains("rain") || condition.Contains("drizzle"))
        {
            recommendations.Clear();
            recommendations.Add("🌧️ Sataa - hyvä päivä sisäpuuhille");
            recommendations.Add("☔ Jos lähdet ulos, ota sateenvarjo mukaan");
            recommendations.Add("📚 Ehkä lukuhetki tai käsityöt?");
        }
        else if (condition.Contains("snow"))
        {
            recommendations.Clear();
            recommendations.Add("❄️ Lumisadetta - ole varovainen ulos mennessä");
            recommendations.Add("🧤 Liukastumisvaaaa - tartu kaiteeseen");
        }
        else if (condition.Contains("clear") || condition.Contains("sun"))
        {
            recommendations.Add("☀️ Aurinkoista! Loistava päivä ulkoiluun");
        }

        // Time-specific suggestions
        if (timeOfDay == "aamu" && hour <= 10)
        {
            recommendations.Add("🌅 Aamukävely olisi virkistävää");
        }
        else if (timeOfDay == "päivä" && hour >= 11 && hour <= 15)
        {
            recommendations.Add("🚶‍♀️ Lounaan jälkeen pieni kävely auttaa ruoansulatukseen");
        }
        else if (timeOfDay == "ilta" && hour >= 16)
        {
            recommendations.Add("🌆 Rauhallinen ilta - ehkä istuskelu parvekkeella");
        }

        // Social suggestions based on weather and time
        if (temp >= 15 && !condition.Contains("rain") && hour >= 14 && hour <= 17)
        {
            recommendations.Add("👥 Hyvä sää - ehkä soittaa ystävälle ja tavata?");
        }
        else if (condition.Contains("rain") || temp < 5)
        {
            recommendations.Add("📞 Soita jollekulle - mukava hetki jutteluun");
        }

        // Return random recommendation or combine a few
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
            Description = "Pilvistä",
            Temperature = "12°C",
            Condition = "clouds"
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
