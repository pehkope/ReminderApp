/**
 * ReminderApp Backend for Google Apps Script - Version 2.0 Modular FIXED
 * Yhdistetty versio modulaarisista tiedostoista GAS:ia varten
 * Korjattu duplikaatti-ongelma ja optimoitu notifikaatiot
 */

// ===================================================================================
//  CONSTANTS AND CONFIGURATION  
// ===================================================================================
const SHEET_ID_KEY = "SHEET_ID";
const TELEGRAM_BOT_TOKEN_KEY = "TELEGRAM_BOT_TOKEN";
const WEATHER_API_KEY_KEY = "Weather_Api_Key";
const TWILIO_FROM_NUMBER_KEY = "Twilio_Phone_Number";
const TWILIO_AUTH_TOKEN_KEY = "Twilio_Auth_Token";
const TWILIO_ACCOUNT_SID_KEY = "Account_SID";
const GOOGLE_PHOTOS_ALBUM_ID_KEY = "Google_Photos_Album_ID";

const HELSINKI_TIMEZONE = "Europe/Helsinki";
const TELEGRAM_API_BASE = "https://api.telegram.org/bot";
const WEATHER_API_BASE = "https://api.openweathermap.org/data/2.5/weather";
const TWILIO_API_BASE = "https://api.twilio.com/2010-04-01/Accounts";

const SHEET_NAMES = {
  CONFIG: "Konfiguraatio", // 🔄 Suomennettu Config → Konfiguraatio
  KUITTAUKSET: "Kuittaukset", // ✅ Suomenkielinen kuittausten hallinta
  VIESTIT: "Viestit", // 🔄 Päivittäiset tervehdykset (ent. SMS-Tervehdykset)
  TAPAAMISET: "Tapaamiset", // ✅ Tärkeät tapaamiset (lääkäri jne.)
  KUVAT: "Kuvat", // ✅ Suomenkielinen  
  RUOKA_AJAT: "Ruoka-ajat", // ✅ Suomenkielinen
  LÄÄKKEET: "Lääkkeet", // ✅ Suomenkielinen
  PUUHAA: "Puuhaa-asetukset" // 🔄 Oikea välilehden nimi
};

const TASK_TYPES = {
  RUOKA: "RUOKA",
  LÄÄKKEET: "LÄÄKKEET",
  AKTIVITEETTI: "AKTIVITEETTI"
};

const TIME_OF_DAY = {
  AAMU: "Aamu",
  PAIVA: "Päivä", 
  ILTA: "Ilta",
  YO: "Yö"
};

const SAA_KATEGORIAT = {
  AURINKO: ["clear", "sunny", "few clouds"],
  PILVIA: ["scattered clouds", "broken clouds", "overcast clouds"],
  SADE: ["shower rain", "rain", "thunderstorm", "light rain"],
  LUMISADE: ["snow", "light snow", "heavy snow", "sleet"],
  SUMU: ["mist", "fog", "haze"],
  KAIKKI: ["*"] // Soveltuu kaikkeen säähän
};

const PUUHAA_KATEGORIAT = {
  ULKO: "ULKO",
  SISÄ: "SISÄ", 
  SOSIAALI: "SOSIAALI"
};

const EMOJIS = {
  RUOKA: "🍽️",
  LÄÄKKEET: "💊", 
  AKTIVITEETTI: "✅",
  CLOCK: "🕒",
  SUNNY: "☀️",
  CLOUDY: "☁️",
  RAINY: "🌧️",
  SNOWY: "❄️"
};

// ===================================================================================
//  CORS HELPER FUNCTIONS
// ===================================================================================

/**
 * Create a response with CORS headers
 */
function createCorsResponse_(data) {
  // Google Apps Script doesn't support setHeaders on ContentService
  // CORS headers need to be handled differently in GAS
  const jsonResponse = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  
  return jsonResponse;
}

// ===================================================================================
//  MAIN ENTRY POINTS
// ===================================================================================

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
 * Handle POST requests with CORS support
 */
function doPost(e) {
  try {
    console.log("doPost called with:", JSON.stringify(e, null, 2));
    
    // Parse POST body
    let postData = {};
    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (parseError) {
        console.error("Failed to parse POST data:", parseError.toString());
        return createCorsResponse_({
          error: "Invalid JSON in POST body",
          status: "ERROR"
        });
      }
    }
    
    // API Key authentication
    const apiKey = postData.apiKey || (e.parameter && e.parameter.apiKey);
    if (!validateApiKey_(apiKey)) {
      console.error("❌ Invalid or missing API key in POST:", apiKey);
      return createCorsResponse_({
        error: "Unauthorized - Invalid API key",
        status: "UNAUTHORIZED"
      });
    }
    
    // Handle acknowledgment from POST data
    if (postData.action === 'acknowledgeTask' || (e.parameter && e.parameter.action === 'acknowledgeTask')) {
      return handlePostAcknowledgement_(postData, e);
    }
    
    // Default: treat as data fetch
    return handleDataFetchAction_(e);
    
  } catch (error) {
    console.error("CRITICAL ERROR in doPost:", error.toString());
    return createCorsResponse_({
      error: "Server error: " + error.toString(),
      status: "ERROR"
    });
  }
}

/**
 * Handle POST acknowledgment requests
 */
function handlePostAcknowledgement_(postData, e) {
  try {
    const clientID = postData.clientID || 'mom';
    const type = postData.type || '';
    const timeOfDay = postData.timeOfDay || '';
    const description = postData.description || '';
    const timestamp = postData.timestamp || new Date().toISOString();
    
    console.log(`POST Acknowledgment: ${clientID} - ${type} (${timeOfDay}) "${description}"`);
    
    if (!type || !timeOfDay) {
      return createCorsResponse_({
        error: "Missing type or timeOfDay in POST data",
        status: "ERROR"
      });
    }
    
    const ackSuccess = acknowledgeWeeklyTask_(clientID, type, timeOfDay, description, timestamp);
    
    if (ackSuccess) {
      try {
        sendAcknowledgmentNotifications_(clientID, type, timeOfDay, timestamp);
      } catch (notifyError) {
        console.error("⚠️ Notification failed:", notifyError.toString());
      }
    }
    
    return createCorsResponse_({
      status: ackSuccess ? "OK" : "ERROR",
      message: ackSuccess ? "Task acknowledged" : "Failed to acknowledge task",
      clientID: clientID,
      type: type,
      timeOfDay: timeOfDay,
      timestamp: timestamp
    });
    
  } catch (error) {
    console.error("ERROR in handlePostAcknowledgement_:", error.toString());
    return createCorsResponse_({
      error: error.toString(),
      status: "ERROR"
    });
  }
}

/**
 * Main entry point for HTTP GET requests
 */
function doGet(e) {
  try {
    console.log("doGet called with parameters:", e ? JSON.stringify(e.parameter || {}, null, 2) : "no parameters");
    
    // API Key authentication
    const apiKey = e && e.parameter && e.parameter.apiKey;
    if (!validateApiKey_(apiKey)) {
      console.error("❌ Invalid or missing API key:", apiKey);
      return createCorsResponse_({
        error: "Unauthorized - Invalid API key",
        status: "UNAUTHORIZED"
      });
    }
    
    // Check if this is an acknowledgment request
    if (e && e.parameter && e.parameter.action === 'acknowledge') {
      return handleAcknowledgementAction_(e);
    }
    
    // Default: return tablet data
    return handleDataFetchAction_(e);
    
} catch (error) {
    console.error("CRITICAL ERROR in doGet:", error.toString());
    console.error("Stack trace:", error.stack);
    
    return createCorsResponse_({
      error: "Server error: " + error.toString(),
      timestamp: new Date().toISOString(),
      status: "ERROR"
    });
  }
}

/**
 * Handle acknowledgment actions
 */
function handleAcknowledgementAction_(e) {
  try {
    console.log("=== ACKNOWLEDGMENT ACTION RECEIVED ===");
    console.log("Full request details:", JSON.stringify(e, null, 2));
    
    // Extract parameters - 🔧 KORJAUS: Käytetään "type" parametria
    const clientID = (e.parameter && e.parameter.clientID) || 'mom';
    const taskType = (e.parameter && e.parameter.type) || (e.parameter && e.parameter.taskType) || ''; // Support both names
    const timeOfDay = (e.parameter && e.parameter.timeOfDay) || '';
    const description = (e.parameter && e.parameter.description) || '';
    const timestamp = (e.parameter && e.parameter.timestamp) || new Date().toISOString();
    
    console.log(`Processing acknowledgment: ${clientID} - ${taskType} (${timeOfDay}) "${description}" at ${timestamp}`);
    
    if (!taskType || !timeOfDay) {
      console.error("Missing required parameters: taskType or timeOfDay");
      return createCorsResponse_({
        error: "Missing taskType or timeOfDay",
        status: "ERROR"
      });
    }
    
    // Record acknowledgment in Google Sheets
    const ackSuccess = acknowledgeWeeklyTask_(clientID, taskType, timeOfDay, description, timestamp);
    
    if (ackSuccess) {
      console.log("✅ Acknowledgment recorded in Google Sheets");
      
      // Send notifications (fire-and-forget)
      try {
      sendAcknowledgmentNotifications_(clientID, taskType, timeOfDay, timestamp);
        console.log("📤 Notification sending initiated");
      } catch (notifyError) {
        console.error("⚠️ Notification sending failed:", notifyError.toString());
        // Don't fail the whole request if notifications fail
      }
    } else {
      console.error("❌ Failed to record acknowledgment");
    }
    
    return createCorsResponse_({
      status: ackSuccess ? "OK" : "ERROR",
      message: ackSuccess ? "Acknowledgment recorded" : "Failed to record acknowledgment",
      clientID: clientID,
        taskType: taskType,
      timeOfDay: timeOfDay,
      timestamp: timestamp
    });
    
  } catch (error) {
    console.error("ERROR in handleAcknowledgementAction_:", error.toString());
    return createCorsResponse_({
      error: error.toString(),
      status: "ERROR"
    });
  }
}

