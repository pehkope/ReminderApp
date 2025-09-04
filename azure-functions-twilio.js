/**
 * Azure Functions - Twilio Integration
 * Handles Twilio token generation and TwiML responses
 */

const { app } = require('@azure/functions');
const twilio = require('twilio');

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID || '';
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET || '';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS || '*';

// Twilio Token Function
app.http('TwilioToken', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'api/twilio/token',
  handler: async (request, context) => {
    try {
      context.log(`Twilio token request: ${request.method} ${request.url}`);

      // Check if Twilio credentials are configured
      if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
        return {
          status: 500,
          jsonBody: {
            success: false,
            error: 'Twilio credentials not configured',
            message: 'TWILIO_ACCOUNT_SID, TWILIO_API_KEY_SID, and TWILIO_API_KEY_SECRET must be set'
          }
        };
      }

      const clientID = request.query.get('clientID') || 'default';
      const identity = request.query.get('identity') || 'mom';

      // Generate Twilio access token
      const AccessToken = twilio.jwt.AccessToken;
      const VoiceGrant = AccessToken.VoiceGrant;

      // Create a Voice grant for this token
      const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID || null,
        incomingAllow: true,
      });

      // Create an access token which we will sign and return to the client
      const token = new AccessToken(
        TWILIO_ACCOUNT_SID,
        TWILIO_API_KEY_SID,
        TWILIO_API_KEY_SECRET,
        { identity: identity }
      );

      token.addGrant(voiceGrant);

      // Serialize the token to a JWT string
      const jwtToken = token.toJwt();

      return {
        status: 200,
        jsonBody: {
          success: true,
          clientID: clientID,
          token: jwtToken,
          identity: identity,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      context.log.error('Twilio token error:', error);

      return {
        status: 500,
        jsonBody: {
          success: false,
          error: 'Twilio token generation failed',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
});

// Voice TwiML Function
app.http('VoiceTwiML', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  route: 'api/twilio/voice',
  handler: async (request, context) => {
    try {
      context.log(`Voice TwiML request: ${request.method} ${request.url}`);

      // Generate simple TwiML response
      const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice" language="fi-FI">Hei, tämä on automaattinen vastaus.</Say>
    <Hangup/>
</Response>`;

      return {
        status: 200,
        headers: {
          'Content-Type': 'application/xml'
        },
        body: twimlResponse
      };

    } catch (error) {
      context.log.error('Voice TwiML error:', error);

      return {
        status: 500,
        jsonBody: {
          success: false,
          error: 'Voice TwiML generation failed',
          message: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
});
