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

// Lazy Cosmos client to avoid startup failures when settings missing
let cosmosClient = null;
function ensureCosmosClient() {
  if (cosmosClient) return cosmosClient;
  if (!COSMOS_ENDPOINT || !COSMOS_KEY) return null;
  try {
    cosmosClient = new CosmosClient({ endpoint: COSMOS_ENDPOINT, key: COSMOS_KEY });
    return cosmosClient;
  } catch (e) {
    return null;
  }
}

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
  route: 'ReminderAPI',
  handler: async (request, context) => {
    try {
      context.log(`Processing request for ${request.method} ${request.url}`);
      context.log('Deployment Center test - API working!');

      const clientID = request.query.get('clientID') || 'default';
      context.log(`Client ID: ${clientID}`);

      // Get Cosmos DB container (if configured)
      const client = ensureCosmosClient();
      const database = client ? client.database(DATABASE_ID) : null;
      const container = database ? database.container(CONTAINER_ID) : null;

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

        let reminders = [];
        if (container) {
          const result = await container.items.query(querySpec).fetchAll();
          reminders = result.resources || [];
        }
        return {
          status: 200,
          jsonBody: {
            success: true,
            clientID: clientID,
            reminders: reminders,
            count: reminders.length,
            timestamp: new Date().toISOString(),
            storage: container ? 'cosmos' : 'in-memory'
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

        if (!container) {
          return {
            status: 501,
            jsonBody: {
              success: false,
              message: 'Cosmos DB not configured',
              timestamp: new Date().toISOString()
            }
          };
        }
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
