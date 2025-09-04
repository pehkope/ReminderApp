/**
 * Azure Functions - Configuration API
 * Handles client configuration operations
 */

const { CosmosClient } = require('@azure/cosmos');
const { app } = require('@azure/functions');

// Cosmos DB configuration
const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT || '';
const COSMOS_KEY = process.env.COSMOS_KEY || '';
const DATABASE_ID = process.env.COSMOS_DATABASE || 'ReminderAppDB';
const CONFIG_CONTAINER_ID = process.env.COSMOS_CONTAINER || 'Configurations';

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
    source: 'google-drive',
    googleDrive: {
      folderId: '',
      rotation: 'daily'
    },
    azureStorage: {
      accountName: '',
      containerName: '',
      sasToken: ''
    }
  },
  telegram: {
    botToken: ''
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// Configuration API Function
app.http('ConfigAPI', {
  methods: ['GET', 'POST', 'PUT'],
  authLevel: 'anonymous',
  route: 'api/ConfigAPI',
  handler: async (request, context) => {
    try {
      context.log(`Processing config request for ${request.method} ${request.url}`);

      const clientID = request.query.get('clientID') || 'default';
      context.log(`Client ID: ${clientID}`);

      // Get Cosmos DB container
      const database = cosmosClient.database(DATABASE_ID);
      const container = database.container(CONFIG_CONTAINER_ID);

      // Handle different HTTP methods
      if (request.method === 'GET') {
        // Get configuration for client
        try {
          const { resource: config } = await container.item(clientID, clientID).read();

          return {
            status: 200,
            jsonBody: {
              success: true,
              clientID: clientID,
              config: config,
              timestamp: new Date().toISOString()
            }
          };
        } catch (error) {
          if (error.code === 404) {
            // Configuration doesn't exist, return default
            return {
              status: 200,
              jsonBody: {
                success: true,
                clientID: clientID,
                config: { ...DEFAULT_CONFIG, clientID: clientID },
                message: 'Using default configuration',
                timestamp: new Date().toISOString()
              }
            };
          }
          throw error;
        }

      } else if (request.method === 'POST') {
        // Create new configuration
        const requestBody = await request.json();
        context.log('Request body:', requestBody);

        const config = {
          id: clientID,
          clientID: clientID,
          ...DEFAULT_CONFIG,
          ...requestBody,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const { resource: createdConfig } = await container.items.create(config);

        return {
          status: 201,
          jsonBody: {
            success: true,
            message: 'Configuration created successfully',
            config: createdConfig,
            timestamp: new Date().toISOString()
          }
        };

      } else if (request.method === 'PUT') {
        // Update existing configuration
        const requestBody = await request.json();
        context.log('Request body:', requestBody);

        try {
          // First get existing config
          const { resource: existingConfig } = await container.item(clientID, clientID).read();

          // Merge with updates
          const updatedConfig = {
            ...existingConfig,
            ...requestBody,
            updatedAt: new Date().toISOString()
          };

          // Update in database
          const { resource: savedConfig } = await container.item(clientID, clientID).replace(updatedConfig);

          return {
            status: 200,
            jsonBody: {
              success: true,
              message: 'Configuration updated successfully',
              config: savedConfig,
              timestamp: new Date().toISOString()
            }
          };

        } catch (error) {
          if (error.code === 404) {
            // Config doesn't exist, create new one
            const config = {
              id: clientID,
              clientID: clientID,
              ...DEFAULT_CONFIG,
              ...requestBody,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            const { resource: createdConfig } = await container.items.create(config);

            return {
              status: 201,
              jsonBody: {
                success: true,
                message: 'Configuration created (was missing)',
                config: createdConfig,
                timestamp: new Date().toISOString()
              }
            };
          }
          throw error;
        }
      }

    } catch (error) {
      context.log.error('Error processing config request:', error);

      return {
        status: 500,
        jsonBody: {
          success: false,
          error: 'Internal server error',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
});
