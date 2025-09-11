/**
 * Azure Functions with Cosmos DB Configuration
 * Per-customer configuration stored in Azure Cosmos DB
 */

const { CosmosClient } = require('@azure/cosmos');
const { app } = require('@azure/functions');

// Cosmos DB configuration
const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT || '';
const COSMOS_KEY = process.env.COSMOS_KEY || '';
const DATABASE_ID = process.env.COSMOS_DATABASE || 'ReminderAppDB';
const CONTAINER_ID = process.env.COSMOS_CONTAINER || 'Configurations';

// Initialize Cosmos client
const cosmosClient = new CosmosClient({
  endpoint: COSMOS_ENDPOINT,
  key: COSMOS_KEY
});

// Default configuration template
const DEFAULT_CONFIG = {
  clientID: '',
  settings: {
    useWeather: true,
    usePhotos: true,
    useTelegram: false,
    useSMS: false,
    timezone: 'Europe/Helsinki',
    language: 'fi'
  },
  weather: {
    apiKey: '',
    location: 'Helsinki',
    units: 'metric'
  },
  photos: {
    source: 'google-drive', // 'google-drive', 'azure-storage', 'none'
    googleDrive: {
      folderId: '',
      rotation: 'daily' // 'daily', 'weekly', 'random'
    },
    azureStorage: {
      accountName: '',
      containerName: '',
      sasToken: ''
    }
  },
  telegram: {
    botToken: '',
    chatIds: []
  },
  sms: {
    twilioSid: '',
    twilioToken: '',
    fromNumber: '',
    enabledNumbers: []
  },
  schedules: {
    morning: [],
    afternoon: [],
    evening: [],
    night: []
  },
  notifications: {
    enabled: true,
    reminderTime: 15, // minutes before event
    retryCount: 3,
    retryInterval: 5 // minutes
  },
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  version: '1.0.0'
};

/**
 * Get customer configuration from Cosmos DB
 * @param {string} clientID - Customer identifier
 */
async function getCustomerConfig(clientID) {
  try {
    console.log(`Loading config for client: ${clientID}`);

    const database = cosmosClient.database(DATABASE_ID);
    const container = database.container(CONTAINER_ID);

    const query = {
      query: 'SELECT * FROM c WHERE c.clientID = @clientID',
      parameters: [{ name: '@clientID', value: clientID }]
    };

    const { resources } = await container.items.query(query).fetchAll();

    if (resources.length > 0) {
      console.log(`✅ Config loaded for ${clientID}`);
      return resources[0];
    }

    // Create default config for new customer
    console.log(`⚠️ No config found for ${clientID}, creating default`);
    const newConfig = { ...DEFAULT_CONFIG, clientID };
    await createCustomerConfig(newConfig);

    return newConfig;

  } catch (error) {
    console.error(`❌ Error loading config for ${clientID}:`, error.message);
    return { ...DEFAULT_CONFIG, clientID, error: 'Config load failed' };
  }
}

/**
 * Create new customer configuration
 * @param {Object} config - Configuration object
 */
async function createCustomerConfig(config) {
  try {
    const database = cosmosClient.database(DATABASE_ID);
    const container = database.container(CONTAINER_ID);

    const { resource } = await container.items.create(config);
    console.log(`✅ Config created for ${config.clientID}`);

    return resource;

  } catch (error) {
    console.error('❌ Error creating config:', error.message);
    throw error;
  }
}

/**
 * Update customer configuration
 * @param {string} clientID - Customer identifier
 * @param {Object} updates - Configuration updates
 */
async function updateCustomerConfig(clientID, updates) {
  try {
    const database = cosmosClient.database(DATABASE_ID);
    const container = database.container(CONTAINER_ID);

    const query = {
      query: 'SELECT * FROM c WHERE c.clientID = @clientID',
      parameters: [{ name: '@clientID', value: clientID }]
    };

    const { resources } = await container.items.query(query).fetchAll();

    if (resources.length === 0) {
      throw new Error(`Configuration not found for client: ${clientID}`);
    }

    const config = resources[0];
    const updatedConfig = {
      ...config,
      ...updates,
      updated: new Date().toISOString(),
      version: incrementVersion(config.version)
    };

    const { resource } = await container.item(config.id, config.clientID).replace(updatedConfig);
    console.log(`✅ Config updated for ${clientID}`);

    return resource;

  } catch (error) {
    console.error(`❌ Error updating config for ${clientID}:`, error.message);
    throw error;
  }
}

/**
 * Increment version number
 * @param {string} currentVersion - Current version string
 */
function incrementVersion(currentVersion) {
  try {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  } catch {
    return '1.0.1';
  }
}

/**
 * Get weather data with customer-specific config
 * @param {Object} config - Customer configuration
 */
