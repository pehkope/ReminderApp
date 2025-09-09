const { CosmosClient } = require('@azure/cosmos');
const { google } = require('googleapis');

// Cosmos DB configuration
const COSMOS_ENDPOINT = process.env.COSMOS_ENDPOINT || '';
const COSMOS_KEY = process.env.COSMOS_KEY || '';
const DATABASE_ID = process.env.COSMOS_DATABASE || 'ReminderAppDB';
const CONTAINER_ID = process.env.COSMOS_CONTAINER || 'Reminders';

// Google Sheets configuration
const SHEETS_ID = '14i3QPYquqSqyE7fTp_pa2LNBq2Jb_re2rwsuUpRRSHo';
const PHOTOS_SHEET_NAME = 'Kuvat';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

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

// Get daily photo from Google Sheets
async function getDailyPhoto(clientID, context) {
  try {
    if (!GOOGLE_API_KEY) {
      context.log('No Google API key configured');
      return { url: '', caption: '' };
    }

    const sheets = google.sheets({ version: 'v4', auth: GOOGLE_API_KEY });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEETS_ID,
      range: `${PHOTOS_SHEET_NAME}!A:C`, // ClientID, URL, Caption columns
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) {
      context.log('No photo data found in sheets');
      return { url: '', caption: '' };
    }

    // Find photos for this client (skip header row)
    const clientPhotos = rows.slice(1).filter(row => 
      row[0] && row[0].toLowerCase() === clientID.toLowerCase()
    );

    if (clientPhotos.length === 0) {
      context.log(`No photos found for client: ${clientID}`);
      return { url: '', caption: '' };
    }

    // Select a random photo or use date-based selection
    const today = new Date();
    const photoIndex = today.getDate() % clientPhotos.length;
    const selectedPhoto = clientPhotos[photoIndex];

    const url = selectedPhoto[1] || '';
    const caption = selectedPhoto[2] || '';

    context.log(`Selected photo for ${clientID}: ${caption}`);
    return { url, caption };

  } catch (error) {
    context.log.error('Error fetching photo from Google Sheets:', error);
    return { url: '', caption: '' };
  }
}

module.exports = async function (context, req) {
    try {
        context.log(`Processing ${req.method} request to ReminderAPI`);
        context.log('PWA integration test - photo fields should be included!');

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

            // Get daily photo from Google Sheets
            context.log('Fetching photo from Google Sheets...');
            const photoData = await getDailyPhoto(clientID, context);
            const dailyPhotoUrl = photoData.url;
            const dailyPhotoCaption = photoData.caption;
            
            context.res = {
                status: 200,
                body: {
                    // Legacy fields for PWA compatibility
                    clientID: clientID,
                    timestamp: new Date().toISOString(),
                    status: 'OK',
                    settings: {
                        useWeather: true,
                        usePhotos: true,
                        useTelegram: false,
                        useSMS: false
                    },
                    importantMessage: '',
                    upcomingAppointments: [],
                    dailyPhotoUrl: dailyPhotoUrl,
                    dailyPhotoCaption: dailyPhotoCaption,
                    weeklyPhotos: [],
                    profilePhoto: null,
                    exerciseVideoUrl: '',
                    weather: {
                        description: 'Pilvistä',
                        temperature: '12°C'
                    },
                    contacts: [],
                    latestReminder: '',
                    dailyTasks: [],
                    currentTimeOfDay: 'päivä',
                    weeklyPlan: {},
                    greeting: '',
                    activityText: '',
                    activityTags: [],
                    
                    // New API fields
                    success: true,
                    reminders: reminders,
                    count: reminders.length,
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