// ===================================================================================
//  ACKNOWLEDGMENT NOTIFICATIONS TO FAMILY - KORJATTU VERSIO
// ===================================================================================
function sendAcknowledgmentNotifications_(clientID, taskType, timeOfDay, timestamp) {
  try {
    console.log("[NOTIFY] Starting notification process...");
    
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    const sheet = SpreadsheetApp.openById(sheetId);
    
    const configSheet = sheet.getSheetByName(SHEET_NAMES.CONFIG);
    if (!configSheet) {
      console.error("[NOTIFY] CRITICAL: Config sheet not found.");
      return;
}
    console.log("[NOTIFY] Config sheet found.");
    
    let notificationRecipients = [];
    const configData = configSheet.getDataRange().getValues();
    console.log(`[NOTIFY] Found ${configData.length - 1} potential contacts in Config sheet.`);
    
    for (let i = 1; i < configData.length; i++) {
      const name = String(configData[i][1]).trim();
      
      if (name.toLowerCase().includes('tiitta') || name.toLowerCase().includes('petri')) {
        const phone = String(configData[i][2]).trim();
        const telegramChatID = configData[i][3] ? String(configData[i][3]).trim() : "";
        
        notificationRecipients.push({
          name: name,
          phone: phone, 
          telegramChatID: telegramChatID
        });
        console.log(`[NOTIFY] Added recipient: ${name}, Phone: ${phone || 'N/A'}, Telegram: ${telegramChatID || 'N/A'}`);
      }
}
    
    if (notificationRecipients.length === 0) {
        console.warn("[NOTIFY] WARNING: No recipients ('Tiitta' or 'Petri') found in Config sheet. Stopping.");
        return;
}
    
    const timeStr = new Date(timestamp).toLocaleTimeString('fi-FI', { timeZone: 'Europe/Helsinki', hour: '2-digit', minute: '2-digit' });
    const taskEmoji = taskType.toLowerCase() === 'ruoka' ? '🍽️' : taskType.toLowerCase() === 'lääkkeet' ? '💊' : '✅';
    const message = `${taskEmoji} Äiti kuitannut: ${taskType.toUpperCase()} (${timeOfDay})\n🕒 Aika: ${timeStr}`;
    console.log(`[NOTIFY] Prepared message: "${message}"`);
    
    const telegramToken = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY);
    const twilioFromNumber = scriptProperties.getProperty(TWILIO_FROM_NUMBER_KEY);
    const accountSid = scriptProperties.getProperty(TWILIO_ACCOUNT_SID_KEY);
    const authToken = scriptProperties.getProperty(TWILIO_AUTH_TOKEN_KEY);
    
    for (const recipient of notificationRecipients) {
      console.log(`[NOTIFY] Processing recipient: ${recipient.name}`);
      let sent = false;
      
      if (telegramToken && recipient.telegramChatID) {
        console.log(`[NOTIFY] Attempting to send Telegram to ${recipient.name} (Chat ID: ${recipient.telegramChatID})`);
        const success = sendTelegramMessage_(telegramToken, recipient.telegramChatID, message);
        if(success) {
            console.log(`[NOTIFY] SUCCESS: Telegram sent to ${recipient.name}.`);
            sent = true;
} else {
            console.error(`[NOTIFY] FAILED: Telegram to ${recipient.name}.`);
}
} else {
        console.log(`[NOTIFY] SKIPPING Telegram for ${recipient.name}: Token or Chat ID missing.`);
}
      
      if (!sent && twilioFromNumber && authToken && accountSid && recipient.phone) {
        console.log(`[NOTIFY] Attempting to send SMS to ${recipient.name} (Phone: ${recipient.phone})`);
        const success = sendSmsNotification_(message, recipient.phone, twilioFromNumber, accountSid, authToken, recipient.name);
        if(success) {
            console.log(`[NOTIFY] SUCCESS: SMS sent to ${recipient.name}.`);
} else {
            console.error(`[NOTIFY] FAILED: SMS to ${recipient.name}.`);
}
} else if (!sent) {
          console.log(`[NOTIFY] SKIPPING SMS for ${recipient.name}: Twilio credentials or phone number missing.`);
}
}
    console.log("[NOTIFY] Notification process finished.");
} catch (error) {
    console.error(`[NOTIFY] CRITICAL ERROR in sendAcknowledgmentNotifications: ${error.toString()}`);
  }
}

// ===================================================================================
//  TELEGRAM FUNCTIONS
// ===================================================================================

/**
 * Sends a Telegram message 
 */
function sendTelegramMessage_(token, chatId, message, sheet, clientID, usePhotos) {
  try {
    if (!token || !chatId) {
      console.log("❌ Missing token or chatId for Telegram");
      return false;
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
      'chat_id': chatId,
      'text': message,
      'parse_mode': 'HTML'
    };

    const options = {
      'method': 'POST',
      'headers': {
        'Content-Type': 'application/json'
      },
      'payload': JSON.stringify(payload)
    };

    console.log(`📞 Sending Telegram message to chat ${chatId}...`);
    console.log(`📝 Message: ${message}`);
    
    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    
    console.log(`📱 Telegram API response: ${responseText}`);
    
    if (response.getResponseCode() === 200) {
      console.log("✅ Telegram message sent successfully");
    return true;
    } else {
      console.log(`❌ Telegram API error: ${response.getResponseCode()}`);
      return false;
    }
} catch (error) {
    console.error(`❌ Error sending Telegram: ${error.toString()}`);
    return false;
  }
}

// ===================================================================================
//  SMS FUNCTIONS
// ===================================================================================

/**
 * Enhanced SMS notification function
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
      'payload': Object.keys(payload).map(key => `${key}=${encodeURIComponent(payload[key])}`).join('&')
    };

    console.log(`📞 Calling Twilio API...`);
    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();
    
    console.log(`📱 Twilio response: ${responseText}`);
    
    if (response.getResponseCode() === 201) {
      console.log("✅ SMS sent successfully");
      return true;
    } else {
      console.log(`❌ Twilio error: ${response.getResponseCode()}`);
      return false;
    }
    
} catch (error) {
    console.error(`❌ Error sending SMS: ${error.toString()}`);
    return false;
  }
}

/**
 * Normalize phone number for international format
 */
function normalizePhoneNumber_(phoneNumber) {
  if (!phoneNumber) return null;
  
  // Convert to string and remove all spaces, dots, dashes, parentheses
  let normalized = String(phoneNumber).replace(/[\s\.\-\(\)]/g, '');
  
  console.log(`Normalizing phone: "${phoneNumber}" -> "${normalized}"`);
  
  // Remove leading zeros
  normalized = normalized.replace(/^0+/, '');
  
  // Handle Finnish numbers
  if (normalized.startsWith('358')) {
    // Already has country code
    normalized = '+' + normalized;
  } else if (normalized.length === 10 && (normalized.startsWith('4') || normalized.startsWith('5'))) {
    // Finnish mobile number without country code (like 0401234567 -> 401234567)
    normalized = '+358' + normalized;
  } else if (normalized.length === 9 && (normalized.startsWith('4') || normalized.startsWith('5'))) {
    // Finnish mobile number without 0 and country code (like 401234567)
    normalized = '+358' + normalized;
  } else if (!normalized.startsWith('+')) {
    // Try to add + if missing
    normalized = '+' + normalized;
  }
  
  console.log(`Final normalized phone: "${normalized}"`);
  
  // Validate format (+country code + number, at least 10 digits total)
  if (normalized.match(/^\+\d{10,15}$/)) {
    return normalized;
  } else {
    console.log(`❌ Invalid phone format: ${normalized}`);
    return null;
  }
}

// ===================================================================================
//  DATA SERVICE FUNCTIONS
// ===================================================================================

/**
 * Handles the default action of fetching all data for the tablet display.
 */
function handleDataFetchAction_(e) {
  try {
    console.log("doGet called with:", JSON.stringify(e, null, 2));
    
    // --- ROBUST PARAMETER HANDLING ---
    let clientID = 'mom'; 
    
    if (e && e.parameter && e.parameter.clientID) {
      clientID = e.parameter.clientID;
    } else if (e && e.parameters && e.parameters.clientID && e.parameters.clientID[0]) {
      clientID = e.parameters.clientID[0];
    }
    
    console.log(`Processing request for clientID: ${clientID}`);
    
    const scriptProperties = PropertiesService.getScriptProperties();
    
    // Try client-specific Sheet ID first, fallback to default
    let sheetId = getClientSheetId_(clientID, scriptProperties);
    
    if (!sheetId) {
      console.error(`CRITICAL: Google Sheet ID not configured for client: ${clientID}`);
      return createCorsResponse_({
        error: `Sheet ID not configured for client: ${clientID}`,
        clientID: clientID,
        timestamp: new Date().toISOString(),
        status: "ERROR",
        suggestion: `Add SHEET_ID_${clientID.toLowerCase()} to Script Properties`
      });
    }
    
    const sheet = SpreadsheetApp.openById(sheetId);
    const now = new Date();
    const timeOfDay = getTimeOfDay_(now);
    
    console.log(`Current time of day: ${timeOfDay}`);
    
    // Get all the data components
    const dailyTasks = getDailyTasks_(sheet, clientID, timeOfDay);
    const upcomingAppointments = getUpcomingAppointments_(sheet, clientID);
    const contacts = getContacts_(sheet);
    const latestReminder = getLatestReminder_(sheet, clientID);
    const weather = getWeatherDataOptimized_(scriptProperties.getProperty(WEATHER_API_KEY_KEY), clientID);
    
    // Get settings from Config sheet
    const settings = getClientSettings_(sheet, clientID);
    
    let dailyPhotoUrl = "";
    let dailyPhotoCaption = "Kuvat eivät ole vielä käytössä";
    
    if (settings.usePhotos) {
      try {
        const dailyPhoto = getDailyPhoto_(sheet, clientID);
        dailyPhotoUrl = dailyPhoto.url;
        dailyPhotoCaption = dailyPhoto.caption;
      } catch (photoError) {
        console.warn("Photo service unavailable:", photoError.toString());
        dailyPhotoCaption = "Kuvat eivät ole käytettävissä tällä hetkellä";
      }
    }
    
    const response = {
      clientID: clientID,
      timestamp: new Date().toISOString(),
      status: "OK",
      settings: settings,
      importantMessage: getImportantMessage_(sheet),
      upcomingAppointments: upcomingAppointments,
      dailyPhotoUrl: dailyPhotoUrl,
      dailyPhotoCaption: dailyPhotoCaption,
      weather: weather,
      contacts: contacts,
      latestReminder: latestReminder,
      dailyTasks: dailyTasks,
      currentTimeOfDay: timeOfDay
    };
    
    console.log("Returning response:", JSON.stringify(response, null, 2));
    
    return createCorsResponse_(response);
      
} catch (error) {
    console.error("ERROR in handleDataFetchAction_:", error.toString());
    console.error("Stack trace:", error.stack);
    
    return createCorsResponse_({
      error: error.toString(),
      clientID: "unknown",
      timestamp: new Date().toISOString(),
      status: "ERROR"
    });
  }
}

/**
 * Record task acknowledgment in Google Sheets
 */
function acknowledgeWeeklyTask_(clientID, taskType, timeOfDay, description, timestamp) {
  try {
    console.log(`Recording acknowledgment: ${clientID} - ${taskType} (${timeOfDay}) "${description}" at ${timestamp}`);
    
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    const sheet = SpreadsheetApp.openById(sheetId);
    
    const ackSheet = getOrCreateSheet_(sheet, SHEET_NAMES.KUITTAUKSET);
    
    const date = Utilities.formatDate(new Date(timestamp), HELSINKI_TIMEZONE, "yyyy-MM-dd");
    
    // Check if this specific task (with description) is already acknowledged today
    if (isTaskAckedToday_(sheet, taskType, timeOfDay, description, date)) {
      console.log(`Task ${taskType} (${timeOfDay}) "${description}" already acknowledged today`);
      return false;
    }
    
    // Add new acknowledgment with description for unique identification
    ackSheet.appendRow([
      timestamp,
      clientID,
      taskType,
      timeOfDay,
      description,
      date
    ]);
    
    console.log("✅ Acknowledgment recorded successfully");
    return true;
    
} catch (error) {
    console.error("Error recording acknowledgment:", error.toString());
    return false;
  }
}

