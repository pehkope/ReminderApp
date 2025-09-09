const { CosmosClient } = require('@azure/cosmos');
const { google } = require('googleapis');

// Cosmos DB configuration  
const COSMOS_CONNECTION_STRING = process.env.COSMOS_CONNECTION_STRING || '';
const DATABASE_ID = process.env.COSMOS_DATABASE || 'ReminderAppDB';

// Google Sheets configuration
const SHEETS_ID = '14i3QPYquqSqyE7fTp_pa2LNBq2Jb_re2rwsuUpRRSHo';
const PHOTOS_SHEET_NAME = 'Kuvat';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || '';

// Lazy Cosmos client
let cosmosClient = null;
function ensureCosmosClient() {
  if (cosmosClient) return cosmosClient;
  if (!COSMOS_CONNECTION_STRING) return null;
  try {
    cosmosClient = new CosmosClient(COSMOS_CONNECTION_STRING);
    return cosmosClient;
  } catch (e) {
    return null;
  }
}

// Get Cosmos containers
function getContainers(database) {
  return {
    clients: database.container('Clients'),
    appointments: database.container('Appointments'), 
    foods: database.container('Foods'),
    medications: database.container('Medications'),
    photos: database.container('Photos'),
    messages: database.container('Messages'),
    completions: database.container('Completions')
  };
}

// Helper functions
function getCurrentTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 6) return 'yö';
  if (hour < 12) return 'aamu';
  if (hour < 18) return 'päivä';
  return 'ilta';
}

function getGreeting(clientID) {
  const timeOfDay = getCurrentTimeOfDay();
  const greetings = {
    'mom': {
      'aamu': 'Hyvää huomenta kultaseni! ☀️',
      'päivä': 'Hyvää päivää rakas! 🌼', 
      'ilta': 'Hyvää iltaa kulta! 🌙',
      'yö': 'Hyvää yötä rakas! 💤'
    }
  };
  
  return greetings[clientID]?.[timeOfDay] || `Hyvää ${timeOfDay}a!`;
}

