/**
 * Azure Functions - Enhanced Twilio Integration
 * Extracted from GasProxyFunctions and enhanced for reminderapp-functions
 * Handles Twilio token generation and TwiML responses with Finnish language support
 */

const { app } = require('@azure/functions');
const twilio = require('twilio');

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID || '';
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET || '';
const TWILIO_TWIML_APP_SID = process.env.TWILIO_TWIML_APP_SID || '';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';

// Enhanced CORS headers (from GasProxy)
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '3600',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY'
};

/**
 * Create CORS response with security headers
 */
function createCorsResponse(data, status = 200, contentType = 'application/json') {
  return {
    status: status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': contentType
    },
    body: contentType === 'application/json' ? JSON.stringify(data) : data
  };
}

// Twilio Token Function
app.http('TwilioToken', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'api/twilio/token',
  handler: async (request, context) => {
    try {
      context.log(`Twilio token request: ${request.method} ${request.url}`);

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return createCorsResponse({ message: 'CORS preflight successful' });
      }

      // Check if Twilio credentials are configured
      if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
        return createCorsResponse({
          success: false,
          error: 'Twilio credentials not configured',
          message: 'TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, and TWILIO_API_KEY_SECRET must be set',
          timestamp: new Date().toISOString()
        }, 500);
      }

      const clientID = request.query.get('clientID') || 'default';
      const identity = request.query.get('identity') || `user-${clientID}`;

      // Generate Twilio access token
      const AccessToken = twilio.jwt.AccessToken;
      const VoiceGrant = AccessToken.VoiceGrant;

      // Create a Voice grant for this token
      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: TWILIO_TWIML_APP_SID || null,
        incomingAllow: true,
      });

      // Create an access token which we will sign and return to the client
      const token = new AccessToken(
        TWILIO_ACCOUNT_SID,
        TWILIO_API_KEY_SID,
        TWILIO_API_KEY_SECRET,
        { 
          identity: identity,
          ttl: 3600 // 1 hour
        }
      );

      token.addGrant(voiceGrant);

      // Serialize the token to a JWT string
      const jwtToken = token.toJwt();

      context.log(`✅ Twilio token generated for ${identity} (client: ${clientID})`);

      return createCorsResponse({
        success: true,
        clientID: clientID,
        token: jwtToken,
        identity: identity,
        expiresIn: 3600,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      context.log.error('❌ Twilio token error:', error);

      return createCorsResponse({
        success: false,
        error: 'Twilio token generation failed',
        message: error.message,
        timestamp: new Date().toISOString()
      }, 500);
    }
  }
});

// Voice TwiML Function with Finnish language support
app.http('VoiceTwiML', {
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'api/twilio/voice',
  handler: async (request, context) => {
    try {
      context.log(`Voice TwiML request: ${request.method} ${request.url}`);

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return createCorsResponse({ message: 'CORS preflight successful' });
      }

      // Get parameters
      const to = request.query.get('To') || '';
      const from = request.query.get('From') || '';
      const clientID = request.query.get('clientID') || 'default';

      context.log(`📞 Voice call: ${from} → ${to} (client: ${clientID})`);

      // Generate Finnish TwiML response
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="fi-FI">
        Hei! Tämä on ReminderApp automaattinen vastaus. 
        Soittosi on vastaanotettu. 
        Jos tarvitset apua, ota yhteyttä hoitajaan.
    </Say>
    <Pause length="1"/>
    <Say voice="alice" language="fi-FI">
        Kiitos soitosta. Hyvää päivää!
    </Say>
    <Hangup/>
</Response>`;

      return createCorsResponse(twimlResponse, 200, 'application/xml');

    } catch (error) {
      context.log.error('❌ Voice TwiML error:', error);

      // Return error as TwiML
      const errorTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="fi-FI">
        Pahoittelut, järjestelmässä on ongelma. 
        Yritä myöhemmin uudelleen.
    </Say>
    <Hangup/>
</Response>`;

      return createCorsResponse(errorTwiML, 200, 'application/xml');
    }
  }
});

// SMS TwiML Function
app.http('SmsTwiML', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'api/twilio/sms',
  handler: async (request, context) => {
    try {
      context.log(`SMS TwiML request: ${request.method} ${request.url}`);

      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return createCorsResponse({ message: 'CORS preflight successful' });
      }

      // Parse form data from Twilio webhook
      const body = await request.text();
      const params = new URLSearchParams(body);
      
      const from = params.get('From') || '';
      const messageBody = params.get('Body') || '';
      const to = params.get('To') || '';

      context.log(`📱 SMS received: ${from} → ${to}: "${messageBody}"`);

      // Generate Finnish SMS response
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>
        Kiitos viestistäsi! ReminderApp on vastaanottanut viestisi: "${messageBody}". 
        Hoitaja saa tiedon pian.
    </Message>
</Response>`;

      return createCorsResponse(twimlResponse, 200, 'application/xml');

    } catch (error) {
      context.log.error('❌ SMS TwiML error:', error);

      const errorTwiML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>
        Pahoittelut, järjestelmässä on ongelma. Yritä myöhemmin uudelleen.
    </Message>
</Response>`;

      return createCorsResponse(errorTwiML, 200, 'application/xml');
    }
  }
});

module.exports = app;