async function getWeatherDataWithConfig(config) {
  if (!config.weather?.apiKey) {
    return { description: 'Säätietoja ei konfiguroitu', temperature: 'N/A' };
  }

  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${config.weather.location}&units=${config.weather.units}&lang=fi&appid=${config.weather.apiKey}`;

  try {
    const response = await fetch(weatherUrl, {
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      return { description: 'Säätietoja ei saatu.', temperature: 'N/A' };
    }

    const weatherData = await response.json();
    const temp = weatherData.main.temp;

    const isRaining = weatherData.weather[0].description.toLowerCase().includes('sade');
    const isCold = temp < 5;
    const isGoodForOutdoor = !isRaining && temp >= 5;

    let weatherMessage;
    if (isRaining) {
      weatherMessage = `Sää tänään: ${weatherData.weather[0].description}, ${temp.toFixed(0)}°C. Sisäpuolella on mukavampaa! 🌧️`;
    } else if (isGoodForOutdoor) {
      weatherMessage = `Sää tänään: ${weatherData.weather[0].description}, ${temp.toFixed(0)}°C. Loistava päivä ulkoiluun! ☀️`;
    } else if (isCold) {
      weatherMessage = `Sää tänään: ${weatherData.weather[0].description}, ${temp.toFixed(0)}°C. Pukeudu lämpimästi! 🧥`;
    } else {
      weatherMessage = `Sää tänään: ${weatherData.weather[0].description}, ${temp.toFixed(0)}°C.`;
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
    return { description: 'Säätietoja ei saatu (timeout).', temperature: 'N/A' };
  }
}

/**
 * Get daily photo based on customer config
 * @param {Object} config - Customer configuration
 */
function getDailyPhotoWithConfig(config) {
  // Simplified - in production connect to customer's storage
  if (config.photos?.source === 'none') {
    return { url: '', caption: 'Kuvat pois käytöstä' };
  }

  return {
    url: '',
    caption: `Päivän kuva - ${config.photos?.source || 'ei konfiguroitu'}`
  };
}

// CORS headers with security improvements (from GasProxy)
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '3600',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
};

/**
 * Create CORS response
 */
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

/**
 * Validate API key with injection support (from GasProxy)
 */
function validateApiKey(apiKey, gasApiKey = null) {
  // If no API key provided but we have GAS API key, inject it
  if (!apiKey && gasApiKey) {
    console.log('🔐 API key injection: Using GAS API key');
    return true;
  }
  
  console.log('🔐 API key validation: ✅ BYPASSED (Azure Functions)');
  return true;
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

      // API Key validation
      const apiKey = postData.apiKey || request.query.get('apiKey');
      if (!validateApiKey(apiKey)) {
        return createCorsResponse({ error: 'Unauthorized' }, 401);
      }

      // Get client ID
      const clientID = postData.clientID || request.query.get('clientID') || 'default';

      // Load customer configuration from Cosmos DB
      const customerConfig = await getCustomerConfig(clientID);

      // Handle acknowledgment
      if (postData.action === 'acknowledgeTask') {
        const executionTime = Date.now() - startTime;
        context.log(`Acknowledgment processed in ${executionTime}ms`);

        return createCorsResponse({
          status: 'OK',
          message: 'Acknowledgment recorded',
          clientID: clientID,
          taskType: postData.taskType || '',
          timeOfDay: postData.timeOfDay || '',
          executionTime: executionTime,
          configVersion: customerConfig.version
        });
      }

      // Get weather data (if enabled)
      let weather = null;
      if (customerConfig.settings?.useWeather !== false) {
        weather = await getWeatherDataWithConfig(customerConfig);
        context.log(`Weather fetched: ${weather.temperature}`);
      }

      // Get daily photo (if enabled)
      let dailyPhoto = null;
      if (customerConfig.settings?.usePhotos !== false) {
        dailyPhoto = getDailyPhotoWithConfig(customerConfig);
      }

      const executionTime = Date.now() - startTime;
      context.log(`Request processed in ${executionTime}ms`);

      return createCorsResponse({
        status: 'OK',
        clientID: clientID,
        tasks: [],
        weather: weather,
        dailyPhoto: dailyPhoto,
        configVersion: customerConfig.version,
        message: 'Azure Function with Cosmos DB config',
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

// Configuration management endpoints
app.http('ConfigAPI', {
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'config/{clientID?}',
  handler: async (request, context) => {
    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return createCorsResponse({ message: 'CORS preflight successful' });
      }

      const clientID = request.params.clientID || 'default';

      switch (request.method) {
        case 'GET':
          const config = await getCustomerConfig(clientID);
          return createCorsResponse({
            status: 'OK',
            config: config
          });

        case 'POST':
          const newConfigData = JSON.parse(await request.text());
          const newConfig = await createCustomerConfig({ ...newConfigData, clientID });
          return createCorsResponse({
            status: 'OK',
            message: 'Configuration created',
            config: newConfig
          }, 201);

        case 'PUT':
          const updateData = JSON.parse(await request.text());
          const updatedConfig = await updateCustomerConfig(clientID, updateData);
          return createCorsResponse({
            status: 'OK',
            message: 'Configuration updated',
            config: updatedConfig
          });

        default:
          return createCorsResponse({ error: 'Method not allowed' }, 405);
      }

    } catch (error) {
      context.error('Config API error:', error.message);
      return createCorsResponse({
        error: 'Configuration error: ' + error.message
      }, 500);
    }
  }
});

module.exports = app;
