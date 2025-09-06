/**
 * Azure Functions - Reminder API
 * Handles reminder operations
 */

const { CosmosClient } = require('@azure/cosmos');
const { app } = require('@azure/functions');

// Cosmos DB configuration
const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT || '';
const COSMOS_KEY = process.env.COSMOS_KEY || '';
const DATABASE_ID = process.env.COSMOS_DATABASE || 'ReminderAppDB';
const CONTAINER_ID = process.env.COSMOS_CONTAINER || 'Reminders';

// Initialize Cosmos client
const cosmosClient = new CosmosClient({
  endpoint: COSMOS_ENDPOINT,
  key: COSMOS_KEY
});

// Default configuration template 
const DEFAULT_CONFIG = {
  useWeather: true,
  usePhotos: true,
  useTelegram: false,
  useSMS: false,
  timezone: 'Europe/Helsinki',
  language: 'fi'
};

// Reminder API Function
app.http('ReminderAPI', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'api/ReminderAPI',
  handler: async (request, context) => {
    try {
      context.log(`Processing request for ${request.method} ${request.url}`);

      const clientID = request.query.get('clientID') || 'default';
      context.log(`Client ID: ${clientID}`);

      // Get Cosmos DB container
      const database = cosmosClient.database(DATABASE_ID);
      const container = database.container(CONTAINER_ID);

      // Handle different HTTP methods
      if (request.method === 'GET') {
        // Get reminders for client
        const querySpec = {
          query: "SELECT * FROM c WHERE c.clientID = @clientID",
          parameters: [
            {
              name: "@clientID",
              value: clientID
            }
          ]
        };

        const { resources: reminders } = await container.items.query(querySpec).fetchAll();

        return {
          status: 200,
          jsonBody: {
            success: true,
            clientID: clientID,
            reminders: reminders,
            count: reminders.length,
            timestamp: new Date().toISOString()
          }
        };

      } else if (request.method === 'POST') {
        // Create new reminder
        const requestBody = await request.json();
        context.log('Request body:', requestBody);

        const reminder = {
          id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          clientID: clientID,
          ...requestBody,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const { resource: createdReminder } = await container.items.create(reminder);

        return {
          status: 201,
          jsonBody: {
            success: true,
            message: 'Reminder created successfully',
            reminder: createdReminder,
            timestamp: new Date().toISOString()
          }
        };
      }

    } catch (error) {
      context.log.error('Error processing reminder request:', error);

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