// ===================================================================================
//  UTILITY FUNCTIONS
// ===================================================================================

/**
 * Get or create a sheet with the specified name
 */
function getOrCreateSheet_(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    console.log(`Creating new sheet: ${sheetName}`);
    sheet = spreadsheet.insertSheet(sheetName);
    
    if (sheetName === SHEET_NAMES.KUITTAUKSET) {
      sheet.getRange(1, 1, 1, 6).setValues([["Aikaleima", "AsiakasTunniste", "TehtäväTyyppi", "VuorokaudenAika", "Kuvaus", "Päivämäärä"]]);
    }
  }
  return sheet;
}

/**
 * Determine time of day based on current time
 */
function getTimeOfDay_(date) {
  const hour = date.getHours();
  
  if (hour >= 6 && hour < 12) {
    return TIME_OF_DAY.AAMU;
  } else if (hour >= 12 && hour < 18) {
    return TIME_OF_DAY.PAIVA;
  } else if (hour >= 18 && hour < 22) {
    return TIME_OF_DAY.ILTA;
  } else {
    return TIME_OF_DAY.YO;
  }
}

/**
 * Get daily tasks for a specific client and time of day
 */
function getDailyTasks_(sheet, clientID, timeOfDay) {
  try {
    console.log(`Getting daily tasks for ${clientID} at ${timeOfDay}`);
    
    const tasks = [];
    const today = Utilities.formatDate(new Date(), HELSINKI_TIMEZONE, "yyyy-MM-dd");
    const currentHour = new Date().getHours();
    
    // 1. RUOKA tehtävät Ruoka-ajat sheetistä  
    const foodReminders = getFoodReminders_(sheet, clientID, timeOfDay, currentHour);
    
    // Ensure timeOfDay is never empty - use current time if missing
    const finalTimeOfDay = timeOfDay && timeOfDay.trim() ? timeOfDay : getTimeOfDay_(new Date());
    
    if (foodReminders.length > 0) {
      // Löytyi muistutuksia sheet:stä
      foodReminders.forEach(reminder => {
        const isAcked = isTaskAckedToday_(sheet, "RUOKA", timeOfDay, reminder.replace("🍽️ ", ""), today);
        console.log(`📋 Adding RUOKA task from sheet: "${reminder}" with timeOfDay: "${finalTimeOfDay}"`);
        
        tasks.push({
          type: "RUOKA",
          description: reminder.replace("🍽️ ", ""), // Poista emoji jos on
          timeOfDay: finalTimeOfDay,
          requiresAck: true, // 🍽️ RUOKA VAATII KUITTAUKSEN
          isAckedToday: isAcked,
          acknowledgmentTimestamp: isAcked ? getTaskAckTimestamp_(sheet, "RUOKA", timeOfDay, today) : null
        });
      });
    } else {
      // Ei löytynyt muistutuksia sheet:stä, lisää default RUOKA tehtävä
      const defaultFoodDesc = "Lounas tai ainakin kunnon välipala";
      const isAcked = isTaskAckedToday_(sheet, "RUOKA", timeOfDay, defaultFoodDesc, today);
      console.log(`📋 Adding default RUOKA task: "${defaultFoodDesc}" with timeOfDay: "${finalTimeOfDay}"`);
      
      tasks.push({
        type: "RUOKA",
        description: defaultFoodDesc,
        timeOfDay: finalTimeOfDay,
        requiresAck: true, // 🍽️ RUOKA VAATII KUITTAUKSEN
        isAckedToday: isAcked,
        acknowledgmentTimestamp: isAcked ? getTaskAckTimestamp_(sheet, "RUOKA", timeOfDay, today) : null
      });
    }
    
    // 2. LÄÄKKEET tehtävät Lääkkeet sheetistä
    const medicineReminders = getMedicineReminders_(sheet, clientID, timeOfDay, currentHour);
    
    if (medicineReminders.length > 0) {
      // Löytyi muistutuksia sheet:stä - OTTA VAIN ENSIMMÄINEN
      const firstReminder = medicineReminders[0]; // VAIN YKSI LÄÄKE
      const isAcked = isTaskAckedToday_(sheet, "LÄÄKKEET", timeOfDay, firstReminder.replace("💊 ", ""), today);
      console.log(`📋 Adding SINGLE LÄÄKKEET task from sheet: "${firstReminder}" with timeOfDay: "${finalTimeOfDay}"`);
      
      tasks.push({
        type: "LÄÄKKEET", 
        description: firstReminder.replace("💊 ", ""), // Poista emoji jos on
        timeOfDay: finalTimeOfDay,
        requiresAck: true, // 💊 LÄÄKKEET VAATII KUITTAUKSEN
        isAckedToday: isAcked,
        acknowledgmentTimestamp: isAcked ? getTaskAckTimestamp_(sheet, "LÄÄKKEET", timeOfDay, today) : null
      });
    } else {
      // Ei löytynyt muistutuksia sheet:stä, lisää default LÄÄKKEET tehtävä
      const defaultMedDesc = "Muista ottaa päivän lääkkeet";
      const isAcked = isTaskAckedToday_(sheet, "LÄÄKKEET", timeOfDay, defaultMedDesc, today);
      console.log(`📋 Adding default LÄÄKKEET task: "${defaultMedDesc}" with timeOfDay: "${finalTimeOfDay}"`);
      
      tasks.push({
        type: "LÄÄKKEET",
        description: defaultMedDesc,
        timeOfDay: finalTimeOfDay,
        requiresAck: true, // 💊 LÄÄKKEET VAATII KUITTAUKSEN
        isAckedToday: isAcked,
        acknowledgmentTimestamp: isAcked ? getTaskAckTimestamp_(sheet, "LÄÄKKEET", timeOfDay, today) : null
      });
    }
    
    // 3. PUUHAA tehtävät - uusi älykäs sääperusteinen ehdotus
    const weatherApiKey = PropertiesService.getScriptProperties().getProperty(WEATHER_API_KEY_KEY);
    const currentWeather = weatherApiKey ? getWeatherData_(weatherApiKey) : null;
    
    // Hae PUUHAA aktiviteetti viestistä tai uudesta Puuhaa taulukosta
    const activityFromMessage = getActivityFromMessage_(sheet);
    const activityFromPuuhaa = getPuuhaaEhdotus_(sheet, clientID, timeOfDay, currentWeather);
    const activity = activityFromMessage || activityFromPuuhaa || "😊 Mukava hetki rauhassa";
    
    console.log(`🎯 PUUHAA valittu: "${activity}"`);
    
    tasks.push({
      type: "PUUHAA",
      description: activity,
      timeOfDay: finalTimeOfDay,
      requiresAck: false, // 😊 PUUHAA EI VAADI KUITTAUSTA
      isAckedToday: false, // PUUHAA ei kuitata
      acknowledgmentTimestamp: null
    });
    
    // 4. Perinteiset "Päivittäiset tehtävät" sheetistä (jos on)
    const tasksSheet = sheet.getSheetByName(SHEET_NAMES.DAILY_TASKS);
    if (tasksSheet) {
      const data = tasksSheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        const taskClient = String(data[i][0]).trim().toLowerCase();
        const taskType = String(data[i][1]).trim();
        const taskTimeOfDay = String(data[i][2]).trim();
        const taskDescription = String(data[i][3]).trim();
        
        if (taskClient === clientID.toLowerCase() && taskTimeOfDay === timeOfDay) {
          const isAcked = isTaskAckedToday_(sheet, taskType, timeOfDay, taskDescription, today);
          
          tasks.push({
            type: taskType,
            description: taskDescription,
            timeOfDay: taskTimeOfDay,
            isAckedToday: isAcked,
            acknowledgmentTimestamp: isAcked ? getTaskAckTimestamp_(sheet, taskType, timeOfDay, today) : null
          });
        }
      }
    }
    
    console.log(`Found ${tasks.length} tasks for ${clientID} at ${timeOfDay}:`, tasks.map(t => t.type).join(", "));
    return tasks;
    
  } catch (error) {
    console.error("Error getting daily tasks:", error.toString());
    return [];
  }
}

/**
 * Check if a task has been acknowledged today
 */
function isTaskAckedToday_(sheet, taskType, timeOfDay, description, today) {
  try {
    const ackSheet = getOrCreateSheet_(sheet, SHEET_NAMES.KUITTAUKSET);
    const data = ackSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const ackTaskType = String(data[i][2]).trim();
      const ackTimeOfDay = String(data[i][3]).trim();
      const ackDescription = String(data[i][4] || '').trim(); // New description column
      const ackDate = String(data[i][5] || data[i][4]).trim(); // Date moved to column 5, fallback to old position
      
      // Match by taskType, timeOfDay, description (if provided), and date
      const descriptionMatches = !description || ackDescription === description;
      
      // 🔧 KORJAUS: Vertaa vain päivämäärä osaa aikaleimasta (ackDate voi olla "2025-08-07T17:55:42.083Z" tai "2025-08-07")
      const ackDateOnly = ackDate.split('T')[0]; // Ota vain päivämäärä osa
      
      if (ackTaskType === taskType && ackTimeOfDay === timeOfDay && descriptionMatches && ackDateOnly === today) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error checking task acknowledgment:", error.toString());
    return false;
  }
}

/**
 * Get task acknowledgment timestamp
 */
