const { CosmosClient } = require('@azure/cosmos');

// Cosmos DB configuration
const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT || '';
const COSMOS_KEY = process.env.COSMOS_KEY || '';
const DATABASE_ID = process.env.COSMOS_DATABASE || 'ReminderAppDB';
const CONTAINER_ID = process.env.COSMOS_CONTAINER || 'Reminders';

// Lazy Cosmos client
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

module.exports = async function (context, req) {
    try {
        context.log(`Processing ${req.method} request to ReminderAPI`);
        context.log('Traditional function.json approach test!');

        const clientID = req.query.clientID || 'default';
        context.log(`Client ID: ${clientID}`);

        // Get Cosmos DB container (if configured)
        const client = ensureCosmosClient();
        const database = client ? client.database(DATABASE_ID) : null;
        const container = database ? database.container(CONTAINER_ID) : null;

        if (req.method === 'GET') {
            // Get reminders for client
            let reminders = [];
            if (container) {
                const querySpec = {
                    query: "SELECT * FROM c WHERE c.clientID = @clientID",
                    parameters: [{ name: "@clientID", value: clientID }]
                };
                const result = await container.items.query(querySpec).fetchAll();
                reminders = result.resources || [];
            }

            // Get daily photo from Google Sheets (temporary - will move to proper API)
            let dailyPhotoUrl = '';
            let dailyPhotoCaption = '';
            
            // TODO: Add Google Sheets API integration for photos
            // For now, return empty photo data so PWA uses fallback
            
            context.res = {
                status: 200,
                body: {
                    success: true,
                    clientID: clientID,
                    reminders: reminders,
                    count: reminders.length,
                    dailyPhotoUrl: dailyPhotoUrl,
                    dailyPhotoCaption: dailyPhotoCaption,
                    timestamp: new Date().toISOString(),
                    storage: container ? 'cosmos' : 'in-memory'
                }
            };

        } else if (req.method === 'POST') {
            // Create new reminder
            const reminder = {
                id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                clientID: clientID,
                ...req.body,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (!container) {
                context.res = {
                    status: 501,
                    body: {
                        success: false,
                        message: 'Cosmos DB not configured',
                        timestamp: new Date().toISOString()
                    }
                };
                return;
            }

            const { resource: createdReminder } = await container.items.create(reminder);
            context.res = {
                status: 201,
                body: {
                    success: true,
                    message: 'Reminder created successfully',
                    reminder: createdReminder,
                    timestamp: new Date().toISOString()
                }
            };
        }

    } catch (error) {
        context.log.error('Error processing reminder request:', error);
        context.res = {
            status: 500,
            body: {
                success: false,
                error: 'Internal server error',
                message: error.message,
                timestamp: new Date().toISOString()
            }
        };
    }
};
