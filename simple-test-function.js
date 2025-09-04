/**
 * Simple Test Function - For testing deployment
 */

const { app } = require('@azure/functions');

app.http('SimpleTest', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'api/test',
  handler: async (request, context) => {
    context.log(`Simple test request: ${request.method} ${request.url}`);

    return {
      status: 200,
      jsonBody: {
        success: true,
        message: 'Simple test function works!',
        timestamp: new Date().toISOString(),
        function: 'SimpleTest'
      }
    };
  }
});