function getTaskAckTimestamp_(sheet, taskType, timeOfDay, today) {
  try {
    const ackSheet = getOrCreateSheet_(sheet, SHEET_NAMES.KUITTAUKSET);
    const data = ackSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const ackTaskType = String(data[i][2]).trim();
      const ackTimeOfDay = String(data[i][3]).trim();
      const ackDate = String(data[i][5] || data[i][4]).trim(); // Date in column 5, fallback to old position
      
      // 🔧 KORJAUS: Vertaa vain päivämäärä osaa aikaleimasta
      const ackDateOnly = ackDate.split('T')[0]; // Ota vain päivämäärä osa
      
      if (ackTaskType === taskType && ackTimeOfDay === timeOfDay && ackDateOnly === today) {
        return data[i][0];
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error getting task acknowledgment timestamp:", error.toString());
    return null;
  }
}

/**
 * Get contacts from Config sheet
 */
function getContacts_(sheet) {
  try {
    const configSheet = sheet.getSheetByName(SHEET_NAMES.CONFIG);
    if (!configSheet) {
      console.warn("Config sheet not found");
      return [];
    }
    
    const data = configSheet.getDataRange().getValues();
    const contacts = [];
    
    for (let i = 1; i < data.length; i++) {
      const clientID = String(data[i][0]).trim();
      const name = String(data[i][1]).trim();
      const phone = String(data[i][2]).trim();
      const telegramChatID = data[i][3] ? String(data[i][3]).trim() : "";
      
      if (name && phone) {
        contacts.push({
          clientID: clientID,
          name: name,
          phone: phone,
          telegramChatID: telegramChatID
        });
      }
    }
    
    return contacts;
} catch (error) {
    console.error("Error getting contacts:", error.toString());
    return [];
  }
}

/**
 * Get client-specific settings
 */
function getClientSettings_(sheet, clientID) {
  const defaultSettings = {
    useTelegram: false,
    usePhotos: false
  };
  
  try {
    const configSheet = sheet.getSheetByName(SHEET_NAMES.CONFIG);
    if (!configSheet) {
      return defaultSettings;
    }
    
    const data = configSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const configClientID = String(data[i][0]).trim().toLowerCase();
      console.log(`🔍 Checking config row ${i}: "${configClientID}" vs "${clientID.toLowerCase()}"`);
      console.log(`📊 usePhotos value: "${data[i][9]}" (column J)`);
      
      if (configClientID === clientID.toLowerCase()) {
        const usePhotosValue = data[i][9];
        const usePhotosResult = usePhotosValue === true || String(usePhotosValue).toLowerCase() === 'true' || String(usePhotosValue).toLowerCase() === 'yes';
        console.log(`✅ Found matching client! usePhotos: ${usePhotosValue} → ${usePhotosResult}`);
        
        return {
          useTelegram: false, // 🚨 HÄTÄTILA: SMS SPAMMI PYSÄYTETTY!
          usePhotos: usePhotosResult
        };
      }
    }
    
    return defaultSettings;
} catch (error) {
    console.error("Error getting client settings:", error.toString());
    return defaultSettings;
  }
}

/**
 * Get smart contextual reminder message with weather-based activities
 * Combines greeting + weather-based PUUHAA (NO medicine - those are in SEURAAVAKSI tasks)
 */
function getLatestReminder_(sheet, clientID) {
  try {
    console.log(`🌟 Haetaan puhdasta tervehdystä SMS:ään asiakkaalle: ${clientID}`);
    
    // 1. Hae SMS-Tervehdykset taulukosta
    const smsSheet = sheet.getSheetByName(SHEET_NAMES.SMS_TERVEHDYKSET);
    if (smsSheet) {
      const currentTimeOfDay = getTimeOfDay_();
      const greeting = getSMSTervehdys_(smsSheet, currentTimeOfDay);
      if (greeting) {
        console.log(`📱 SMS tervehdys löytyi: "${greeting}"`);
        return greeting;
      }
    }
    
    // 2. Fallback: Yksinkertainen aikapohjainen tervehdys  
    const greeting = getTimeBasedGreeting_();
    console.log(`📱 Käytetään fallback tervehdystä: "${greeting}"`);
    return greeting;
    
  } catch (error) {
    console.error("Error getting SMS greeting:", error.toString());
    return "Hyvää päivää kultaseni! 💕";
  }
}

/**
 * Get time-based greeting with emojis
 */
function getTimeBasedGreeting_() {
  const now = new Date();
  const hour = now.getHours();
  
  if (hour >= 6 && hour < 10) {
    return "🌅 Hyvää huomenta kultaseni! ☀️💕";
  } else if (hour >= 10 && hour < 15) {
    return "☀️ Mukavaa päivää rakas! 🌸✨";
  } else if (hour >= 15 && hour < 19) {
    return "🌅 Hyvää iltapäivää! 🌻💝";
  } else {
    return "🌙 Hyvää iltaa kultaseni! 🌙💜";
  }
}

/**
 * Get weather-based activity suggestion
 */
function getWeatherBasedActivity_(weather) {
  if (!weather || !weather.description) {
    return "🚶‍♀️ Ehkä mukava kävely tai kirjan lukemista";
  }
  
  const desc = weather.description.toLowerCase();
  const temp = weather.temperature ? parseInt(weather.temperature) : 15;
  
  // Good weather activities (outdoor)
  if ((desc.includes("aurinko") || desc.includes("kirkas") || desc.includes("selkeä")) && temp > 10) {
    return "🌞 Upea sää! Mukava kävely ulkona tai puutarhassa puuhailua";
  }
  
  if (!desc.includes("sade") && !desc.includes("lumi") && temp > 5) {
    return "🚶‍♀️ Hyvä päivä kävelylle tai terassilla oleiluun";
  }
  
  // Bad weather activities (indoor)
  if (desc.includes("sade") || desc.includes("lumi") || desc.includes("myrsky")) {
    return "🏠 Säässä parasta olla sisällä - ehkä lukemista, musiikkia tai käsitöitä";
  }
  
  if (temp < 0) {
    return "❄️ Kylmä päivä! Lämmintä teetä ja mukavaa sisäpuuhaa";
  }
  
  // Default neutral activity
  return "📚 Mukavaa ajanvietettä - vaikka lehden lukemista tai musiikinkuuntelua";
}

/**
 * Get current time-based food/medicine reminders from Google Sheets
 */
function getCurrentTimeReminders_(sheet, clientID) {
  const now = new Date();
  const hour = now.getHours();
  const reminders = [];
  
  // Get current time period
  const currentTimeOfDay = getTimeOfDay_(now);
  
  try {
    // Get medicine reminders from Sheets
    const medicineReminders = getMedicineReminders_(sheet, clientID, currentTimeOfDay, hour);
    
    // Get food reminders from Sheets  
    const foodReminders = getFoodReminders_(sheet, clientID, currentTimeOfDay, hour);
    
    // Combine all reminders
    if (foodReminders.length > 0) {
      reminders.push(...foodReminders);
    }
    
    if (medicineReminders.length > 0) {
      reminders.push(...medicineReminders);
    }
    
  } catch (error) {
    console.error("Error getting reminders from sheets:", error.toString());
    
    // Fallback to hardcoded reminders if sheets fail
    const fallbackReminders = getFallbackTimeReminders_(hour);
    reminders.push(...fallbackReminders);
  }
  
  return reminders.join("\n");
}

/**
 * Get medicine reminders from Google Sheets based on time
 */
function getMedicineReminders_(sheet, clientID, timeOfDay, currentHour) {
  try {
    const medicineSheet = sheet.getSheetByName(SHEET_NAMES.LÄÄKKEET);
    if (!medicineSheet) {
      console.log("No 'Lääkkeet' sheet found - using fallback");
      return getFallbackMedicineReminders_(currentHour);
    }
    
    const data = medicineSheet.getDataRange().getValues();
    const reminders = [];
    
    const addedReminders = new Set(); // Duplikaattien esto
    
    for (let i = 1; i < data.length; i++) {
      const reminderClientID = String(data[i][0]).trim().toLowerCase(); // A: ClientID
      const medicineTime = String(data[i][1]).trim(); // B: Aika (AAMU/PÄIVÄ/ILTA/YÖ)
      const specificTime = String(data[i][2]).trim(); // C: Kellonaika (klo 8:00)
      const medicineDescription = String(data[i][3]).trim(); // D: Lääke (yleisnimi)
      
      // Ohita tyhjät rivit
      if (!reminderClientID || !medicineTime || !medicineDescription) {
        continue;
      }
      
      if (reminderClientID === clientID.toLowerCase() && 
          medicineTime.toUpperCase() === timeOfDay.toUpperCase()) {
        
        // LÄÄKEDIREKTIIVIN MUKAISUUS: Käytetään vain yleisiä kuvauksia
        let reminder = `💊 ${medicineDescription || 'Muista ottaa lääke'}`;
        if (specificTime) reminder += ` ${specificTime}`;
        
        // Tarkista duplikaatit ennen lisäämistä
        const reminderKey = `${medicineDescription}-${specificTime}`;
        if (!addedReminders.has(reminderKey)) {
          addedReminders.add(reminderKey);
          reminders.push(reminder);
          console.log(`✅ Added unique medicine reminder: ${reminder}`);
        } else {
          console.log(`⚠️ Skipped duplicate medicine reminder: ${reminder}`);
        }
      }
    }
    
    return reminders;
    
  } catch (error) {
    console.error("Error getting medicine reminders:", error.toString());
    return getFallbackMedicineReminders_(currentHour);
  }
}

/**
 * Get food reminders from Google Sheets based on time
 */
function getFoodReminders_(sheet, clientID, timeOfDay, currentHour) {
  try {
    const foodSheet = sheet.getSheetByName(SHEET_NAMES.RUOKA_AJAT);
    if (!foodSheet) {
      console.log("No 'Ruoka-ajat' sheet found - using fallback");
      return getFallbackFoodReminders_(currentHour);
    }
    
    const data = foodSheet.getDataRange().getValues();
    const reminders = [];
    
    console.log(`🍽️ Haetaan ruoka-aikoja asiakkaalle: ${clientID}, aika: ${timeOfDay}`);
    
    for (let i = 1; i < data.length; i++) {
      // Skip empty rows
      if (!data[i][0] || !data[i][1] || !data[i][2]) continue;
      
      const reminderClientID = String(data[i][0]).trim().toLowerCase();
      const mealTime = String(data[i][1]).trim(); // AAMU/PÄIVÄ/ILTA/YÖ
      const mealType = String(data[i][2]).trim(); // Aamupala/Lounas/Päivällinen/Pieni ilta  
      const mealClock = String(data[i][3] || '').trim(); // 08:00, 12:00, 18:00
      const suggestion = String(data[i][4] || '').trim(); // Valinnainen ehdotus
      
      console.log(`📋 Rivi ${i}: ClientID="${reminderClientID}", Aika="${mealTime}", Ateria="${mealType}", Kello="${mealClock}", Ehdotus="${suggestion}"`);
      
      console.log(`📋 Tarkistetaan: ${reminderClientID} vs ${clientID.toLowerCase()}, ${mealTime} vs ${timeOfDay}`);
      
      if (reminderClientID === clientID.toLowerCase() && 
          mealTime.toUpperCase() === timeOfDay.toUpperCase()) {
        
        // Rakenna ruokamuistutus: Ateria + kellonaika + (valinnainen ehdotus)
        let reminder = getFoodEmoji_(mealType) + " " + mealType;
        if (mealClock) reminder += ` ${mealClock}`;
        if (suggestion) reminder += ` - ${suggestion}`;
        
        console.log(`✅ Lisätään ruokamuistutus: "${reminder}"`);
        reminders.push(reminder);
      }
    }
    
    console.log(`🍽️ Löydettiin ${reminders.length} ruokamuistutusta asiakkaalle ${clientID}`);
    return reminders;
    
  } catch (error) {
    console.error("Error getting food reminders:", error.toString());
    return getFallbackFoodReminders_(currentHour);
  }
}

/**
 * Get time-based medicine message (lääkedirektiivin mukainen)
 */
