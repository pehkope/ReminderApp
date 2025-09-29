# 🌤️ Weather-Based Activity Recommendations Setup

## 📋 Overview
The ReminderApp now includes intelligent weather-based activity recommendations for mom at her reminder times (08:00, 12:00, 16:00, 20:00).

## 🔧 Setup Steps

### 1. Get OpenWeatherMap API Key (Optional)
```
1. Go to https://openweathermap.org/api
2. Sign up for free account
3. Get your API key
4. Add to Azure Function App Settings:
   Key: WEATHER_API_KEY
   Value: your_api_key_here
```

### 2. How It Works
The system automatically:
- **Fetches real weather** from OpenWeatherMap API (Helsinki)
- **Fallback weather** if no API key (works without setup)
- **Smart recommendations** based on:
  - Temperature (cold/warm activities)
  - Weather conditions (rain/snow/sun)
  - Time of day (morning walk vs evening rest)

## 🌟 Smart Recommendations Examples

### ☀️ Sunny & Warm (20°C+)
- "🌞 Ihana lämpöä! Hyvä päivä kävelylle tai pihan hoitoon"
- "🚶‍♀️ Lähde kävelylle - aurinko paistaa!"

### 🌧️ Rainy Weather
- "🌧️ Sataa - hyvä päivä sisäpuuhille"
- "☔ Jos lähdet ulos, ota sateenvarjo mukaan"
- "📚 Ehkä lukuhetki tai käsityöt?"

### ❄️ Cold Weather (0°C-)
- "❄️ Pakkasta! Ole varovainen liukkailla"
- "🔥 Pysy lämpimässä sisällä"

### 🌤️ Mild Weather (10-20°C)
- "🧥 Mukava sää, ota takki mukaan ja mene ulos"
- "☕ Ehkä kahvikierros naapurin kanssa?"

## 🕐 Time-Based Social Suggestions
- **Morning (08:00)**: "🌅 Aamukävely olisi virkistävää"
- **Lunch (12:00)**: "🚶‍♀️ Lounaan jälkeen pieni kävely auttaa ruoansulatukseen"
- **Afternoon (14-17)**: "👥 Hyvä sää - ehkä soittaa ystävälle ja tavata?"
- **Evening (16:00+)**: "🌆 Rauhallinen ilta - ehkä istuskelu parvekkeella"

## 📱 API Response
Weather recommendation appears in API:
```json
{
  "weather": {
    "description": "Aurinkoista",
    "temperature": "22°C",
    "condition": "clear",
    "humidity": 45,
    "windSpeed": 2.1,
    "recommendation": "☀️ Aurinkoista! Loistava päivä ulkoiluun 🚶‍♀️ Lähde kävelylle - aurinko paistaa!"
  }
}
```

## ✅ Works Without API Key
- Uses fallback weather data
- Still provides time-based recommendations
- No setup required for basic functionality

## 🎯 Business Value
- **Personalized care**: Weather-aware suggestions
- **Safety focus**: Warnings for slippery conditions
- **Social engagement**: Encourages calls and visits
- **Activity promotion**: Indoor/outdoor balance
- **Scalable**: Works for all clients with different preferences

