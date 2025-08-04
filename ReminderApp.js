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
  DAILY_TASKS: "Päivittäiset tehtävät",
  CONFIG: "Config",
  ACKNOWLEDGMENTS: "Acknowledgments"
};

const TASK_TYPES = {
  RUOKA: "RUOKA",
  LÄÄKKEET: "LÄÄKKEET",
  AKTIVITEETTI: "AKTIVITEETTI"
};

const TIME_OF_DAY = {
  AAMU: "Aamu",
  PAIVA: "Päivä", 
  ILTA: "Ilta"
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
//  MAIN ENTRY POINTS
// ===================================================================================

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
      return ContentService.createTextOutput(JSON.stringify({
        error: "Unauthorized - Invalid API key",
        status: "UNAUTHORIZED"
      })).setMimeType(ContentService.MimeType.JSON);
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
    
    return ContentService.createTextOutput(JSON.stringify({
      error: "Server error: " + error.toString(),
      timestamp: new Date().toISOString(),
      status: "ERROR"
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle acknowledgment actions
 */
function handleAcknowledgementAction_(e) {
  try {
    console.log("=== ACKNOWLEDGMENT ACTION RECEIVED ===");
    console.log("Full request details:", JSON.stringify(e, null, 2));
    
    // Extract parameters
    const clientID = (e.parameter && e.parameter.clientID) || 'mom';
    const taskType = (e.parameter && e.parameter.taskType) || '';
    const timeOfDay = (e.parameter && e.parameter.timeOfDay) || '';
    const timestamp = (e.parameter && e.parameter.timestamp) || new Date().toISOString();
    
    console.log(`Processing acknowledgment: ${clientID} - ${taskType} (${timeOfDay}) at ${timestamp}`);
    
    if (!taskType || !timeOfDay) {
      console.error("Missing required parameters: taskType or timeOfDay");
      return ContentService.createTextOutput(JSON.stringify({
        error: "Missing taskType or timeOfDay",
        status: "ERROR"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Record acknowledgment in Google Sheets
    const ackSuccess = acknowledgeWeeklyTask_(clientID, taskType, timeOfDay, timestamp);
    
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
    
    return ContentService.createTextOutput(JSON.stringify({
      status: ackSuccess ? "OK" : "ERROR",
      message: ackSuccess ? "Acknowledgment recorded" : "Failed to record acknowledgment",
      clientID: clientID,
      taskType: taskType,
      timeOfDay: timeOfDay,
      timestamp: timestamp
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error("ERROR in handleAcknowledgementAction_:", error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      status: "ERROR"
    })).setMimeType(ContentService.MimeType.JSON);
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
    
    const configSheet = sheet.getSheetByName("Config");
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
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    
    if (!sheetId) {
      console.error("CRITICAL: Google Sheet ID not configured in Script Properties");
      return ContentService.createTextOutput(JSON.stringify({
        error: "Sheet ID not configured",
        clientID: clientID,
        timestamp: new Date().toISOString(),
        status: "ERROR"
      })).setMimeType(ContentService.MimeType.JSON);
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
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error("ERROR in handleDataFetchAction_:", error.toString());
    console.error("Stack trace:", error.stack);
    
    return ContentService.createTextOutput(JSON.stringify({
      error: error.toString(),
      clientID: "unknown",
      timestamp: new Date().toISOString(),
      status: "ERROR"
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Record task acknowledgment in Google Sheets
 */
function acknowledgeWeeklyTask_(clientID, taskType, timeOfDay, timestamp) {
  try {
    console.log(`Recording acknowledgment: ${clientID} - ${taskType} (${timeOfDay}) at ${timestamp}`);
    
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    const sheet = SpreadsheetApp.openById(sheetId);
    
    const ackSheet = getOrCreateSheet_(sheet, "Acknowledgments");
    
    const date = Utilities.formatDate(new Date(timestamp), HELSINKI_TIMEZONE, "yyyy-MM-dd");
    
    // Check if already acknowledged today
    if (isTaskAckedToday_(sheet, taskType, timeOfDay, date)) {
      console.log(`Task ${taskType} (${timeOfDay}) already acknowledged today`);
      return false;
    }
    
    // Add new acknowledgment
    ackSheet.appendRow([
      timestamp,
      clientID,
      taskType,
      timeOfDay,
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
    
    if (sheetName === "Acknowledgments") {
      sheet.getRange(1, 1, 1, 5).setValues([["Timestamp", "ClientID", "TaskType", "TimeOfDay", "Date"]]);
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
  } else {
    return TIME_OF_DAY.ILTA;
  }
}

/**
 * Get daily tasks for a specific client and time of day
 */
function getDailyTasks_(sheet, clientID, timeOfDay) {
  try {
    console.log(`Getting daily tasks for ${clientID} at ${timeOfDay}`);
    
    const tasksSheet = sheet.getSheetByName(SHEET_NAMES.DAILY_TASKS);
    if (!tasksSheet) {
      console.warn("Päivittäiset tehtävät sheet not found");
      return [];
    }
    
    const today = Utilities.formatDate(new Date(), HELSINKI_TIMEZONE, "yyyy-MM-dd");
    
    const data = tasksSheet.getDataRange().getValues();
    const tasks = [];
    
    for (let i = 1; i < data.length; i++) {
      const taskClient = String(data[i][0]).trim().toLowerCase();
      const taskType = String(data[i][1]).trim();
      const taskTimeOfDay = String(data[i][2]).trim();
      const taskDescription = String(data[i][3]).trim();
      
      if (taskClient === clientID.toLowerCase() && taskTimeOfDay === timeOfDay) {
        const isAcked = isTaskAckedToday_(sheet, taskType, timeOfDay, today);
        
        tasks.push({
          type: taskType,
          description: taskDescription,
          timeOfDay: taskTimeOfDay,
          isAckedToday: isAcked,
          acknowledgmentTimestamp: isAcked ? getTaskAckTimestamp_(sheet, taskType, timeOfDay, today) : null
        });
      }
    }
    
    console.log(`Found ${tasks.length} tasks for ${clientID} at ${timeOfDay}`);
    return tasks;
    
  } catch (error) {
    console.error("Error getting daily tasks:", error.toString());
    return [];
  }
}

/**
 * Check if a task has been acknowledged today
 */
function isTaskAckedToday_(sheet, taskType, timeOfDay, today) {
  try {
    const ackSheet = getOrCreateSheet_(sheet, "Acknowledgments");
    const data = ackSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const ackTaskType = String(data[i][2]).trim();
      const ackTimeOfDay = String(data[i][3]).trim();
      const ackDate = String(data[i][4]).trim();
      
      if (ackTaskType === taskType && ackTimeOfDay === timeOfDay && ackDate === today) {
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
    const ackSheet = getOrCreateSheet_(sheet, "Acknowledgments");
    const data = ackSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const ackTaskType = String(data[i][2]).trim();
      const ackTimeOfDay = String(data[i][3]).trim();
      const ackDate = String(data[i][4]).trim();
      
      if (ackTaskType === taskType && ackTimeOfDay === timeOfDay && ackDate === today) {
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
          useTelegram: data[i][5] === true || String(data[i][5]).toLowerCase() === 'true',
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
 * Get latest reminder for client
 */
function getLatestReminder_(sheet, clientID) {
  try {
    const remindersSheet = sheet.getSheetByName("Muistutukset");
    if (!remindersSheet) {
      return "Tervetuloa!";
    }
    
    const data = remindersSheet.getDataRange().getValues();
    let latestReminder = "Tervetuloa!";
    let latestDate = new Date(0);
    
    for (let i = 1; i < data.length; i++) {
      const reminderClientID = String(data[i][0]).trim().toLowerCase();
      const reminderText = String(data[i][1]).trim();
      const reminderDate = new Date(data[i][2]);
      
      if (reminderClientID === clientID.toLowerCase() && reminderDate > latestDate) {
        latestReminder = reminderText;
        latestDate = reminderDate;
      }
    }
    
    return latestReminder;
  } catch (error) {
    console.error("Error getting latest reminder:", error.toString());
    return "Tervetuloa!";
  }
}

/**
 * Get smart important message based on date logic
 * Shows message 2 days before event, hides day after
 */
function getImportantMessage_(sheet) {
  try {
    const messagesSheet = sheet.getSheetByName("Viestit");
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
        
        // Create full datetime if time is provided
        let fullEventDate = new Date(eventDate);
        if (eventTime && eventTime.includes(':')) {
          try {
            const [hours, minutes] = eventTime.split(':').map(x => parseInt(x) || 0);
            if (!isNaN(hours) && !isNaN(minutes)) {
              fullEventDate.setHours(hours, minutes, 0, 0);
            }
          } catch (timeError) {
            console.error("Error parsing time:", eventTime, timeError);
          }
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
    
    // Normalize to start of day
    eventDate.setHours(0, 0, 0, 0);
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
    return `🔔 TÄNÄÄN: ${message} ${formattedDate}`;
  } else if (isPast) {
    return `📋 ${message} (oli ${Math.abs(daysUntilEvent)} päivää sitten)`;
  } else if (daysUntilEvent === 1) {
    // Check if it's evening - show different message
    const now = new Date();
    if (now.getHours() >= 18) {
      return `🌆 HUOMENNA ILTAAN: ${message} ${formattedDate}`;
    } else {
      return `⚠️ HUOMENNA: ${message} ${formattedDate}`;
    }
  } else {
    return `📅 ${daysUntilEvent} PÄIVÄN PÄÄSTÄ: ${message} ${formattedDate}`;
  }
}

/**
 * Get upcoming appointments for client
 */
function getUpcomingAppointments_(sheet, clientID) {
  try {
    const appointmentsSheet = sheet.getSheetByName("Tapahtumat");
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
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  const todayStr = Utilities.formatDate(now, HELSINKI_TIMEZONE, "yyyy-MM-dd");
  const cacheKey = `weather_${clientID}_${todayStr}`;
  
  const isWeatherUpdateTime = (hour === 8 || hour === 12 || hour === 16 || hour === 20) && minute < 10;
  
  try {
    const cachedWeatherStr = PropertiesService.getScriptProperties().getProperty(cacheKey);
    
    if (isWeatherUpdateTime) {
      console.log(`Weather update time detected at ${hour}:${minute}, fetching fresh weather for ${clientID}`);
      const freshWeather = getWeatherData_(weatherApiKey);
      
      PropertiesService.getScriptProperties().setProperty(cacheKey, JSON.stringify(freshWeather));
      console.log(`Weather cached for ${clientID} at ${hour}:${minute}`);
      
      return freshWeather;
    }
    
    if (cachedWeatherStr) {
      console.log(`Using cached weather for ${clientID} at ${hour}:${minute}`);
      return JSON.parse(cachedWeatherStr);
    }
    
    console.log(`No cached weather found for ${clientID}, fetching fresh weather`);
    const freshWeather = getWeatherData_(weatherApiKey);
    PropertiesService.getScriptProperties().setProperty(cacheKey, JSON.stringify(freshWeather));
    
    return freshWeather;
    
  } catch (error) {
    console.error(`Error in weather optimization for ${clientID}: ${error}`);
    return getWeatherData_(weatherApiKey);
  }
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
    let viestiteSheet = sheet.getSheetByName("Viestit");
    if (!viestiteSheet) {
      viestiteSheet = sheet.insertSheet("Viestit");
      console.log("✅ Created new 'Viestit' sheet");
    } else {
      console.log("📋 Found existing 'Viestit' sheet");
    }
    
    // Clear existing content
    viestiteSheet.clear();
    
    // Headers
    const headers = [["Päivämäärä", "Viesti", "Prioriteetti", "Päiviä ennen", "Päiviä jälkeen", "Kellonaika"]];
    
    // Create test dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
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
 * Get rotating daily photo for client
 */
function getDailyPhoto_(sheet, clientID) {
  try {
    const photosSheet = sheet.getSheetByName("Photos");
    if (!photosSheet) {
      console.log("No Photos sheet found");
      return {
        url: "",
        caption: "Kuvat eivät ole vielä käytössä"
      };
    }
    
    const data = photosSheet.getDataRange().getValues();
    const photos = [];
    
    // Collect photos for this client
    for (let i = 1; i < data.length; i++) {
      const photoClientID = String(data[i][0]).trim().toLowerCase();
      const url = String(data[i][1]).trim();
      const caption = String(data[i][2]).trim();
      
      if (photoClientID === clientID.toLowerCase() && url) {
        photos.push({ url, caption });
      }
    }
    
    if (photos.length === 0) {
      return {
        url: "",
        caption: "Ei kuvia saatavilla"
      };
    }
    
    // Rotate based on day of year for consistency
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
    const photoIndex = dayOfYear % photos.length;
    
    console.log(`📸 Selected photo ${photoIndex + 1}/${photos.length} for day ${dayOfYear}`);
    return photos[photoIndex];
    
  } catch (error) {
    console.error("Error getting daily photo:", error);
    return {
      url: "",
      caption: "Virhe kuvan haussa"
    };
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
    let photosSheet = sheet.getSheetByName("Photos");
    if (!photosSheet) {
      photosSheet = sheet.insertSheet("Photos");
      
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