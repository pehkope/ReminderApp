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
        dailyPhotoUrl = getDailyPhotoUrl_();
        dailyPhotoCaption = getDailyPhotoCaption_();
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
      
      if (configClientID === clientID.toLowerCase()) {
        return {
          useTelegram: data[i][5] === true || String(data[i][5]).toLowerCase() === 'true',
          usePhotos: data[i][6] === true || String(data[i][6]).toLowerCase() === 'true'
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
 * Get important message from sheet
 */
function getImportantMessage_(sheet) {
  try {
    const messagesSheet = sheet.getSheetByName("Viestit");
    if (!messagesSheet) {
      return "";
    }
    
    const data = messagesSheet.getDataRange().getValues();
    if (data.length > 1) {
      return String(data[1][0]).trim();
    }
    
    return "";
  } catch (error) {
    console.error("Error getting important message:", error.toString());
    return "";
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