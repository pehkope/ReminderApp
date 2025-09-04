/**
 * Test Azure Function - Simple Config API
 * Without Cosmos DB for testing basic functionality
 */

const { app } = require('@azure/functions');

// Test Config API Function
app.http('TestConfigAPI', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'api/test-config',
  handler: async (request, context) => {
    try {
      context.log(`Test Config API called: ${request.method} ${request.url}`);

      const clientID = request.query.get('clientID') || 'default';

      return {
        status: 200,
        jsonBody: {
          success: true,
          message: 'Test Config API works!',
          clientID: clientID,
          config: {
            useWeather: true,
            usePhotos: false,
            timezone: 'Europe/Helsinki',
            language: 'fi'
          },
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      context.log.error('Test Config API error:', error);

      return {
        status: 500,
        jsonBody: {
          success: false,
          error: 'Test Config API failed',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
});
