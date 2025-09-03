/**
 * SMS integration module for ReminderApp
 * Handles SMS notifications via Twilio and phone number management
 */

// Include config constants
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/config.js').getContentText()); // For GAS module loading

/**
 * Enhanced SMS notification function
 * @param {string} message - Message to send
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} fromNumber - Sender phone number
 * @param {string} accountSid - Twilio account SID
 * @param {string} authToken - Twilio auth token
 * @param {string} clientID - Client identifier
 */
function sendSmsNotification_(message, phoneNumber, fromNumber, accountSid, authToken, clientID) {
  try {
    console.log(`📱 Sending SMS notification to ${clientID}...`);

    if (!phoneNumber || !fromNumber || !accountSid || !authToken) {
      console.log("❌ Missing SMS credentials");
      return false;
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber_(phoneNumber);
    if (!normalizedPhone) {
      console.log(`❌ Invalid phone number: ${phoneNumber}`);
      return false;
    }

    console.log(`📞 Sending SMS to: ${normalizedPhone}`);

    return sendSmsViaTwilio_(message, normalizedPhone, fromNumber, accountSid, authToken);

  } catch (error) {
    console.error(`❌ Error in SMS notification: ${error.toString()}`);
    return false;
  }
}

/**
 * Core SMS sending via Twilio
 * @param {string} messageBody - SMS message content
 * @param {string} to - Recipient phone number
 * @param {string} from - Sender phone number
 * @param {string} accountSid - Twilio account SID
 * @param {string} authToken - Twilio auth token
 */
function sendSmsViaTwilio_(messageBody, to, from, accountSid, authToken) {
  try {
    console.log(`📞 Sending via Twilio to ${to}...`);

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const payload = {
      'To': to,
      'From': from,
      'Body': messageBody
    };

    // Create authentication header
    const authHeader = `Basic ${Utilities.base64Encode(accountSid + ':' + authToken)}`;

    const options = {
      'method': 'POST',
      'headers': {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      'payload': payload
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    const responseData = JSON.parse(responseText);

    console.log(`📱 Twilio response: ${responseText}`);

    if (response.getResponseCode() === 201) {
      console.log(`✅ SMS sent successfully to ${to}`);
      console.log(`📊 Message SID: ${responseData.sid}`);
      return true;
    } else {
      console.log(`❌ Twilio error: ${responseData.error_message || 'Unknown error'}`);
      console.log(`📊 Error code: ${responseData.error_code}`);
      return false;
    }

  } catch (error) {
    console.error(`❌ Error sending SMS via Twilio: ${error.toString()}`);
    return false;
  }
}

/**
 * Normalize phone number to international format
 * @param {string} phoneNumber - Phone number to normalize
 */
function normalizePhoneNumber_(phoneNumber) {
  if (!phoneNumber) return null;

  // Remove all non-digit characters except +
  let normalized = phoneNumber.replace(/[^\d+]/g, '');

  // Ensure it starts with +
  if (!normalized.startsWith('+')) {
    // Assume Finnish number if no country code
    if (normalized.startsWith('0')) {
      normalized = '+358' + normalized.substring(1);
    } else {
      normalized = '+' + normalized;
    }
  }

  return normalized;
}

/**
 * Get SMS greeting from sheet
 * @param {Object} smsSheet - SMS sheet reference
 * @param {string} timeOfDay - Time of day (AAMU, PAIVA, ILTA, YO)
 */
function getSMSTervehdys_(smsSheet, timeOfDay) {
  try {
    const data = smsSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const ajankohta = String(data[i][0]).trim().toUpperCase();
      const tervehdys = String(data[i][1]).trim();

      if (ajankohta === timeOfDay.toUpperCase() && tervehdys) {
        console.log(`📱 Löytyi SMS tervehdys: ${ajankohta} → "${tervehdys}"`);
        return tervehdys;
      }
    }

    console.log(`📱 Ei löytynyt SMS tervehdystä ajankohdalle: ${timeOfDay}`);
    return null;
  } catch (error) {
    console.error("Error reading SMS greetings:", error.toString());
    return null;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sendSmsNotification_,
    sendSmsViaTwilio_,
    normalizePhoneNumber_,
    getSMSTervehdys_
  };
}
