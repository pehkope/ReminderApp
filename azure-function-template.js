/**
 * Azure Function Template for ReminderApp
 * Based on the GAS version with timeout protection
 */

const { app } = require('@azure/functions');

// Weather API configuration
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5/weather';

// Timeout settings
const API_TIMEOUT_MS = 5000;
const GAS_EXECUTION_TIMEOUT_MS = 25000;

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '3600'
};

// Utility functions
function createCorsResponse(data, status = 200) {
  return {
    status: status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
}

function validateApiKey(apiKey) {
  console.log('🔐 API key validation: ✅ BYPASSED (Azure Functions)');
  return true;
}

// Weather functions
async function getWeatherData(weatherApiKey) {
  const weatherUrl = `${WEATHER_API_BASE}?q=Helsinki&units=metric&lang=fi&appid=${weatherApiKey}`;

  try {
    const response = await fetch(weatherUrl, {
      signal: AbortSignal.timeout(API_TIMEOUT_MS)
    });

    if (!response.ok) {
      return { description: 'Säätietoja ei saatu.', temperature: 'N/A', isRaining: false };
    }

    const weatherData = await response.json();
    const temp = weatherData.main.temp;
    const description = weatherData.weather[0].description.toLowerCase();

    const isRaining = description.includes('sade') || description.includes('rain');
    const isCold = temp < 5;
    const isGoodForOutdoor = !isRaining && temp >= 5;

    let weatherMessage;
    if (isRaining) {
      weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Sisäpuolella on mukavampaa! 🌧️`;
    } else if (isGoodForOutdoor) {
      weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Loistava päivä ulkoiluun! ☀️`;
    } else if (isCold) {
      weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Pukeudu lämpimästi! 🧥`;
    } else {
      weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C.`;
    }

    return {
      description: weatherMessage,
      temperature: `${temp.toFixed(0)}°C`,
      isRaining: isRaining,
      isCold: isCold,
      isGoodForOutdoor: isGoodForOutdoor,
      temp: temp
    };

  } catch (error) {
    console.error('Weather API error:', error.message);
    return { description: 'Säätietoja ei saatu (timeout).', temperature: 'N/A', isRaining: false };
  }
}

// Photo validation (simplified for Azure)
function getDailyPhoto(clientID) {
  // Simplified version - in production, connect to Azure Storage or external API
  return {
    url: '',
    caption: 'Päivän kuva - Azure versio tulossa'
  };
}

// Main HTTP trigger function
app.http('ReminderAPI', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    const startTime = Date.now();

    try {
      context.log(`HTTP ${request.method} request received`);

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return createCorsResponse({ message: 'CORS preflight successful' });
      }

      // Parse request data
      let postData = {};
      if (request.method === 'POST') {
        try {
          const body = await request.text();
          postData = JSON.parse(body);
        } catch (error) {
          return createCorsResponse({ error: 'Invalid JSON body' }, 400);
        }
      }

      // API Key validation (bypassed in Azure)
      const apiKey = postData.apiKey || request.query.get('apiKey');
      if (!validateApiKey(apiKey)) {
        return createCorsResponse({ error: 'Unauthorized' }, 401);
      }

      // Handle acknowledgment
      if (postData.action === 'acknowledgeTask') {
        const executionTime = Date.now() - startTime;
        context.log(`Acknowledgment processed in ${executionTime}ms`);

        return createCorsResponse({
          status: 'OK',
          message: 'Acknowledgment recorded',
          clientID: postData.clientID || 'mom',
          taskType: postData.taskType || '',
          timeOfDay: postData.timeOfDay || '',
          executionTime: executionTime
        });
      }

      // Handle data fetch
      const params = request.query;
      const clientID = params.get('clientID') || 'mom';

      // Get weather data
      let weather = null;
      if (WEATHER_API_KEY) {
        weather = await getWeatherData(WEATHER_API_KEY);
        context.log(`Weather fetched: ${weather.temperature}`);
      }

      // Get daily photo
      const dailyPhoto = getDailyPhoto(clientID);

      const executionTime = Date.now() - startTime;
      context.log(`Request processed in ${executionTime}ms`);

      return createCorsResponse({
        status: 'OK',
        clientID: clientID,
        tasks: [],
        weather: weather,
        dailyPhoto: dailyPhoto,
        message: 'Azure Function response',
        executionTime: executionTime
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;
      context.error(`Critical error after ${executionTime}ms:`, error.message);

      return createCorsResponse({
        error: 'Server error: ' + error.message,
        status: 'ERROR',
        executionTime: executionTime
      }, 500);
    }
  }
});

module.exports = app;
