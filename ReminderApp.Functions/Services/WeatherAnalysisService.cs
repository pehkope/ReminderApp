using ReminderApp.Functions.Models;
using System.Globalization;

namespace ReminderApp.Functions.Services;

/// <summary>
/// Analyzes weather changes and generates smart suggestions for outdoor activities
/// </summary>
public class WeatherAnalysisService
{
    /// <summary>
    /// Generate smart suggestion based on weather forecast
    /// </summary>
    public string GenerateSmartSuggestion(WeatherCache currentWeather)
    {
        if (currentWeather.Forecast == null || !currentWeather.Forecast.Any())
        {
            return GenerateBasicSuggestion(currentWeather);
        }

        var today = currentWeather;
        var tomorrow = currentWeather.Forecast.FirstOrDefault();
        var dayAfterTomorrow = currentWeather.Forecast.Skip(1).FirstOrDefault();

        // Scenario 1: Good weather today, rain tomorrow
        if (!today.IsRaining && !today.IsCold && tomorrow != null && tomorrow.RainProbability > 60)
        {
            return "☀️ Tänään on hyvä sää, mutta huomenna sataa! " +
                   "Käy ulkona tänään ennen klo 18:00. 🌧️";
        }

        // Scenario 2: Rain today, good weather tomorrow
        if (today.IsRaining && tomorrow != null && tomorrow.IsGoodForOutdoor)
        {
            return $"🌧️ Tänään sataa, mutta huomenna ({tomorrow.DayOfWeek}) aurinkoista! " +
                   $"Odota huomiseen ulkoilulle. ☀️";
        }

        // Scenario 3: Cold today, warmer tomorrow
        if (today.IsCold && tomorrow != null && tomorrow.TempMax > today.Temperature + 3)
        {
            return $"❄️ Tänään kylmä ({today.Temperature:F1}°C), mutta huomenna lämpimämpi " +
                   $"({tomorrow.TempMax:F1}°C)! Odota huomiseen ulkoilulle. 🌡️";
        }

        // Scenario 4: Warming trend
        if (currentWeather.TemperatureTrend == "warming" && tomorrow != null)
        {
            return $"🌡️ Lämpötila nousee! Tänään {today.Temperature:F1}°C, " +
                   $"huomenna {tomorrow.TempMax:F1}°C. Hyvä aika ulkoilulle! ☀️";
        }

        // Scenario 5: Cooling trend - enjoy today
        if (currentWeather.TemperatureTrend == "cooling" && !today.IsRaining && !today.IsCold)
        {
            return "☀️ Lämpötila laskee seuraavina päivinä. " +
                   "Käytä hyväksi tämänpäiväinen hyvä sää! 🚶‍♀️";
        }

        // Scenario 6: Good weather window (today and tomorrow)
        if (!today.IsRaining && !today.IsCold && tomorrow != null && tomorrow.IsGoodForOutdoor)
        {
            return $"☀️ Loistava sää tänään ja huomenna! " +
                   $"Suunnittele pidempi kävelyretki tai tapaa ystäviä ulkona. 🌳";
        }

        // Scenario 7: Bad weather for several days
        if (today.IsRaining && tomorrow?.RainProbability > 50 && dayAfterTomorrow?.RainProbability > 50)
        {
            return "🌧️ Sateista useita päiviä. Hyvä aika sisäpuuhille: " +
                   "kirjojen lukemiseen, ystävien soittamiseen, tai television katseluun. 📚☕";
        }

        // Scenario 8: Cold period
        if (today.IsCold && tomorrow != null && tomorrow.TempMax < 2)
        {
            return $"❄️ Kylmää useita päiviä (alle {tomorrow.TempMax:F0}°C). " +
                   "Pysy lämpimässä sisällä ja nauti kuumasta kaakaosta! ☕🏠";
        }

        return GenerateBasicSuggestion(currentWeather);
    }

    /// <summary>
    /// Generate basic suggestion based on current weather only
    /// </summary>
    private string GenerateBasicSuggestion(WeatherCache weather)
    {
        if (weather.IsCold)
        {
            return "❄️ Kylmä sää - pysytään lämpimässä sisällä tänään!";
        }

        if (weather.IsRaining)
        {
            return "🌧️ Sateinen päivä - hyvä aika sisäpuuhille!";
        }

        if (weather.Temperature >= 15 && !weather.IsRaining)
        {
            return $"☀️ Mukava sää ({weather.Temperature:F1}°C) - hyvä aika kävelylenkille!";
        }

        return "🌤️ Nauti päivästä omaan tahtiin!";
    }

    /// <summary>
    /// Determine temperature trend
    /// </summary>
    public string DetermineTemperatureTrend(double current, double? previous)
    {
        if (previous == null) return "stable";

        var diff = current - previous.Value;

        if (diff > 2.0) return "warming";
        if (diff < -2.0) return "cooling";
        return "stable";
    }

    /// <summary>
    /// Find best outdoor time window today (based on hourly forecast if available)
    /// </summary>
    public string FindBestOutdoorTimeToday(WeatherCache weather)
    {
        // Simplified - in real implementation, use hourly forecast
        var helsinkiTz = TimeZoneInfo.FindSystemTimeZoneById("FLE Standard Time");
        var currentHour = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, helsinkiTz).Hour;

        if (weather.IsRaining)
        {
            return "🌧️ Tänään sataa - parempi pysyä sisällä.";
        }

        if (weather.IsCold)
        {
            // Warmest time usually between 12-15
            if (currentHour < 12)
            {
                return "☀️ Paras aika ulkoilulle: klo 12-15 (lämpimin aika).";
            }
            else if (currentHour < 15)
            {
                return "☀️ Käy ulkona nyt ennen klo 15 (lämpimin aika).";
            }
            else
            {
                return "🌡️ Päivän lämpimin aika on mennyt. Huomenna aamulla uusi mahdollisuus!";
            }
        }

        // Good weather
        if (currentHour < 10)
        {
            return $"☀️ Hyvä sää tänään! Ulkoilulle sopii mikä tahansa aika klo 10-18.";
        }
        else if (currentHour < 18)
        {
            return $"☀️ Hyvä sää jatkuu! Ehdi vielä ulos ennen klo 18.";
        }
        else
        {
            return "🌅 Ilta-aika - mukava hetki rauhalliselle kävelylle.";
        }
    }

    /// <summary>
    /// Get Finnish day of week name
    /// </summary>
    public string GetFinnishDayOfWeek(DateTime date)
    {
        var culture = new CultureInfo("fi-FI");
        return culture.DateTimeFormat.GetDayName(date.DayOfWeek);
    }
}