function getTimeBasedMedicineMessage_(timeOfDay) {
  switch (timeOfDay.toUpperCase()) {
    case "AAMU":
      return "Muista ottaa aamun lääke";
    case "PÄIVÄ":
      return "Muista ottaa päivän lääke";
    case "ILTA":
      return "Muista ottaa illan lääke";
    case "YÖ":
      return "Muista ottaa illan lääke";
    default:
      return "Muista ottaa lääke";
  }
}

/**
 * Get appropriate food emoji based on meal type
 */
function getFoodEmoji_(mealType) {
  const type = mealType.toUpperCase();
  if (type.includes("AAMUPALA")) return "🍳";
  if (type.includes("LOUNAS")) return "🍽️";
  if (type.includes("PÄIVÄLLINEN")) return "🍽️";
  if (type.includes("ILTAPALA")) return "🍽️";
  return "🍽️";
}

/**
 * Fallback medicine reminders if sheets not available
 * Support for morning, midday, and evening medicines
 */
function getFallbackMedicineReminders_(hour) {
  const reminders = [];
  
  // LÄÄKEDIREKTIIVIN VAATIMUS: Ei saa mainita lääkkeiden nimiä, vain yleinen muistutus
  
  // Morning medicines (6-10)
  if (hour >= 6 && hour < 10) {
    reminders.push("💊 Muista ottaa aamun lääke");
  }
  // Midday medicines (10-15) - less common but possible
  else if (hour >= 10 && hour < 15) {
    // Only show if it's lunch time and someone might need medicine with food
    if (hour >= 11 && hour <= 14) {
      reminders.push("💊 Muista ottaa päivän lääke (jos määrätty)");
    }
  }
  // Afternoon medicines (15-19) - rare but possible
  else if (hour >= 15 && hour < 19) {
    // Only show if it's late afternoon
    if (hour >= 17 && hour <= 18) {
      reminders.push("💊 Muista ottaa illan lääke (jos määrätty)");
    }
  }
  // Evening medicines (19-6) - most common after morning
  else if (hour >= 19 && hour <= 21) {
    reminders.push("💊 Muista ottaa illan lääke");
  }
  
  return reminders;
}

/**
 * Fallback food reminders if sheets not available  
 */
function getFallbackFoodReminders_(hour) {
  if (hour >= 6 && hour < 10) {
    return ["🍳 Muista hyvä aamupala ja ☕"];
  } else if (hour >= 11 && hour <= 13) {
    return ["🍽️ Lounas olisi hyvä ottaa pian"];
  } else if (hour >= 16 && hour <= 18) {
    return ["🍽️ Päivällinen kohta valmiina?"];
  } else if (hour >= 19 && hour <= 21) {
    return ["🍽️ Iltapala jos tekee mieli"];
  }
  return [];
}

/**
 * Combined fallback reminders
 */
function getFallbackTimeReminders_(hour) {
  const food = getFallbackFoodReminders_(hour);
  const medicine = getFallbackMedicineReminders_(hour);
  return [...food, ...medicine];
}

/**
 * TEST FUNCTION: Generate sample contextual reminder
 */
function testContextualReminder() {
  try {
    console.log("=== TESTING CONTEXTUAL REMINDER ===");
    
    // Simulate different times of day - test all medicine times
    const testTimes = [
      { hour: 8, name: "AAMU" },
      { hour: 12, name: "PÄIVÄ (lounasaika)" }, 
      { hour: 17, name: "ILTA (iltapäivä)" },
      { hour: 21, name: "YÖ (iltalääkkeet)" }
    ];
    
    testTimes.forEach(time => {
      console.log(`\n--- ${time.name} (${time.hour}:00) ---`);
      
      // Mock current time
      const originalNow = Date.now;
      Date.now = () => {
        const mockDate = new Date();
        mockDate.setHours(time.hour, 0, 0, 0);
        return mockDate.getTime();
      };
      
      const greeting = getTimeBasedGreeting_();
      const weatherActivity = getWeatherBasedActivity_({
        description: time.hour < 16 ? "aurinkoinen" : "sateinen",
        temperature: "15°C"
      });
      const timeReminders = getFallbackTimeReminders_(time.hour);
      
      console.log("Tervehdys:", greeting);
      console.log("Sääaktiviteetti:", weatherActivity);
      console.log("Aika-muistutukset:", timeReminders);
      
      const fullMessage = [greeting, weatherActivity, ...(Array.isArray(timeReminders) ? timeReminders : [timeReminders])]
        .filter(part => part && String(part).trim())
        .join("\n");
      
      console.log("KOKO VIESTI:\n" + fullMessage);
      
      // Restore original Date.now
      Date.now = originalNow;
    });
    
    console.log("=== TEST COMPLETED ===");
    return "Testit suoritettu onnistuneesti!";
    
  } catch (error) {
    console.error("Test error:", error.toString());
    return "Testi epäonnistui: " + error.toString();
  }
}

/**
 * TEST FUNCTION: Test medicine message generation
 */
function testMedicineMessages() {
  try {
    console.log("=== TESTING MEDICINE MESSAGES ===");
    
    const times = ["AAMU", "PÄIVÄ", "ILTA", "YÖ"];
    
    times.forEach(time => {
      console.log(`\n--- ${time} ---`);
      
      // Test LÄÄKE type (ei näy nimeä)
      const medicineMessage = getTimeBasedMedicineMessage_(time);
      console.log(`LÄÄKE: ${medicineMessage}`);
      
      // Test RAVINTOLISÄ type (nimi näkyy)
      const supplementExample = time === "AAMU" ? "Magnesium 2 tablettia" : 
                               time === "PÄIVÄ" ? "Vitamiini D 1 kapseli" :
                               time === "ILTA" ? "Omega-3 1 kapseli" :
                               "Melatoniini 1 tabletti";
      console.log(`RAVINTOLISÄ: 💊 ${supplementExample}`);
    });
    
    console.log("\n=== FALLBACK MEDICINE TESTS ===");
    const testHours = [8, 12, 17, 21];
    testHours.forEach(hour => {
      const fallbacks = getFallbackMedicineReminders_(hour);
      console.log(`Klo ${hour}:00 → ${fallbacks.join(", ")}`);
    });
    
    console.log("=== MEDICINE TESTS COMPLETED ===");
    return "Lääketestit suoritettu onnistuneesti!";
    
  } catch (error) {
    console.error("Medicine test error:", error.toString());
    return "Lääketesti epäonnistui: " + error.toString();
  }
}

/**
 * Get smart important message based on date logic
 * Shows message 2 days before event, hides day after
 */
function getImportantMessage_(sheet) {
  try {
    const messagesSheet = sheet.getSheetByName(SHEET_NAMES.VIESTIT);
    if (!messagesSheet) {
      console.log("No 'Viestit' sheet found");
      return "";
    }
    
    const data = messagesSheet.getDataRange().getValues();
    if (data.length <= 1) {
      console.log("No messages in 'Viestit' sheet");
      return "";
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    const activeMessages = [];
    
    // Process each message (skip header row)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const eventDate = parseEventDate_(row[0]); // Column A: Date
      const message = String(row[1]).trim();     // Column B: Message
      const priority = row[2] || 1;              // Column C: Priority (1=highest)
      const showDaysBefore = row[3] || 2;        // Column D: Days before to show (default 2)
      const showDaysAfter = row[4] || 0;         // Column E: Days after to show (default 0)
      const eventTime = String(row[5] || "").trim(); // Column F: Time (optional)
      
      if (!eventDate || !message) {
        continue; // Skip invalid rows
      }
      
      // Calculate date range when message should be visible
      const startShowDate = new Date(eventDate);
      startShowDate.setDate(eventDate.getDate() - showDaysBefore);
      
      const endShowDate = new Date(eventDate);
      endShowDate.setDate(eventDate.getDate() + showDaysAfter);
      
      // Calculate days until event first
      const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
      
      // Check if today is within the show range OR it's evening before the event
      const now = new Date();
      const isEveningBefore = (now.getHours() >= 18) && (daysUntilEvent === 1);
      
      const shouldShow = (today >= startShowDate && today <= endShowDate) || isEveningBefore;
      
      if (shouldShow) {
        
        // Create full datetime with SUOMI timezone
        let fullEventDate = new Date(eventDate);
        
        // Aseta Suomi-aika (UTC+2/UTC+3 riippuen kesäajasta)
        // Luodaan uusi Date-objekti Suomi-ajassa
        const finnishDate = new Date(eventDate.getTime());
        
        if (eventTime && eventTime.includes(':')) {
          try {
            const [hours, minutes] = eventTime.split(':').map(x => parseInt(x) || 0);
            if (!isNaN(hours) && !isNaN(minutes)) {
              // Aseta Suomi-aika
              finnishDate.setHours(hours, minutes, 0, 0);
              fullEventDate = finnishDate;
            }
          } catch (timeError) {
            console.error("Error parsing time:", eventTime, timeError);
          }
} else {
          // Jos ei kellonaikaa, käytä päivämäärää Suomi-ajassa
          fullEventDate = finnishDate;
        }
        
        console.log(`🕐 Event date: ${eventDate}, Time: ${eventTime}, Full: ${fullEventDate}`);
        
        activeMessages.push({
          message: message,
          eventDate: fullEventDate,
          priority: priority,
          daysUntilEvent: daysUntilEvent,
          isToday: daysUntilEvent === 0,
          isPast: daysUntilEvent < 0
        });
      }
    }
    
    if (activeMessages.length === 0) {
      return "";
    }
    
    // Sort by priority (lower number = higher priority), then by days until event
    activeMessages.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.daysUntilEvent - b.daysUntilEvent;
    });
    
    // Return the highest priority message with timing info
    const topMessage = activeMessages[0];
    return formatImportantMessage_(topMessage);
    
  } catch (error) {
    console.error("Error getting important message:", error.toString());
    return "";
  }
}

/**
 * Parse event date from various formats
 */
function parseEventDate_(dateInput) {
  if (!dateInput) return null;
  
  try {
    // If it's already a Date object
    if (dateInput instanceof Date) {
      return dateInput;
    }
    
    // If it's a string, try to parse
    const dateStr = String(dateInput).trim();
    if (!dateStr) return null;
    
    // Try different date formats
    let eventDate;
    
    // Format: 2024-01-15 or 15.01.2024 or 15/1/2024
    if (dateStr.includes('-') || dateStr.includes('.') || dateStr.includes('/')) {
      eventDate = new Date(dateStr);
    } else {
      // If just a number, might be Excel date
      const excelDate = parseFloat(dateStr);
      if (!isNaN(excelDate) && excelDate > 40000) { // Reasonable Excel date range
        eventDate = new Date((excelDate - 25569) * 86400 * 1000);
      } else {
        eventDate = new Date(dateStr);
      }
    }
    
    // Validate the date
    if (isNaN(eventDate.getTime())) {
      console.log(`Invalid date format: ${dateStr}`);
        return null;
    }
    
    // KORJATTU: Ei nollata kellonaikaa, säilytetään alkuperäinen
    console.log(`📅 Parsed event date: ${dateInput} → ${eventDate}`);
    return eventDate;
    
} catch (error) {
    console.error(`Error parsing date: ${dateInput}`, error);
    return null;
  }
}

