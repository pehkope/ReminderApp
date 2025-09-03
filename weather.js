/**
 * Weather module for ReminderApp
 * Handles weather data fetching, analysis, and weather-based activity suggestions
 */

// Include config constants
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/config.js').getContentText()); // For GAS module loading

// Weather API configuration
const WEATHER_API_KEY_KEY = "Weather_Api_Key";
const WEATHER_API_BASE = "https://api.openweathermap.org/data/2.5/weather";

/**
 * Optimized weather data fetching with caching removed
 * @param {string} weatherApiKey - Weather API key
 * @param {string} clientID - Client identifier
 */
function getWeatherDataOptimized_(weatherApiKey, clientID) {
  // 🗑️ CACHE POISTETTU - Säätieto haetaan aina suoraan
  // Frontend päivittää säätiedot 4x päivässä, ei tarvita server-side cachea
  console.log(`Fetching fresh weather data for ${clientID} (no cache)`);
  return getWeatherData_(weatherApiKey);
}

/**
 * Core weather API function
 * @param {string} weatherApiKey - Weather API key
 */
function getWeatherData_(weatherApiKey) {
  const weatherUrl = `${WEATHER_API_BASE}?q=Helsinki&units=metric&lang=fi&appid=${weatherApiKey}`;
  let defaultResult = {
    description: "Säätietoja ei saatu.",
    temperature: "N/A",
    isRaining: false,
    isSnowing: false,
    isCold: true,
    isVeryCold: true,
    isGoodForOutdoor: false,
    temp: 0
  };

  try {
    const response = UrlFetchApp.fetch(weatherUrl, { muteHttpExceptions: true });
    if (response.getResponseCode() == 200) {
      const weatherData = JSON.parse(response.getContentText());
      const temp = weatherData.main.temp;
      const description = weatherData.weather[0].description.toLowerCase();
      const mainWeather = weatherData.weather[0].main.toLowerCase();

      const isRaining = mainWeather === "rain" || description.includes("sade") || description.includes("shower");
      const isSnowing = mainWeather === "snow" || description.includes("lumi");
      const isCold = temp < 5;
      const isVeryCold = temp < 0;
      const isGoodForOutdoor = !isRaining && !isSnowing && temp >= 5;

      let weatherMessage;
      if (isRaining) {
        weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Sisäpuolella on mukavampaa! ${EMOJIS.RAINY}`;
      } else if (isSnowing) {
        weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Ulkona on kaunista mutta kylmää! ${EMOJIS.SNOWY}`;
      } else if (isGoodForOutdoor) {
        weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Loistava päivä ulkoiluun! ${EMOJIS.SUNNY}`;
      } else if (isCold) {
        weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Pukeudu lämpimästi jos menet ulos! 🧥`;
      } else {
        weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C.`;
      }

      return {
        description: weatherMessage,
        temperature: `${temp.toFixed(0)}°C`,
        isRaining: isRaining,
        isSnowing: isSnowing,
        isCold: isCold,
        isVeryCold: isVeryCold,
        isGoodForOutdoor: isGoodForOutdoor,
        temp: temp
      };
    }
    return defaultResult;
  } catch (e) {
    console.error("Error fetching weather: " + e);
    return defaultResult;
  }
}

/**
 * Get weather-based activity suggestion
 * @param {Object} sheet - Spreadsheet reference
 * @param {string} clientID - Client identifier
 * @param {string} timeOfDay - Time of day
 * @param {Object} weather - Weather data object
 */
function getActivitySuggestion_(sheet, clientID, timeOfDay, weather) {
  try {
    const goodOutdoor = !!(weather && weather.isGoodForOutdoor === true);
    const isRaining = !!(weather && weather.isRaining);
    const isSnowing = !!(weather && weather.isSnowing);
    const isCold = !!(weather && weather.isCold);

    console.log(`🌤️ Weather analysis: goodOutdoor=${goodOutdoor}, raining=${isRaining}, snowing=${isSnowing}, cold=${isCold}`);

    // Get base activity from Puuhaa system
    const puuhaaSuggestion = getPuuhaaEhdotus_(sheet, clientID, timeOfDay, weather);

    if (puuhaaSuggestion) {
      return puuhaaSuggestion;
    }

    // Fallback to weather-based suggestions
    if (timeOfDay === 'AAMU') {
      if (goodOutdoor) {
        return "🌅 Aamukävely raikkaassa ilmassa";
      } else if (isRaining) {
        return "🌧️ Rauhallinen aamiainen kotona";
      } else {
        return "🏠 Mukava aamiainen kotona";
      }
    } else if (timeOfDay === 'PAIVA') {
      if (goodOutdoor) {
        return "🌞 Ulkoilu puistossa tai kahvilassa";
      } else if (isRaining) {
        return "🌧️ Lukeminen tai lepo kotona";
      } else {
        return "🏠 Päivä lepäämällä kotona";
      }
    } else if (timeOfDay === 'ILTA') {
      if (goodOutdoor) {
        return "🌆 Iltakävely ennen pimeää";
      } else if (isRaining) {
        return "🌧️ Televisio tai kirja";
      } else {
        return "🏠 Rauhallinen ilta kotona";
      }
    } else if (timeOfDay === 'YO') {
      return "🌙 Hyvät unet odottavat";
    }

    return "😊 Mukava hetki rauhassa";

  } catch (error) {
    console.error("Error getting activity suggestion:", error.toString());
    return "😊 Rauhallinen hetki";
  }
}

/**
 * Get weather-based greeting
 */
function getWeatherBasedGreeting_(weather) {
  if (!weather) return "";

  if (weather.isRaining) {
    return "Sataa vettä, mutta sisällä on kuivaa ja turvallista! 🌧️";
  } else if (weather.isSnowing) {
    return "Lumi tekee maisemasta kauniin! ❄️";
  } else if (weather.isGoodForOutdoor) {
    return "Upea päivä ulkoiluun! ☀️";
  } else if (weather.isCold) {
    return "Viileä päivä, mutta sisällä on lämmin! 🏠";
  }

  return "";
}

/**
 * Get weather category for activity matching
 * @param {Object} weather - Weather data object
 */
function getSaaKategoria_(weather) {
  if (!weather) return "KAIKKI";

  if (weather.isRaining) return "SADE";
  if (weather.isSnowing) return "LUMISADE";
  if (weather.isGoodForOutdoor) return "AURINKO";

  // Check for specific weather descriptions
  const desc = String(weather.description || '').toLowerCase();

  for (const [category, patterns] of Object.entries(SAA_KATEGORIAT)) {
    for (const pattern of patterns) {
      if (desc.includes(pattern.toLowerCase())) {
        return category;
      }
    }
  }

  return "PILVIA"; // Default to cloudy
}

/**
 * Get default activity based on time of day and weather
 * @param {string} timeOfDay - Time of day
 * @param {Object} weather - Weather data object
 */
function getPuuhaaOletus_(timeOfDay, weather) {
  const saaKategoria = getSaaKategoria_(weather);

  // Default activities by time of day and weather
  const defaults = {
    AAMU: {
      AURINKO: "🌅 Aamukävely puistossa",
      PILVIA: "🏠 Rauhallinen aamiainen kotona",
      SADE: "🏠 Aamiainen kotona sadetta kuunnellen",
      LUMISADE: "🏠 Lämmin aamiainen ikkunan ääressä",
      KAIKKI: "🏠 Hyvä aamiainen aloitukseen"
    },
    PAIVA: {
      AURINKO: "🌞 Ulkoilu ja kahvi kahvilassa",
      PILVIA: "🏠 Lukeminen tai lepo kotona",
      SADE: "🏠 Kotityöt tai harrastus",
      LUMISADE: "🏠 Lämmin päivä sisällä",
      KAIKKI: "🏠 Rauhallinen päivä kotona"
    },
    ILTA: {
      AURINKO: "🌆 Iltakävely ennen pimeää",
      PILVIA: "🏠 Televisio tai kirja",
      SADE: "🏠 Rauhallinen ilta sisällä",
      LUMISADE: "🏠 Lämmin ilta kotona",
      KAIKKI: "🏠 Hyvä ilta levolle"
    },
    YO: {
      AURINKO: "🌙 Rauhalliset yöunet",
      PILVIA: "🌙 Hyvät unet",
      SADE: "🌙 Sadetta kuunnellen nukkumaan",
      LUMISADE: "🌙 Lumi peittää maailman valkoiseksi",
      KAIKKI: "🌙 Rauhallisia unia"
    }
  };

  return defaults[timeOfDay]?.[saaKategoria] || defaults[timeOfDay]?.KAIKKI || "😊 Rauhallinen hetki";
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getWeatherDataOptimized_,
    getWeatherData_,
    getActivitySuggestion_,
    getWeatherBasedGreeting_,
    getSaaKategoria_,
    getPuuhaaOletus_
  };
}
