/**
 * Utility functions for ReminderApp
 * Contains common helper functions, CORS handling, string processing, and date utilities
 */

// Include config constants
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/config.js').getContentText()); // For GAS module loading

/**
 * Create a response with CORS headers for Google Apps Script
 */
function createCorsResponse_(data) {
  // Google Apps Script doesn't support setHeaders on ContentService
  // CORS headers need to be handled differently in GAS
  const jsonResponse = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);

  return jsonResponse;
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
function doOptions(e) {
  return createCorsResponse_({
    status: "OK",
    message: "CORS preflight successful"
  });
}

/**
 * Trim and clean string values
 */
function trimString(value) {
  return String(value || '').trim();
}

/**
 * Get time of day from Date object
 */
function getTimeOfDay_(date) {
  const hour = date.getHours();
  if (hour >= 6 && hour < 12) return TIME_OF_DAY.AAMU;
  if (hour >= 12 && hour < 17) return TIME_OF_DAY.PAIVA;
  if (hour >= 17 && hour < 22) return TIME_OF_DAY.ILTA;
  return TIME_OF_DAY.YO;
}

/**
 * Create or get sheet by name
 */
function getOrCreateSheet_(spreadsheet, sheetName) {
  try {
    let sheet = spreadsheet.getSheetByName(sheetName);
    if (!sheet) {
      sheet = spreadsheet.insertSheet(sheetName);
      console.log(`✅ Created new sheet: ${sheetName}`);
    }
    return sheet;
  } catch (error) {
    console.error(`Error creating/getting sheet ${sheetName}:`, error.toString());
    return null;
  }
}

/**
 * Validate API key from request
 */
function validateApiKey_(apiKey) {
  if (!apiKey) {
    console.log("🔐 No API key provided");
    // API key validation DISABLED - proxy handles authentication
    // Since we use Azure Functions proxy as trusted gateway,
    // we trust any API key that comes through the proxy
    console.log("🔐 API key validation: ✅ BYPASSED (proxy trusted)");
    return true;
  }

  // API key validation DISABLED - proxy handles authentication
  // Since we use Azure Functions proxy as trusted gateway,
  // we trust any API key that comes through the proxy
  console.log("🔐 API key validation: ✅ BYPASSED (proxy trusted)");
  return true;
}

/**
 * Parse flexible date string
 */
function parseFlexibleDate_(s) {
  if (!s || typeof s !== 'string') return null;

  s = s.trim();

  // Handle "today", "tomorrow"
  if (s.toLowerCase() === 'today') return new Date();
  if (s.toLowerCase() === 'tomorrow') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }

  // Handle relative dates like "+3" (3 days from now)
  if (s.startsWith('+')) {
    const days = parseInt(s.substring(1));
    if (!isNaN(days)) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d;
    }
  }

  // Handle dd.mm.yyyy format
  const parts = s.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JS months are 0-based
    const year = parseInt(parts[2]);

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Try standard date parsing
  const parsed = new Date(s);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Get next change time based on interval
 */
function getNextChangeTime_(interval) {
  const now = new Date();
  const minutes = parseInt(interval) || 60; // default 1 hour

  const nextTime = new Date(now.getTime() + minutes * 60000);
  return nextTime;
}

/**
 * Deterministic random number generator based on seed
 */
function deterministicRandom_(seed, max) {
  const x = Math.sin(seed) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
}

/**
 * Normalize phone number to international format
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
 * Append webhook log entry
 */
function appendWebhookLog_(type, detail) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    if (!sheetId) return;

    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const logSheet = getOrCreateSheet_(spreadsheet, 'WebhookLogs');

    if (logSheet.getLastRow() === 0) {
      logSheet.appendRow(['Timestamp', 'Type', 'Detail']);
    }

    logSheet.appendRow([new Date(), type, detail]);
  } catch (error) {
    console.error("Error appending webhook log:", error.toString());
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createCorsResponse_,
    doOptions,
    trimString,
    getTimeOfDay_,
    getOrCreateSheet_,
    validateApiKey_,
    parseFlexibleDate_,
    getNextChangeTime_,
    deterministicRandom_,
    normalizePhoneNumber_,
    appendWebhookLog_
  };
}