/**
 * Format message with timing information
 */
function formatImportantMessage_(messageObj) {
  const { message, daysUntilEvent, isToday, isPast, eventDate } = messageObj;
  
  // Split message at dash to separate main message from activity
  const { mainMessage } = splitMessageAndActivity_(message);
  
  // Format date as Finnish: d.m.yyyy h:mm
  const formatFinnishDateTime = (date) => {
    try {
      if (!date || isNaN(date.getTime())) {
        console.error("Invalid date object:", date);
        return "";
      }
      
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      // If time is 00:00, just show date
      if (hours === "00" && minutes === "00") {
        return `${day}.${month}.${year}`;
      }
      
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return "";
    }
  };
  
  const formattedDate = formatFinnishDateTime(eventDate);
  
  if (isToday) {
    return `🔔 TÄNÄÄN: ${mainMessage} ${formattedDate}`;
  } else if (isPast) {
    return `📋 ${mainMessage} (oli ${Math.abs(daysUntilEvent)} päivää sitten)`;
  } else if (daysUntilEvent === 1) {
    // Check if it's evening - show different message
    const now = new Date();
    if (now.getHours() >= 18) {
      return `🌆 HUOMENNA ILTAAN: ${mainMessage} ${formattedDate}`;
    } else {
      return `⚠️ HUOMENNA: ${mainMessage} ${formattedDate}`;
    }
  } else {
    return `📅 ${daysUntilEvent} PÄIVÄN PÄÄSTÄ: ${mainMessage} ${formattedDate}`;
  }
}

/**
 * Get upcoming appointments for client
 */
function getUpcomingAppointments_(sheet, clientID) {
  try {
    const appointmentsSheet = sheet.getSheetByName(SHEET_NAMES.TAPAAMISET);
    if (!appointmentsSheet) {
      return [];
    }
    
    const data = appointmentsSheet.getDataRange().getValues();
    const appointments = [];
    const today = new Date();
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    for (let i = 1; i < data.length; i++) {
      const eventClientID = String(data[i][0]).trim().toLowerCase();
      const eventTitle = String(data[i][1]).trim();
      const eventDate = new Date(data[i][2]);
      const eventTime = String(data[i][3]).trim();
      
      if (eventClientID === clientID.toLowerCase() && eventDate >= today && eventDate <= oneWeekFromNow) {
        appointments.push({
          title: eventTitle,
          date: Utilities.formatDate(eventDate, HELSINKI_TIMEZONE, "dd.MM.yyyy"),
          time: eventTime
        });
      }
    }
    
    return appointments.sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.error("Error getting upcoming appointments:", error.toString());
    return [];
  }
}

// ===================================================================================
//  WEATHER SERVICE FUNCTIONS
// ===================================================================================

/**
 * Get weather data with caching optimization
 */
function getWeatherDataOptimized_(weatherApiKey, clientID) {
  // 🗑️ CACHE POISTETTU - Säätieto haetaan aina suoraan
  // Frontend päivittää säätiedot 4x päivässä, ei tarvita server-side cachea
  console.log(`Fetching fresh weather data for ${clientID} (no cache)`);
  return getWeatherData_(weatherApiKey);
}

/**
 * Core weather API function
 */
