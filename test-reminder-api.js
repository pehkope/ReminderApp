/**
 * Test Azure Function - Simple Reminder API
 * Without Cosmos DB for testing basic functionality
 */

const { app } = require('@azure/functions');

// Test Reminder API Function
app.http('TestReminderAPI', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'api/test-reminder',
  handler: async (request, context) => {
    try {
      context.log(`Test API called: ${request.method} ${request.url}`);

      const clientID = request.query.get('clientID') || 'default';

      if (request.method === 'GET') {
        // Return test data
        return {
          status: 200,
          jsonBody: {
            success: true,
            message: 'Test Reminder API works!',
            clientID: clientID,
            timestamp: new Date().toISOString(),
            testData: [
              {
                id: 'test-1',
                title: 'Test Reminder',
                message: 'This is a test reminder',
                time: '12:00',
                active: true
              }
            ]
          }
        };
      }

      if (request.method === 'POST') {
        const requestBody = await request.json();
        context.log('Received data:', requestBody);

        return {
          status: 201,
          jsonBody: {
            success: true,
            message: 'Test reminder created!',
            data: requestBody,
            timestamp: new Date().toISOString()
          }
        };
      }

    } catch (error) {
      context.log.error('Test API error:', error);

      return {
        status: 500,
        jsonBody: {
          success: false,
          error: 'Test API failed',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
});