// Get daily photo - try Cosmos DB first, fallback to Google Sheets
async function getDailyPhoto(clientID, context) {
  try {
    // Try Cosmos DB first
    const client = ensureCosmosClient();
    if (client) {
      const database = client.database(DATABASE_ID);
      const containers = getContainers(database);
      
      try {
        const querySpec = {
          query: "SELECT * FROM c WHERE c.clientId = @clientId AND c.isActive = true",
          parameters: [{ name: "@clientId", value: clientID }]
        };
        
        const { resources: photos } = await containers.photos.items.query(querySpec).fetchAll();
        
        if (photos && photos.length > 0) {
          // Select photo based on date
          const today = new Date();
          const photoIndex = today.getDate() % photos.length;
          const selectedPhoto = photos[photoIndex];
          
          context.log(`Selected photo from Cosmos DB for ${clientID}: ${selectedPhoto.caption}`);
          return { 
            url: selectedPhoto.url || '', 
            caption: selectedPhoto.caption || '' 
          };
        }
      } catch (cosmosError) {
        context.log.warn('Cosmos DB photo query failed, trying Google Sheets fallback:', cosmosError.message);
      }
    }

    // Fallback to Google Sheets
    if (!GOOGLE_API_KEY) {
      context.log('No Google API key configured and no Cosmos photos');
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

    context.log(`Selected photo from Google Sheets for ${clientID}: ${caption}`);
    return { url, caption };

  } catch (error) {
    context.log.error('Error fetching photo:', error);
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
                // Get data from Cosmos DB (if available)
                let reminders = [];
                let upcomingAppointments = [];
                let todaysFoods = [];
                let todaysMedications = [];
                let storageType = 'in-memory';

                const client = ensureCosmosClient();
                if (client) {
                    const database = client.database(DATABASE_ID);
                    const containers = getContainers(database);
                    storageType = 'cosmos';
                    
                    try {
                        // Get reminders (legacy support)
                        const reminderQuery = {
                            query: "SELECT * FROM c WHERE c.clientId = @clientId AND c.type = 'reminder'",
                            parameters: [{ name: "@clientId", value: clientID }]
                        };
                        const reminderResult = await containers.clients.items.query(reminderQuery).fetchAll();
                        reminders = reminderResult.resources || [];

                        // Get upcoming appointments (next 7 days)
                        const nextWeek = new Date();
                        nextWeek.setDate(nextWeek.getDate() + 7);
                        const appointmentQuery = {
                            query: "SELECT * FROM c WHERE c.clientId = @clientId AND c.date >= @today AND c.date <= @nextWeek ORDER BY c.date, c.time",
                            parameters: [
                                { name: "@clientId", value: clientID },
                                { name: "@today", value: new Date().toISOString().split('T')[0] },
                                { name: "@nextWeek", value: nextWeek.toISOString().split('T')[0] }
                            ]
                        };
                        const appointmentResult = await containers.appointments.items.query(appointmentQuery).fetchAll();
                        upcomingAppointments = appointmentResult.resources || [];

                        // Get today's foods
                        const today = new Date().toISOString().split('T')[0];
                        const foodQuery = {
                            query: "SELECT * FROM c WHERE c.clientId = @clientId AND c.date = @today ORDER BY c.timeSlot",
                            parameters: [
                                { name: "@clientId", value: clientID },
                                { name: "@today", value: today }
                            ]
                        };
                        const foodResult = await containers.foods.items.query(foodQuery).fetchAll();
                        todaysFoods = foodResult.resources || [];

                        // Get today's medications  
                        const medicationQuery = {
                            query: "SELECT * FROM c WHERE c.clientId = @clientId AND (c.date = @today OR c.recurring = true) ORDER BY c.time",
                            parameters: [
                                { name: "@clientId", value: clientID },
                                { name: "@today", value: today }
                            ]
                        };
                        const medicationResult = await containers.medications.items.query(medicationQuery).fetchAll();
                        todaysMedications = medicationResult.resources || [];

                    } catch (cosmosError) {
                        context.log.error('Cosmos DB query error:', cosmosError);
                        storageType = 'cosmos-error';
                    }
                }

                // Get daily photo
                context.log('Fetching photo...');
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
                        importantMessage: upcomingAppointments.length > 0 ? 
                            `Muista: ${upcomingAppointments[0].title} ${upcomingAppointments[0].date} klo ${upcomingAppointments[0].time}` : '',
                        upcomingAppointments: upcomingAppointments,
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
                        latestReminder: reminders.length > 0 ? reminders[0].text || '' : '',
                        dailyTasks: [
                            ...todaysFoods.map(food => ({
                                id: food.id,
                                type: 'food',
                                time: food.timeSlot,
                                text: food.suggestions ? food.suggestions.join(', ') : 'Ruokailu',
                                completed: food.completed || false,
                                encouragingMessage: food.encouragingMessage || ''
                            })),
                            ...todaysMedications.map(med => ({
                                id: med.id,
                                type: 'medication',
                                time: med.time,
                                text: `💊 ${med.name} - ${med.dosage}`,
                                completed: med.completed || false,
                                instructions: med.instructions || ''
                            }))
                        ].sort((a, b) => a.time.localeCompare(b.time)),
                        currentTimeOfDay: getCurrentTimeOfDay(),
                        weeklyPlan: {},
                        greeting: getGreeting(clientID),
                        activityText: '',
                        activityTags: [],
                        
                        // New API fields
                        success: true,
                        reminders: reminders,
                        count: reminders.length,
                        storage: storageType,
                        
                        // Extended data
                        foods: todaysFoods,
                        medications: todaysMedications,
                        appointments: upcomingAppointments
                    }
                };

        } else if (req.method === 'POST') {
            const client = ensureCosmosClient();
            if (!client) {
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

            const database = client.database(DATABASE_ID);
            const containers = getContainers(database);
            const action = req.body.action || 'create_reminder';

            try {
                switch (action) {
                    case 'complete_food':
                        const foodCompletion = {
                            id: `comp_${clientID}_${Date.now()}_food`,
                            type: 'completion',
                            clientId: clientID,
                            itemType: 'food',
                            itemId: req.body.itemId,
                            completedAt: new Date().toISOString(),
                            date: new Date().toISOString().split('T')[0],
                            notes: req.body.notes || ''
                        };
                        
                        await containers.completions.items.create(foodCompletion);

                        context.res = {
                            status: 200,
                            body: {
                                success: true,
                                message: 'Ruoka kuitattu onnistuneesti! 🍽️',
                                completion: foodCompletion,
                                timestamp: new Date().toISOString()
                            }
                        };
                        break;

                    case 'complete_medication':
                        const medCompletion = {
                            id: `comp_${clientID}_${Date.now()}_med`,
                            type: 'completion',
                            clientId: clientID,
                            itemType: 'medication',
                            itemId: req.body.itemId,
                            completedAt: new Date().toISOString(),
                            date: new Date().toISOString().split('T')[0],
                            notes: req.body.notes || ''
                        };
                        
                        await containers.completions.items.create(medCompletion);

                        context.res = {
                            status: 200,
                            body: {
                                success: true,
                                message: 'Lääke otettu! 💊✅',
                                completion: medCompletion,
                                timestamp: new Date().toISOString()
                            }
                        };
                        break;

                    default: // create_reminder (legacy)
                        const reminder = {
                            id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            clientId: clientID,
                            type: 'reminder',
                            ...req.body,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };
                        
                        const { resource: createdReminder } = await containers.clients.items.create(reminder);
                        context.res = {
                            status: 201,
                            body: {
                                success: true,
                                message: 'Reminder created successfully',
                                reminder: createdReminder,
                                timestamp: new Date().toISOString()
                            }
                        };
                        break;
                }
            } catch (error) {
                context.log.error('POST operation failed:', error);
                context.res = {
                    status: 500,
                    body: {
                        success: false,
                        error: 'Database operation failed',
                        message: error.message,
                        timestamp: new Date().toISOString()
                    }
                };
            }
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