function getWeatherData_(weatherApiKey) {
  const weatherUrl = `${WEATHER_API_BASE}?q=Helsinki&units=metric&lang=fi&appid=${weatherApiKey}`;
  let defaultResult = {
    description: "Säätietoja ei saatu.",
    temperature: "N/A",
    isRaining: false,
    isSnowing: false,
    isCold: true,
    isVeryCold: true,
    isGoodForOutdoor: false,
    temp: 0
};
  
  try {
    const response = UrlFetchApp.fetch(weatherUrl, { muteHttpExceptions: true });
    if (response.getResponseCode() == 200) {
      const weatherData = JSON.parse(response.getContentText());
      const temp = weatherData.main.temp;
      const description = weatherData.weather[0].description.toLowerCase();
      const mainWeather = weatherData.weather[0].main.toLowerCase();
      
      const isRaining = mainWeather === "rain" || description.includes("sade") || description.includes("shower");
      const isSnowing = mainWeather === "snow" || description.includes("lumi");
      const isCold = temp < 5;
      const isVeryCold = temp < 0;
      const isGoodForOutdoor = !isRaining && !isSnowing && temp >= 5;
      
      let weatherMessage;
      if (isRaining) {
        weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Sisäpuolella on mukavampaa! ${EMOJIS.RAINY}`;
      } else if (isSnowing) {
        weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Ulkona on kaunista mutta kylmää! ${EMOJIS.SNOWY}`;
      } else if (isGoodForOutdoor) {
        weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Loistava päivä ulkoiluun! ${EMOJIS.SUNNY}`;
      } else if (isCold) {
        weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Pukeudu lämpimästi jos menet ulos! 🧥`;
      } else {
        weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C.`;
      }
      
      return {
        description: weatherMessage,
        temperature: `${temp.toFixed(0)}°C`,
        isRaining: isRaining,
        isSnowing: isSnowing,
        isCold: isCold,
        isVeryCold: isVeryCold,
        isGoodForOutdoor: isGoodForOutdoor,
        temp: temp
      };
    }
    return defaultResult;
} catch (e) {
    console.error("Error fetching weather: " + e);
    return defaultResult;
  }
}

// ===================================================================================
//  PHOTO FUNCTIONS
// ===================================================================================

/**
 * Get daily photo URL from Google Photos
 */
function getDailyPhotoUrl_() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const albumId = scriptProperties.getProperty(GOOGLE_PHOTOS_ALBUM_ID_KEY);
    
    if (!albumId) {
      console.log("Google Photos Album ID not configured");
      return "";
    }
    
    return "";
  } catch (error) {
    console.error("Error getting daily photo:", error.toString());
    return "";
  }
}

/**
 * Get daily photo caption
 */
function getDailyPhotoCaption_() {
  const today = new Date();
  const dayName = today.toLocaleDateString('fi-FI', { weekday: 'long' });
  const date = today.toLocaleDateString('fi-FI');
  
  return `Päivän kuva - ${dayName} ${date}`;
}

// ===================================================================================
//  TEST FUNCTIONS
// ===================================================================================

/**
 * Test Telegram message sending
 */
function testTelegramMessage() {
  console.log("=== Testing Telegram Message ===");
  
  const scriptProperties = PropertiesService.getScriptProperties();
  const telegramToken = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY);
  
  if (!telegramToken) {
    console.error("❌ TELEGRAM_BOT_TOKEN not configured");
    return;
  }
  
  const testMessage = "Tämä on testimuistuttaja ReminderApp:sta. Aika: " + new Date().toLocaleString('fi-FI');
  const testChatId = "7051402446"; // Petri's chat ID
  
  const success = sendTelegramMessage_(telegramToken, testChatId, testMessage);
  
  if (success) {
    console.log("✅ Telegram test message sent successfully!");
} else {
    console.log("❌ Failed to send Telegram test message");
  }
}

// ===================================================================================
//  SECURITY FUNCTIONS
// ===================================================================================

/**
 * Validate API key for secure access
 */
function validateApiKey_(apiKey) {
  if (!apiKey) {
    console.log("🔐 No API key provided");
    return false;
  }
  
  const scriptProperties = PropertiesService.getScriptProperties();
  const validApiKeys = scriptProperties.getProperty("VALID_API_KEYS");
  
  if (!validApiKeys) {
    console.log("🔐 No valid API keys configured in script properties");
    return false;
  }
  
  const validKeysList = validApiKeys.split(",").map(key => key.trim());
  const isValid = validKeysList.includes(apiKey);
  
  console.log(`🔐 API key validation: ${isValid ? "✅ VALID" : "❌ INVALID"}`);
  return isValid;
}

/**
 * Setup function to configure valid API keys
 * Run this once to set up API keys in Script Properties
 */
function setupApiKeys() {
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // Development and production API keys
  const apiKeys = [
    "dev-key-123",              // Development key
    "prod-key-2024-secure",     // Production key
    "emergency-key-backup"      // Emergency backup key
  ];
  
  scriptProperties.setProperty("VALID_API_KEYS", apiKeys.join(","));
  
  console.log("✅ API keys configured successfully");
  console.log("Valid API keys:", apiKeys);
}

// ===================================================================================
//  TEST AND SETUP FUNCTIONS  
// ===================================================================================

/**
 * Create test Viestit sheet with example messages
 */
function createTestViestit() {
  try {
  const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty("SHEET_ID");
    
    if (!sheetId) {
      console.error("❌ SHEET_ID not configured");
    return;
    }
    
    const sheet = SpreadsheetApp.openById(sheetId);
    
    // Create or get Viestit sheet
    let viestiteSheet = sheet.getSheetByName(SHEET_NAMES.VIESTIT);
    if (!viestiteSheet) {
      viestiteSheet = sheet.insertSheet(SHEET_NAMES.VIESTIT);
      console.log("✅ Created new 'Viestit' sheet");
    } else {
      console.log("📋 Found existing 'Viestit' sheet");
    }
    
    // Clear existing content
    viestiteSheet.clear();
  
    // Headers
    const headers = [["Päivämäärä", "Viesti", "Prioriteetti", "Päiviä ennen", "Päiviä jälkeen", "Kellonaika"]];
    
    // Create test dates - KORJATTU: Käytetään tarkkoja päivämääriä
    const tomorrow = new Date(2025, 7, 5); // 5.8.2025 (month is 0-indexed)
    const dayAfter = new Date(2025, 7, 6); // 6.8.2025
    const nextWeek = new Date(2025, 7, 11); // 11.8.2025
    
    console.log(`📅 Creating test dates: Tomorrow=${tomorrow}, DayAfter=${dayAfter}, NextWeek=${nextWeek}`);
    
    // Test data
    const testData = [
      [tomorrow, "Lääkäri aika - Muista lääkekortit", 1, 1, 0, "14:00"],
      [dayAfter, "Perhe tulee käymään", 2, 2, 0, "16:00"],
      [nextWeek, "Hiusten leikkaus", 3, 3, 1, "10:00"]
    ];
    
    // Write all data
    const allData = headers.concat(testData);
    const range = viestiteSheet.getRange(1, 1, allData.length, allData[0].length);
    range.setValues(allData);
    
    // Format headers
    const headerRange = viestiteSheet.getRange(1, 1, 1, headers[0].length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#E8F0FE");
    
    // Auto-resize columns
    viestiteSheet.autoResizeColumns(1, headers[0].length);
    
    console.log("✅ Test Viestit sheet created with sample data");
    console.log(`📅 Tomorrow: ${tomorrow.toLocaleDateString()}`);
    console.log(`📅 Day after: ${dayAfter.toLocaleDateString()}`);
    console.log(`📅 Next week: ${nextWeek.toLocaleDateString()}`);
    
  } catch (error) {
    console.error("❌ Error creating test Viestit:", error);
  }
}

/**
 * Test important message functionality
 */
function testImportantMessage() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty("SHEET_ID");
    
    if (!sheetId) {
      console.error("❌ SHEET_ID not configured");
      return;
    }
    
    const sheet = SpreadsheetApp.openById(sheetId);
    const message = getImportantMessage_(sheet);
    
    console.log("=== IMPORTANT MESSAGE TEST ===");
    console.log(`📅 Today: ${new Date().toLocaleDateString()}`);
    console.log(`🎯 Active message: "${message}"`);
    
    if (message) {
      console.log("✅ Message system working!");
} else {
      console.log("ℹ️ No active messages for today");
}
    
} catch (error) {
    console.error("❌ Error testing important message:", error);
  }
}

/**
 * Enhanced photo selection with configurable rotation
 */
function getDailyPhoto_(sheet, clientID) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const albumId = scriptProperties.getProperty(GOOGLE_PHOTOS_ALBUM_ID_KEY);
    
    // Get rotation settings
    const rotationSettings = getPhotoRotationSettings_(sheet, clientID);
    
    // Method 1: Try Google Photos (photos.google.com)
    if (albumId && albumId !== "YOUR_GOOGLE_PHOTOS_ALBUM_ID_HERE") {
      
      // Check if it's a Google Photos URL/ID
      if (albumId.includes('photos.google.com') || albumId.includes('photos.app.goo.gl')) {
        console.log("Attempting Google Photos integration...");
        const googlePhoto = getGooglePhotosAlbumImage_(albumId, clientID, rotationSettings);
        if (googlePhoto.url) {
          return googlePhoto;
        }
        console.log("Google Photos failed, trying Google Drive method...");
      }
      
      // Method 2: Try Google Drive folder (drive.google.com)
      const drivePhoto = getGooglePhotosImage_(albumId, clientID, rotationSettings);
      if (drivePhoto.url) {
        console.log(`Using Google Drive for ${clientID}: ${drivePhoto.caption}`);
        return drivePhoto;
      }
    }
    
    // Method 3: Fallback to Google Sheets Photos tab
    const photoSheet = sheet.getSheetByName("Photos");
    if (!photoSheet) return {url: "", caption: "Ei kuvia saatavilla"};
    
    const photos = photoSheet.getDataRange().getValues()
                             .filter((row, index) => index > 0 && row[0] === clientID);
    
    if (photos.length === 0) return {url: "", caption: "Ei kuvia saatavilla"};
    
    // Enhanced photo selection logic
    const photoIndex = calculatePhotoIndex_(photos.length, rotationSettings);
    
    return {
      url: photos[photoIndex][1],
      caption: photos[photoIndex][2] || "Kuva äidille",
      rotationInfo: `${rotationSettings.rotationInterval} rotation, photo ${photoIndex + 1}/${photos.length}`
    };
    
  } catch (error) {
    console.log('Error getting photo:', error.toString());
    return {url: "", caption: "Kuvia ei voitu hakea"};
  }
}

/**
 * Add test photo to Photos sheet
 */
function addTestPhoto() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty("SHEET_ID");
    
    if (!sheetId) {
      console.error("❌ SHEET_ID not configured");
      return;
    }
    
    const sheet = SpreadsheetApp.openById(sheetId);
    
    // Create or get Photos sheet
    let photosSheet = sheet.getSheetByName(SHEET_NAMES.KUVAT);
    if (!photosSheet) {
      photosSheet = sheet.insertSheet(SHEET_NAMES.KUVAT);
      
      // Add headers
      const headers = [["ClientID", "URL", "Caption"]];
      photosSheet.getRange(1, 1, 1, 3).setValues(headers);
      photosSheet.getRange(1, 1, 1, 3).setFontWeight("bold");
      console.log("✅ Created new 'Photos' sheet");
    }
    
    // Add multiple test photos for rotation
    const testPhotos = [
      ["mom", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop", "Onnellinen perhe kotona 💕"],
      ["mom", "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop", "Kaunis luontokuva 🌸"],
      ["mom", "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop", "Rauhallinen maisema 🏔️"],
      ["mom", "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop", "Iloisia hetkiä 😊"],
      ["mom", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop", "Mukava sää ulkona ☀️"]
    ];
    
    // Find next empty row and add all photos
    let lastRow = photosSheet.getLastRow();
    
    for (const photo of testPhotos) {
      lastRow++;
      photosSheet.getRange(lastRow, 1, 1, 3).setValues([photo]);
      console.log(`✅ Added photo: ${photo[2]}`);
    }
    
    console.log(`✅ ${testPhotos.length} test photos added to Photos sheet`);
    
} catch (error) {
    console.error("❌ Error adding test photo:", error);
  }
}

/**
 * Test config settings for debugging
 */
function testConfig() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty("SHEET_ID");
    
    if (!sheetId) {
      console.error("❌ SHEET_ID not configured");
      return;
    }
    
    console.log(`📊 Testing config for SHEET_ID: ${sheetId}`);
    
    const sheet = SpreadsheetApp.openById(sheetId);
    const settings = getClientSettings_(sheet, "mom");
    
    console.log("✅ Settings for mom:", JSON.stringify(settings, null, 2));
    
    // Also test photo function
    if (settings.usePhotos) {
      const photo = getDailyPhoto_(sheet, "mom");
      console.log("📸 Daily photo:", JSON.stringify(photo, null, 2));
    }
    
  } catch (error) {
    console.error("❌ Error testing config:", error);
  }
}

/**
 * Test evening before functionality
 */
function testEveningBefore() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty("SHEET_ID");
    
    if (!sheetId) {
      console.error("❌ SHEET_ID not configured");
      return;
    }
    
    const sheet = SpreadsheetApp.openById(sheetId);
    
    // Simulate evening time (18:00+)
    const now = new Date();
    console.log(`🕕 Current time: ${now.getHours()}:${now.getMinutes()}`);
    console.log(`🌆 Is evening (>=18): ${now.getHours() >= 18}`);
    
    // Test important message
    const importantMessage = getImportantMessage_(sheet);
    console.log(`📅 Important message: "${importantMessage}"`);
    
    if (importantMessage) {
      console.log("✅ Evening before functionality working!");
} else {
      console.log("ℹ️ No messages to show in evening");
    }
    
} catch (error) {
    console.error("❌ Error testing evening before:", error);
}
}

// ===================================================================================
//  ENHANCED PHOTO ROTATION FUNCTIONS
// ===================================================================================

/**
 * Get photo rotation settings for client
 */
function getPhotoRotationSettings_(sheet, clientID) {
  try {
    const configSheet = sheet.getSheetByName("Config");
    if (!configSheet) {
      return { rotationInterval: "daily", randomize: false };
    }
    
    const data = configSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const configClientID = String(data[i][0]).trim().toLowerCase();
      
      if (configClientID === clientID.toLowerCase()) {
        const intervalValue = data[i][7];
        const randomizeValue = data[i][8];
        
        return {
          rotationInterval: intervalValue ? String(intervalValue).trim() : "daily", // Column H: daily, weekly, monthly
          randomize: randomizeValue === true || String(randomizeValue).toLowerCase() === 'true'
        };
      }
    }
    
    return { rotationInterval: "daily", randomize: false };
  } catch (error) {
    console.error("Error getting photo rotation settings:", error);
    return { rotationInterval: "daily", randomize: false };
  }
}

/**
 * Calculate photo index based on rotation settings
 */
function calculatePhotoIndex_(photoCount, rotationSettings) {
  const now = new Date();
  let intervalValue;
  
  // Ensure rotationInterval is a valid string
  const rotationInterval = (rotationSettings && rotationSettings.rotationInterval) 
    ? String(rotationSettings.rotationInterval).toLowerCase() 
    : "daily";
  
  switch (rotationInterval) {
    case "hourly":
      // Change every hour
      intervalValue = Math.floor(now.getTime() / (1000 * 60 * 60));
      break;
      
    case "daily":
      // Change every day (current implementation)
      intervalValue = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      break;
      
    case "weekly":
      // Change every week (Monday = start of week)
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const weekNumber = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24 * 7));
      intervalValue = weekNumber;
      break;
      
    case "monthly":
      // Change every month
      intervalValue = now.getMonth() + (now.getFullYear() * 12);
      break;
      
    case "random_daily":
      // Random photo each day, but same photo for entire day
      const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      // Use dayOfYear as seed for consistent daily randomness
      intervalValue = deterministicRandom_(dayOfYear + now.getFullYear(), photoCount);
      return intervalValue;
      
    default:
      // Default to daily
      intervalValue = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  }
  
  // Apply randomization if enabled
  const randomize = rotationSettings && rotationSettings.randomize;
  if (randomize) {
    return deterministicRandom_(intervalValue, photoCount);
  }
  
  // Sequential rotation
  return intervalValue % photoCount;
}

/**
 * Deterministic random number generator for consistent daily randomness
 */
function deterministicRandom_(seed, max) {
  // Simple linear congruential generator
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);
  
  const random = ((a * seed + c) % m) / m;
  return Math.floor(random * max);
}

/**
 * Get photo metadata for debugging
 */
function getPhotoRotationDebugInfo_(clientID, sheet) {
  try {
    const rotationSettings = getPhotoRotationSettings_(sheet, clientID);
    const photoSheet = sheet.getSheetByName("Photos");
    
    if (!photoSheet) {
      return "No Photos sheet found";
    }
    
    const photos = photoSheet.getDataRange().getValues()
                             .filter((row, index) => index > 0 && row[0] === clientID);
    
    const photoIndex = calculatePhotoIndex_(photos.length, rotationSettings);
    const now = new Date();
    
    return {
      clientID: clientID,
      totalPhotos: photos.length,
      currentIndex: photoIndex,
      currentPhoto: photos[photoIndex] ? photos[photoIndex][1] : "N/A",
      rotationInterval: rotationSettings.rotationInterval,
      randomize: rotationSettings.randomize,
      nextChangeTime: getNextChangeTime_(rotationSettings.rotationInterval),
      debugTime: now.toISOString()
    };
    
  } catch (error) {
    return `Debug error: ${error.toString()}`;
  }
}

/**
 * Calculate when photo will next change
 */
function getNextChangeTime_(interval) {
  const now = new Date();
  
  switch (interval.toLowerCase()) {
    case "hourly":
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);
      return nextHour.toISOString();
      
    case "daily":
      const nextDay = new Date(now);
      nextDay.setDate(now.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);
      return nextDay.toISOString();
      
    case "weekly":
      const nextWeek = new Date(now);
      const daysUntilMonday = (7 - now.getDay() + 1) % 7 || 7;
      nextWeek.setDate(now.getDate() + daysUntilMonday);
      nextWeek.setHours(0, 0, 0, 0);
      return nextWeek.toISOString();
      
    case "monthly":
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return nextMonth.toISOString();
      
    default:
      return "Unknown interval";
  }
}

// ===================================================================================
//  GOOGLE DRIVE/PHOTOS INTEGRATION FUNCTIONS
// ===================================================================================

/**
 * Get image from Google Photos album (fallback implementation)
 */
function getGooglePhotosAlbumImage_(albumId, clientID, rotationSettings) {
  try {
    console.log("getGooglePhotosAlbumImage_ - not yet implemented");
    return { url: "", caption: "Google Photos integration not yet available" };
  } catch (error) {
    console.error("Error getting Google Photos album image:", error);
    return { url: "", caption: "Google Photos virhe" };
  }
}

/**
 * Get image from Google Drive folder  
 */
function getGooglePhotosImage_(folderId, clientID, rotationSettings) {
  try {
    // Simple fallback for now
    console.log(`getGooglePhotosImage_ called for folder: ${folderId}`);
    return { url: "", caption: "Google Drive integration not yet configured" };
  } catch (error) {
    console.error("Error getting Google Drive image:", error);
    return { url: "", caption: "Google Drive virhe" };
  }
}

// ===================================================================================
//  CLIENT-SPECIFIC SHEET MANAGEMENT
// ===================================================================================

/**
 * Get Sheet ID for specific client, with fallback to default
 */
function getClientSheetId_(clientID, scriptProperties = null) {
  if (!scriptProperties) {
    scriptProperties = PropertiesService.getScriptProperties();
  }
  
  // Try client-specific Sheet ID first
  const clientSheetIdKey = `SHEET_ID_${clientID.toLowerCase()}`;
  let sheetId = scriptProperties.getProperty(clientSheetIdKey);
  
  if (sheetId) {
    console.log(`Using client-specific Sheet ID for ${clientID}: ${clientSheetIdKey}`);
    return sheetId;
  }
  
  // Fallback to default Sheet ID
  sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
  if (sheetId) {
    console.log(`Using default Sheet ID for ${clientID}: ${SHEET_ID_KEY}`);
    return sheetId;
  }
  
  console.error(`No Sheet ID found for client: ${clientID}`);
  return null;
}

/**
 * Set up client-specific Sheet ID
 */
function setupClientSheet(clientID, sheetId) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const clientSheetIdKey = `SHEET_ID_${clientID.toLowerCase()}`;
    
    scriptProperties.setProperty(clientSheetIdKey, sheetId);
    
    console.log(`✅ Client Sheet ID configured: ${clientSheetIdKey} = ${sheetId}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error setting up client sheet for ${clientID}:`, error);
    return false;
  }
}

/**
 * List all configured client sheets
 */
function listClientSheets() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const allProperties = scriptProperties.getProperties();
    const clientSheets = {};
    
    Object.keys(allProperties).forEach(key => {
      if (key.startsWith('SHEET_ID_')) {
        const clientID = key.replace('SHEET_ID_', '');
        clientSheets[clientID] = allProperties[key];
      }
    });
    
    console.log('📊 Configured client sheets:', clientSheets);
    return clientSheets;
    
  } catch (error) {
    console.error('Error listing client sheets:', error);
    return {};
  }
}

// ===================================================================================
//  MESSAGE AND ACTIVITY SPLITTING FUNCTIONS
// ===================================================================================

/**
 * Split message at dash to separate main message from activity
 */
function splitMessageAndActivity_(message) {
  if (!message || typeof message !== 'string') {
    return { mainMessage: '', activity: '' };
  }
  
  // Look for dash separator (different types of dashes)
  const dashRegex = /\s*[-–—]\s*/;
  const parts = message.split(dashRegex);
  
  if (parts.length >= 2) {
    return {
      mainMessage: parts[0].trim(),
      activity: parts.slice(1).join(' - ').trim()
    };
  }
  
  // No dash found, return whole message as main message
  return {
    mainMessage: message.trim(),
    activity: ''
  };
}

/**
 * Get activity from current important message
 */
function getActivityFromMessage_(sheet) {
  try {
    const messagesSheet = sheet.getSheetByName(SHEET_NAMES.VIESTIT);
    if (!messagesSheet) {
      return null;
    }
    
    const data = messagesSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return null;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find active messages (same logic as getImportantMessage_ but return activity)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const eventDate = parseEventDate_(row[0]);
      const message = String(row[1]).trim();
      const showDaysBefore = row[3] || 2;
      const showDaysAfter = row[4] || 0;
      
      if (!eventDate || !message) {
        continue;
      }
      
      const startShowDate = new Date(eventDate);
      startShowDate.setDate(eventDate.getDate() - showDaysBefore);
      
      const endShowDate = new Date(eventDate);
      endShowDate.setDate(eventDate.getDate() + showDaysAfter);
      
      if (today >= startShowDate && today <= endShowDate) {
        const { activity } = splitMessageAndActivity_(message);
        if (activity) {
          console.log(`📋 Activity from message: "${activity}"`);
          return activity;
        }
      }
    }
    
    return null;
    
  } catch (error) {
    console.error("Error getting activity from message:", error);
    return null;
  }
}

/**
 * Hae puuhaa ehdotus sään ja ajankohdan mukaan
 */
function getPuuhaaEhdotus_(sheet, clientID, timeOfDay, weather) {
  try {
    console.log(`🎯 Haetaan puuhaa ehdotusta: ${clientID}, ${timeOfDay}, ${weather?.description}`);
    
    const puuhaaSheet = sheet.getSheetByName(SHEET_NAMES.PUUHAA);
    if (!puuhaaSheet) {
      console.log("Ei 'Puuhaa' taulukkoa - käytetään oletusta");
      return getPuuhaaOletus_(timeOfDay, weather);
    }
    
    const data = puuhaaSheet.getDataRange().getValues();
    if (data.length <= 1) {
      console.log("Ei puuhaa rivejä taulukossa");
      return getPuuhaaOletus_(timeOfDay, weather);
    }
    
    const saaKategoria = getSaaKategoria_(weather);
    console.log(`🌤️ Sääkategoria: ${saaKategoria}`);
    
    const sopivat = [];
    
    // Käy läpi kaikki puuhaa vaihtoehdot
    for (let i = 1; i < data.length; i++) {
      const asiakasID = String(data[i][0]).trim().toLowerCase();
      const kategoria = String(data[i][1]).trim(); // ULKO/SISÄ/SOSIAALI
      const saa = String(data[i][2]).trim(); // AURINKO/SADE/KAIKKI
      const ajankohta = String(data[i][3]).trim(); // AAMU,PÄIVÄ,ILTA tai KAIKKI
      const kuvaus = String(data[i][4]).trim();
      const sosiaaliset = String(data[i][5]).trim().toLowerCase() === 'true';
      
      // Tarkista asiakas
      if (asiakasID !== clientID.toLowerCase()) continue;
      
      // Tarkista ajankohta
      const ajankohdatList = ajankohta.split(',').map(a => a.trim().toUpperCase());
      if (!ajankohdatList.includes('KAIKKI') && !ajankohdatList.includes(timeOfDay.toUpperCase())) {
        continue;
      }
      
      // Tarkista sää
      if (saa !== 'KAIKKI' && saa !== saaKategoria) continue;
      
      sopivat.push({
        kategoria: kategoria,
        kuvaus: kuvaus,
        sosiaaliset: sosiaaliset,
        saa: saa,
        ajankohta: ajankohta
      });
    }
    
    if (sopivat.length === 0) {
      console.log("Ei sopivia puuhaa vaihtoehtoja - käytetään oletusta");
      return getPuuhaaOletus_(timeOfDay, weather);
    }
    
    // Valitse satunnainen sopiva vaihtoehto
    const valittu = sopivat[Math.floor(Math.random() * sopivat.length)];
    console.log(`🎲 Valittiin puuhaa: ${valittu.kuvaus}`);
    
    return valittu.kuvaus;
    
  } catch (error) {
    console.error("Virhe puuhaa ehdotuksessa:", error.toString());
    return getPuuhaaOletus_(timeOfDay, weather);
  }
}

/**
 * Määritä sään kategoria
 */
function getSaaKategoria_(weather) {
  if (!weather || !weather.description) return "KAIKKI";
  
  const kuvaus = weather.description.toLowerCase();
  
  for (const [kategoria, kuvaukset] of Object.entries(SAA_KATEGORIAT)) {
    if (kategoria === "KAIKKI") continue;
    
    for (const saaKuvaus of kuvaukset) {
      if (kuvaus.includes(saaKuvaus.toLowerCase())) {
        return kategoria;
      }
    }
  }
  
  return "KAIKKI";
}

/**
 * Oletus puuhaa jos ei löydy taulukosta
 */
function getPuuhaaOletus_(timeOfDay, weather) {
  const isGoodWeather = weather && (weather.temp > 10) && !weather.isRaining && !weather.isSnowing;
  
  switch (timeOfDay.toUpperCase()) {
    case "AAMU":
      return isGoodWeather ? "🚶‍♀️ Aamukävely raikkaassa ilmassa" : "☕ Rauhallinen aamukahvi ikkunan ääressä";
    case "PAIVA":  
      return isGoodWeather ? "🌳 Istuskelua puistossa" : "📚 Hyvän kirjan lukemista";
    case "ILTA":
      return isGoodWeather ? "🌅 Iltakävely auringonlaskussa" : "📞 Mukava puhelu ystävälle";
    case "YO":
      return "🎵 Rauhallista musiikkia ja lepoa";
    default:
      return "😊 Jotain mukavaa pientä";
  }
}

/**
 * Testaa Puuhaa järjestelmää
 */
function testPuuhaaJarjestelma() {
  try {
    console.log("=== 🎯 PUUHAA JÄRJESTELMÄN TESTAUS ===");
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const clientID = "mom";
    
    // Testi eri ajankohtina ja säissä
    const testCases = [
      { timeOfDay: "AAMU", weather: { description: "clear sky", temp: 15, isRaining: false }},
      { timeOfDay: "PAIVA", weather: { description: "light rain", temp: 12, isRaining: true }},
      { timeOfDay: "ILTA", weather: { description: "few clouds", temp: 18, isRaining: false }},
      { timeOfDay: "YO", weather: { description: "overcast clouds", temp: 8, isRaining: false }}
    ];
    
    testCases.forEach(testCase => {
      console.log(`\n--- ${testCase.timeOfDay} (${testCase.weather.description}) ---`);
      
      const saaKategoria = getSaaKategoria_(testCase.weather);
      console.log(`🌤️ Sääkategoria: ${saaKategoria}`);
      
      const ehdotus = getPuuhaaEhdotus_(sheet, clientID, testCase.timeOfDay, testCase.weather);
      console.log(`🎲 Puuhaa ehdotus: "${ehdotus}"`);
    });
    
    console.log("\n=== PUUHAA TESTIT VALMIIT ===");
      return "Puuhaa järjestelmä testattu onnistuneesti!";
  
} catch (error) {
  console.error("Puuhaa testi epäonnistui:", error.toString());
  return "Puuhaa testi epäonnistui: " + error.toString();
}
}

/**
 * Hae SMS tervehdys taulukosta
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