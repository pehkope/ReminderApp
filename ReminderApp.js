// ===================================================================================
//  REMINDERAPP - FINAL CLEAN VERSION FOR GOOGLE APPS SCRIPT
// ===================================================================================

// Configuration constants
const SHEET_ID_KEY = "SHEET_ID";
const TELEGRAM_BOT_TOKEN_KEY = "TELEGRAM_BOT_TOKEN";
const WEATHER_API_KEY_KEY = "Weather_Api_Key";
const TWILIO_FROM_NUMBER_KEY = "Twilio_Phone_Number";
const TWILIO_AUTH_TOKEN_KEY = "Twilio_Auth_Token";
const TWILIO_ACCOUNT_SID_KEY = "Account_SID";
const GOOGLE_PHOTOS_ALBUM_ID_KEY = "Google_Photos_Album_ID";





// ===================================================================================
//  MAIN WEB APP API ENDPOINT - FULL VERSION
// ===================================================================================
function doGet(e) {
  try {
    console.log("doGet called with:", JSON.stringify(e, null, 2));
    
    // --- CHECK FOR ACTION PARAMETER ---
    const action = e.parameter.action;

    if (action === 'acknowledge') {
      // --- HANDLE ACKNOWLEDGEMENT ---
      console.log("Handling 'acknowledge' action.");
      return handleAcknowledgementAction_(e); // REMOVED AWAIT
    // Force redeploy v26
} else {
      // --- HANDLE NORMAL DATA FETCH ---
      console.log("Handling data fetch action.");
      return handleDataFetchAction_(e);
    // Force redeploy v26
}

  // Force redeploy v26
} catch (error) {
    console.error("Critical error in doGet:", error.toString());
    return createJsonResponse({ 
      error: error.toString(),
      stack: error.stack
    // Force redeploy v26
});
  // Force redeploy v26
}
// Force redeploy v26
}

// ===================================================================================
//  ACTION HANDLERS (called by doGet)
// ===================================================================================

/**
 * Handles the action of acknowledging a task.
 * Reads parameters from the URL, saves to sheet, and sends notifications.
 */
function handleAcknowledgementAction_(e) {
    const clientID = e.parameter.clientID;
    const taskType = e.parameter.taskType;
    const timeOfDay = e.parameter.timeOfDay;
    const timestamp = new Date().toISOString();
    
    console.log(`Acknowledgment: ${clientID// Force redeploy v26
} completed ${taskType// Force redeploy v26
} (${timeOfDay// Force redeploy v26
}) at ${timestamp// Force redeploy v26
}`);
    
    const success = acknowledgeWeeklyTask_(clientID, taskType, timeOfDay, timestamp);
    
    if (success) {
      // This is NOT awaited. It runs in the background.
      // The user gets an immediate response.
      sendAcknowledgmentNotifications_(clientID, taskType, timeOfDay, timestamp);

      return createJsonResponse({
        status: "success",
        message: "Task acknowledged successfully",
        taskType: taskType,
        timeOfDay: timeOfDay
      // Force redeploy v26
});
    // Force redeploy v26
} else {
      return createJsonResponse({
        status: "error",
        message: "Failed to acknowledge task in Google Sheets"
      // Force redeploy v26
});
    // Force redeploy v26
}
// Force redeploy v26
}

// ===================================================================================
//  ACKNOWLEDGMENT NOTIFICATIONS TO FAMILY
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
    // Force redeploy v26
}
    console.log("[NOTIFY] Config sheet found.");
    
    let notificationRecipients = [];
    const configData = configSheet.getDataRange().getValues();
    console.log(`[NOTIFY] Found ${configData.length - 1// Force redeploy v26
} potential contacts in Config sheet.`);
    
    for (let i = 1; i < configData.length; i++) {
      const name = String(configData[i][1]).trim();
      
      if (name.toLowerCase().includes('tiitta') || name.toLowerCase().includes('petri')) {
        const phone = String(configData[i][2]).trim();
        const telegramChatID = configData[i][3] ? String(configData[i][3]).trim() : "";
        
        notificationRecipients.push({
          name: name,
          phone: phone, 
          telegramChatID: telegramChatID
        // Force redeploy v26
});
        console.log(`[NOTIFY] Added recipient: ${name// Force redeploy v26
}, Phone: ${phone || 'N/A'// Force redeploy v26
}, Telegram: ${telegramChatID || 'N/A'// Force redeploy v26
}`);
      // Force redeploy v26
}
    // Force redeploy v26
}
    
    if (notificationRecipients.length === 0) {
        console.warn("[NOTIFY] WARNING: No recipients ('Tiitta' or 'Petri') found in Config sheet. Stopping.");
        return;
    // Force redeploy v26
}
    
    const timeStr = new Date(timestamp).toLocaleTimeString('fi-FI', { timeZone: 'Europe/Helsinki', hour: '2-digit', minute: '2-digit' // Force redeploy v26
});
    const taskEmoji = taskType.toLowerCase() === 'ruoka' ? '🍽️' : taskType.toLowerCase() === 'lääkkeet' ? '💊' : '✅';
    const message = `${taskEmoji// Force redeploy v26
} Äiti kuitannut: ${taskType.toUpperCase()// Force redeploy v26
} (${timeOfDay// Force redeploy v26
})\n🕒 Aika: ${timeStr// Force redeploy v26
}`;
    console.log(`[NOTIFY] Prepared message: "${message// Force redeploy v26
}"`);
    
    const telegramToken = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY);
    const twilioFromNumber = scriptProperties.getProperty(TWILIO_FROM_NUMBER_KEY);
    const accountSid = scriptProperties.getProperty(TWILIO_ACCOUNT_SID_KEY);
    const authToken = scriptProperties.getProperty(TWILIO_AUTH_TOKEN_KEY);
    
    for (const recipient of notificationRecipients) {
      console.log(`[NOTIFY] Processing recipient: ${recipient.name// Force redeploy v26
}`);
      let sent = false;
      
      if (telegramToken && recipient.telegramChatID) {
        console.log(`[NOTIFY] Attempting to send Telegram to ${recipient.name// Force redeploy v26
} (Chat ID: ${recipient.telegramChatID// Force redeploy v26
})`);
        const success = sendTelegramMessage_(telegramToken, recipient.telegramChatID, message);
        if(success) {
            console.log(`[NOTIFY] SUCCESS: Telegram sent to ${recipient.name// Force redeploy v26
}.`);
            sent = true;
        // Force redeploy v26
} else {
            console.error(`[NOTIFY] FAILED: Telegram to ${recipient.name// Force redeploy v26
}.`);
        // Force redeploy v26
}
      // Force redeploy v26
} else {
        console.log(`[NOTIFY] SKIPPING Telegram for ${recipient.name// Force redeploy v26
}: Token or Chat ID missing.`);
      // Force redeploy v26
}
      
      if (!sent && twilioFromNumber && authToken && accountSid && recipient.phone) {
        console.log(`[NOTIFY] Attempting to send SMS to ${recipient.name// Force redeploy v26
} (Phone: ${recipient.phone// Force redeploy v26
})`);
        const success = sendSmsNotification_(message, recipient.phone, twilioFromNumber, accountSid, authToken, recipient.name);
        if(success) {
            console.log(`[NOTIFY] SUCCESS: SMS sent to ${recipient.name// Force redeploy v26
}.`);
        // Force redeploy v26
} else {
            console.error(`[NOTIFY] FAILED: SMS to ${recipient.name// Force redeploy v26
}.`);
        // Force redeploy v26
}
      // Force redeploy v26
} else if (!sent) {
          console.log(`[NOTIFY] SKIPPING SMS for ${recipient.name// Force redeploy v26
}: Twilio credentials or phone number missing.`);
      // Force redeploy v26
}
    // Force redeploy v26
}
    console.log("[NOTIFY] Notification process finished.");
  // Force redeploy v26
} catch (error) {
    console.error(`[NOTIFY] CRITICAL ERROR in sendAcknowledgmentNotifications: ${error.toString()// Force redeploy v26
}`);
  // Force redeploy v26
}
// Force redeploy v26
}

/**
 * Handles the default action of fetching all data for the tablet display.
 */
function handleDataFetchAction_(e) {
  try {
    console.log("doGet called with:", JSON.stringify(e, null, 2));
    
    // --- ROBUST PARAMETER HANDLING ---
    // Default clientID
    let clientID = 'mom'; 
    
    // Try to find the clientID parameter in multiple ways Google might pass it
    if (e && e.parameter && e.parameter.clientID) {
      clientID = e.parameter.clientID;
    // Force redeploy v26
} else if (e && e.parameters && e.parameters.clientID && e.parameters.clientID[0]) {
      // Sometimes parameters are passed as arrays, e.g., { clientID: ['Äiti'] // Force redeploy v26
}
      clientID = e.parameters.clientID[0];
    // Force redeploy v26
}
    // --- END OF ROBUST HANDLING ---
    
    console.log(`Processing request for clientID: ${clientID// Force redeploy v26
}`);

    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    
    if (!sheetId) {
      return createJsonResponse({ 
        error: "SHEET_ID not configured", 
        message: "Please add SHEET_ID to Script Properties",
        clientID: clientID
      // Force redeploy v26
});
    // Force redeploy v26
}

    // Try to access the sheet
    let sheet;
    try {
      sheet = SpreadsheetApp.openById(sheetId);
    // Force redeploy v26
} catch (sheetError) {
      return createJsonResponse({ 
        error: "Cannot access sheet", 
        message: sheetError.toString(),
        sheetId: sheetId
      // Force redeploy v26
});
    // Force redeploy v26
}

    // Get data from sheets
    const appointment = getTodaysAppointment_(sheet, clientID);
    const upcomingAppointments = getUpcomingAppointments_(sheet, clientID);
    const contacts = getContacts_(sheet, clientID);
    const { usePhotos, useTelegram // Force redeploy v26
} = getClientSettings_(sheet, clientID);
    
    // Get photo if enabled
    const photo = usePhotos ? getDailyPhotoEnhanced_(sheet, clientID) : 
                  {url: "", caption: "Kuvat eivät ole vielä käytössä"// Force redeploy v26
};
    
    // Get weather (optimized - only at 8, 12, 16, 20)
    const weatherApiKey = scriptProperties.getProperty(WEATHER_API_KEY_KEY);
    const weather = getWeatherDataOptimized_(weatherApiKey, clientID);
    
    // Get last message
    const lastMessage = scriptProperties.getProperty(`lastMessage_${clientID// Force redeploy v26
}`) || "Tervetuloa!";
    
    // Get current time of day for tasks
    const now = new Date();
    const hour = now.getHours();
    let timeOfDay = "Päivä";
    if (hour >= 5 && hour < 11) timeOfDay = "Aamu";
    else if (hour >= 11 && hour < 17) timeOfDay = "Päivä";
    else if (hour >= 17 && hour < 21) timeOfDay = "Ilta";
    else timeOfDay = "Yö";
    
    const dailyTasks = getDailyTasks_(sheet, clientID, timeOfDay);

    const responseData = {
      clientID: clientID,
      timestamp: new Date().toISOString(),
      status: "OK",
      settings: {
        useTelegram: useTelegram,
        usePhotos: usePhotos
      // Force redeploy v26
},
      importantMessage: appointment,
      upcomingAppointments: upcomingAppointments,
      dailyPhotoUrl: photo.url,
      dailyPhotoCaption: photo.caption,
      weather: {
        description: weather.message,
        temperature: weather.temperature
      // Force redeploy v26
},
      contacts: contacts,
      latestReminder: lastMessage,
      dailyTasks: dailyTasks,
      currentTimeOfDay: timeOfDay
    // Force redeploy v26
};

    return createJsonResponse(responseData);

  // Force redeploy v26
} catch (error) {
    console.error("doGet error:", error.toString());
    return createJsonResponse({ 
      error: error.toString(),
      stack: error.stack
    // Force redeploy v26
});
  // Force redeploy v26
}
// Force redeploy v26
}



function acknowledgeWeeklyTask_(clientID, taskType, timeOfDay, timestamp) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    const sheet = SpreadsheetApp.openById(sheetId);
    
    // Get or create Kuittaukset (Acknowledgments) sheet
    let ackSheet = sheet.getSheetByName("Kuittaukset");
    if (!ackSheet) {
      ackSheet = sheet.insertSheet("Kuittaukset");
      // Add headers
      ackSheet.getRange(1, 1, 1, 5).setValues([["Date", "TimeOfDay", "TaskType", "AckedTime", "Notes"]]);
      console.log("Created new Kuittaukset sheet with headers");
    // Force redeploy v26
}
    
    const helsinkiTimeZone = "Europe/Helsinki";
    const now = new Date();
    const todayStr = Utilities.formatDate(now, helsinkiTimeZone, "yyyy-MM-dd");
    const timeStr = Utilities.formatDate(now, helsinkiTimeZone, "HH:mm:ss");
    
    // Add new acknowledgment row
    ackSheet.appendRow([
      todayStr,           // A: Date
      timeOfDay,          // B: TimeOfDay  
      taskType,           // C: TaskType
      timeStr,            // D: AckedTime
      ""                  // E: Notes (empty for now)
    ]);
    
    console.log(`Added acknowledgment: ${todayStr// Force redeploy v26
} ${timeOfDay// Force redeploy v26
} ${taskType// Force redeploy v26
} at ${timeStr// Force redeploy v26
}`);
    return true;
    
  // Force redeploy v26
} catch (error) {
    console.error("Error acknowledging task:", error.toString());
    return false;
  // Force redeploy v26
}
// Force redeploy v26
}

// Helper function to get a sheet by name or create it if it doesn't exist
function getOrCreateSheet_(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    // Add headers to the new sheet
    sheet.appendRow(["Timestamp", "ClientID", "AcknowledgedTask"]);
    console.log(`Created new sheet: "${sheetName// Force redeploy v26
}"`);
  // Force redeploy v26
}
  return sheet;
// Force redeploy v26
}


// ===================================================================================
//  ORIGINAL FULL doGet FUNCTION (commented out for now)
// ===================================================================================
/*
function doGet_FULL(e) {
  try {
    console.log("doGet called with:", e);
    
    // Safe parameter handling
    const params = (e && e.parameter) ? e.parameter : {// Force redeploy v26
};
    const clientID = params.clientID || 'mom';
    
    console.log(`Processing request for clientID: ${clientID// Force redeploy v26
}`);

    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    
    if (!sheetId) {
      return createJsonResponse({ 
        error: "SHEET_ID not configured", 
        message: "Please add SHEET_ID to Script Properties",
        clientID: clientID
      // Force redeploy v26
});
    // Force redeploy v26
}

    // Try to access the sheet
    let sheet;
    try {
      sheet = SpreadsheetApp.openById(sheetId);
    // Force redeploy v26
} catch (sheetError) {
      return createJsonResponse({ 
        error: "Cannot access sheet", 
        message: sheetError.toString(),
        sheetId: sheetId
      // Force redeploy v26
});
    // Force redeploy v26
}

    // Get data from sheets
    const appointment = getTodaysAppointment_(sheet, clientID);
    const upcomingAppointments = getUpcomingAppointments_(sheet, clientID);
    const contacts = getContacts_(sheet, clientID);
    const { usePhotos, useTelegram // Force redeploy v26
} = getClientSettings_(sheet, clientID);
    
    // Get photo if enabled
    const photo = usePhotos ? getDailyPhoto_(sheet, clientID) : 
                  {url: "", caption: "Kuvat eivät ole vielä käytössä"// Force redeploy v26
};
    
    // Get weather (optimized - only at 8, 12, 16, 20)
    const weatherApiKey = scriptProperties.getProperty(WEATHER_API_KEY_KEY);
    const weather = getWeatherDataOptimized_(weatherApiKey, clientID);
    
    // Get last message
    const lastMessage = scriptProperties.getProperty(`lastMessage_${clientID// Force redeploy v26
}`) || "Tervetuloa!";

    const responseData = {
      clientID: clientID,
      timestamp: new Date().toISOString(),
      status: "OK",
      settings: {
        useTelegram: useTelegram,
        usePhotos: usePhotos
      // Force redeploy v26
},
      importantMessage: appointment,
      upcomingAppointments: upcomingAppointments,
      dailyPhotoUrl: photo.url,
      dailyPhotoCaption: photo.caption,
      weather: {
        description: weather.message,
        temperature: weather.temperature
      // Force redeploy v26
},
      contacts: contacts,
      latestReminder: lastMessage
    // Force redeploy v26
};

    return createJsonResponse(responseData);

  // Force redeploy v26
} catch (error) {
    console.error("doGet error:", error.toString());
    return createJsonResponse({ 
      error: error.toString(),
      stack: error.stack
    // Force redeploy v26
});
  // Force redeploy v26
}
// Force redeploy v26
}
*/

// Helper function to create JSON response (NO CORS HEADERS NEEDED FOR GET)
function createJsonResponse(data) {
  const output = JSON.stringify(data, null, 2);
  return ContentService
    .createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
// Force redeploy v26
}


// ===================================================================================
//  HELPER FUNCTIONS
// ===================================================================================

function getClientSettings_(sheet, clientID) {
  try {
    const configSheet = sheet.getSheetByName("Config");
    if (!configSheet) return { usePhotos: false, useTelegram: false // Force redeploy v26
};
    
    const configData = configSheet.getDataRange().getValues();
    
    for (let i = 1; i < configData.length; i++) {
      if (configData[i] && configData[i][0] === clientID) {
        return {
          useTelegram: configData[i][8] === "YES" || configData[i][8] === "yes" || configData[i][8] === true,
          usePhotos: configData[i][9] === "YES" || configData[i][9] === "yes" || configData[i][9] === true
        // Force redeploy v26
};
      // Force redeploy v26
}
    // Force redeploy v26
}
  // Force redeploy v26
} catch (error) {
    console.log('Error reading client settings:', error.toString());
  // Force redeploy v26
}
  
  return { usePhotos: false, useTelegram: false // Force redeploy v26
};
// Force redeploy v26
}

function getTodaysAppointment_(sheet, clientID) {
  try {
    const appointmentSheet = sheet.getSheetByName("Tapaamiset") || sheet.getSheetByName("Appointments");
    if (!appointmentSheet) return "";
    
    const helsinkiTimeZone = "Europe/Helsinki";
    const today = Utilities.formatDate(new Date(), helsinkiTimeZone, "yyyy-MM-dd");
    const appointments = appointmentSheet.getDataRange().getValues();
    
    for (let i = 1; i < appointments.length; i++) {
      const row = appointments[i];
      if (!row[0] || !row[1]) continue;
      
      try {
        const appointmentDate = Utilities.formatDate(new Date(row[1]), helsinkiTimeZone, "yyyy-MM-dd");
        if (row[0] === clientID && appointmentDate === today) {
          return `📅 ${row[4] || "Tapaaminen"// Force redeploy v26
} ${row[3] ? 'kello ' + row[3] : ''// Force redeploy v26
} - ${row[2] || ""// Force redeploy v26
}`;
        // Force redeploy v26
}
      // Force redeploy v26
} catch (e) {
        console.error(`Error parsing appointment row ${i// Force redeploy v26
}:`, e.toString());
      // Force redeploy v26
}
    // Force redeploy v26
}
  // Force redeploy v26
} catch (error) {
    console.log('Error getting appointments:', error.toString());
  // Force redeploy v26
}
  
  return "";
// Force redeploy v26
}

function getUpcomingAppointments_(sheet, clientID) {
  const helsinkiTimeZone = "Europe/Helsinki";
  const today = new Date();
  const oneWeekFromNow = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
  
  // Check if Appointments/Tapaamiset sheet exists, if not return empty array
  let appointments;
  try {
    // Try Finnish name first, then English
    try {
      appointments = sheet.getSheetByName("Tapaamiset").getDataRange().getValues();
    // Force redeploy v26
} catch (e1) {
      appointments = sheet.getSheetByName("Appointments").getDataRange().getValues();
    // Force redeploy v26
}
  // Force redeploy v26
} catch (e) {
    console.log("Appointments/Tapaamiset sheet not found, skipping upcoming appointments check");
    return [];
  // Force redeploy v26
}
  let upcomingAppointments = [];
  
  for (let i = 1; i < appointments.length; i++) {
    const row = appointments[i];
    if (!row[0] || !row[1]) continue; // Skip empty rows
    
    try {
      const appointmentDate = new Date(row[1]);
      const todayString = Utilities.formatDate(today, helsinkiTimeZone, "yyyy-MM-dd");
      const appointmentString = Utilities.formatDate(appointmentDate, helsinkiTimeZone, "yyyy-MM-dd");
      
      // Check if appointment is for this client and within next 7 days (but not today)
      if (row[0] === clientID && appointmentDate > today && appointmentDate <= oneWeekFromNow) {
        upcomingAppointments.push({
          date: appointmentString,
          time: row[3] || "",
          type: row[4] || "Tapaaminen",
          message: row[2] || "",
          location: row[5] || "",
          daysFromNow: Math.ceil((appointmentDate - today) / (24 * 60 * 60 * 1000))
        // Force redeploy v26
});
      // Force redeploy v26
}
    // Force redeploy v26
} catch (e) {
      console.error(`Error parsing upcoming appointment row ${i// Force redeploy v26
}: ${e.toString()// Force redeploy v26
}`);
    // Force redeploy v26
}
  // Force redeploy v26
}
  
  // Sort by date
  upcomingAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return upcomingAppointments;
// Force redeploy v26
}

function getDailyPhotoEnhanced_(sheet, clientID) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const albumId = scriptProperties.getProperty(GOOGLE_PHOTOS_ALBUM_ID_KEY);
    
    // Method 1: Try Google Photos (photos.google.com)
    if (albumId && albumId !== "YOUR_GOOGLE_PHOTOS_ALBUM_ID_HERE") {
      
      // Check if it's a Google Photos URL/ID
      if (albumId.includes('photos.google.com') || albumId.includes('photos.app.goo.gl')) {
        console.log("Attempting Google Photos integration...");
        const googlePhoto = getGooglePhotosAlbumImage_(albumId, clientID);
        if (googlePhoto.url) {
          return googlePhoto;
        // Force redeploy v26
}
        console.log("Google Photos failed, trying Google Drive method...");
      // Force redeploy v26
}
      
      // Method 2: Try Google Drive folder (drive.google.com)
      const drivePhoto = getGooglePhotosImage_(albumId, clientID);
      if (drivePhoto.url) {
        console.log(`Using Google Drive for ${clientID// Force redeploy v26
}: ${drivePhoto.caption// Force redeploy v26
}`);
        return drivePhoto;
      // Force redeploy v26
}
    // Force redeploy v26
}
    
    // Method 3: Fallback to Google Sheets Photos tab
    const photoSheet = sheet.getSheetByName("Photos");
    if (!photoSheet) return {url: "", caption: "Ei kuvia saatavilla"// Force redeploy v26
};
    
    const photos = photoSheet.getDataRange().getValues()
                             .filter((row, index) => index > 0 && row[0] === clientID);
    
    if (photos.length === 0) return {url: "", caption: "Ei kuvia saatavilla"// Force redeploy v26
};
    
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const photoIndex = dayOfYear % photos.length;
    
    return {
      url: photos[photoIndex][1],
      caption: photos[photoIndex][2] || "Kuva äidille"
    // Force redeploy v26
};
  // Force redeploy v26
} catch (error) {
    console.log('Error getting photo:', error.toString());
    return {url: "", caption: "Kuvia ei voitu hakea"// Force redeploy v26
};
  // Force redeploy v26
}
// Force redeploy v26
}

// NEW: Google Photos integration - ENHANCED FOR WEEKLY ROTATION
function getGooglePhotosImage_(albumId, clientID) {
  try {
    // Get photos from Google Photos album using Drive API (simpler than Photos API)
    // Google Photos albums can be accessed via Drive if shared properly
    
    const weekNumber = getCurrentWeekNumber_();
    
    // Try to get album photos using Drive API
    const albumUrl = `https://drive.google.com/drive/folders/${albumId// Force redeploy v26
}`;
    
    try {
      // PRIORITEETTI 1: Etsi viikkokohtaiset tiedostot (viikko1.jpg, viikko2.jpg, etc.)
      const weeklyFileName = `viikko${weekNumber// Force redeploy v26
}.jpg`;
      const weeklyFiles = DriveApp.getFolderById(albumId).getFilesByName(weeklyFileName);
      
      if (weeklyFiles.hasNext()) {
        const weeklyFile = weeklyFiles.next();
        console.log(`✅ Löytyi viikottainen kuva: ${weeklyFileName// Force redeploy v26
} viikolle ${weekNumber// Force redeploy v26
}`);
        
        return {
          url: `https://drive.google.com/uc?id=${weeklyFile.getId()// Force redeploy v26
}`,
          caption: `📅 Viikon ${weekNumber// Force redeploy v26
} perhekuva 💕`
        // Force redeploy v26
};
      // Force redeploy v26
}
      
      console.log(`⚠️ Viikottaista kuvaa ${weeklyFileName// Force redeploy v26
} ei löytynyt, käytetään kiertävää järjestelmää`);
      
      // PRIORITEETTI 2: Jos viikkokohtaisia kuvia ei löydy, käytä kaikkia kuvia kiertävässä järjestyksessä
      const files = DriveApp.getFolderById(albumId).getFiles();
      const imageFiles = [];
      
      while (files.hasNext()) {
        const file = files.next();
        const mimeType = file.getBlob().getContentType();
        
        // Check if it's an image
        if (mimeType.startsWith('image/')) {
          imageFiles.push({
            id: file.getId(),
            name: file.getName(),
            url: `https://drive.google.com/uc?id=${file.getId()// Force redeploy v26
}`,
            caption: file.getName().replace(/\.(jpg|jpeg|png|gif)$/i, '') // Use filename as caption
          // Force redeploy v26
});
        // Force redeploy v26
}
      // Force redeploy v26
}
      
      if (imageFiles.length > 0) {
        // Select image based on week number (cycling through all images)
        const imageIndex = (weekNumber - 1) % imageFiles.length;
        const selectedImage = imageFiles[imageIndex];
        
        console.log(`📸 Viikon ${weekNumber// Force redeploy v26
} mukaan valittu kuva ${imageIndex + 1// Force redeploy v26
}/${imageFiles.length// Force redeploy v26
}: ${selectedImage.name// Force redeploy v26
}`);
        
        return {
          url: selectedImage.url,
          caption: `📸 Viikon ${weekNumber// Force redeploy v26
} kuva: ${selectedImage.caption// Force redeploy v26
} (${imageIndex + 1// Force redeploy v26
}/${imageFiles.length// Force redeploy v26
})`
        // Force redeploy v26
};
      // Force redeploy v26
}
      
    // Force redeploy v26
} catch (driveError) {
      console.log(`Drive API error for album ${albumId// Force redeploy v26
}: ${driveError.toString()// Force redeploy v26
}`);
    // Force redeploy v26
}
    
    return {url: "", caption: ""// Force redeploy v26
};
    
  // Force redeploy v26
} catch (error) {
    console.log(`Google Photos error: ${error.toString()// Force redeploy v26
}`);
    return {url: "", caption: ""// Force redeploy v26
};
  // Force redeploy v26
}
// Force redeploy v26
}

// HELPER: Get current week number (ISO week)
function getCurrentWeekNumber_() {
  const currentDate = new Date();
  const jan1 = new Date(currentDate.getFullYear(), 0, 1);
  const daysOffset = 4 - jan1.getDay(); // Thursday is day 4 (0=Sunday, 1=Monday, etc.)
  
  const firstThursday = new Date(jan1.getTime() + daysOffset * 24 * 60 * 60 * 1000);
  const weekNumber = Math.floor((currentDate.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
  
  // Ensure week number is between 1-52
  return Math.max(1, Math.min(52, weekNumber));
// Force redeploy v26
}

// NEW: Test Google Photos integration
// UUSI: Testaa viikottaista kuva-järjestelmää
function testWeeklyPhotos() {
  console.log("=== TESTING WEEKLY PHOTOS INTEGRATION ===");
  
  const scriptProperties = PropertiesService.getScriptProperties();
  const albumId = scriptProperties.getProperty(GOOGLE_PHOTOS_ALBUM_ID_KEY);
  
  if (!albumId || albumId.includes("YOUR_")) {
    console.log("❌ Google Photos Album ID not set");
    console.log("💡 Set GOOGLE_PHOTOS_ALBUM_ID in Script Properties:");
    console.log("💡 Album ID: 1MAtFl9fTGkKIpI8oLTxEMh8A4B-bcgub");
    console.log("💡 Expected files: viikko1.jpg, viikko2.jpg, viikko3.jpg, viikko4.jpg");
    return;
  // Force redeploy v26
}
  
  const weekNumber = getCurrentWeekNumber_();
  console.log(`Testing album ID: ${albumId// Force redeploy v26
}`);
  console.log(`Current week number: ${weekNumber// Force redeploy v26
}`);
  console.log(`Looking for file: viikko${weekNumber// Force redeploy v26
}.jpg`);
  
  try {
    const testPhoto = getGooglePhotosImage_(albumId, "mom");
    
    if (testPhoto.url) {
      console.log("✅ Weekly Photos integration working!");
      console.log(`Photo URL: ${testPhoto.url// Force redeploy v26
}`);
      console.log(`Caption: ${testPhoto.caption// Force redeploy v26
}`);
    // Force redeploy v26
} else {
      console.log("❌ No photos found in album");
      console.log("💡 Check that:");
      console.log("  - Album ID is correct");
      console.log("  - Folder contains image files (viikko1.jpg, viikko2.jpg, etc.)");
      console.log("  - Files are properly named");
      console.log("  - Script has access to the folder");
    // Force redeploy v26
}
    
  // Force redeploy v26
} catch (error) {
    console.error("❌ Weekly Photos test failed:", error.toString());
  // Force redeploy v26
}
// Force redeploy v26
}

function testGooglePhotos() {
  console.log("=== TESTING GOOGLE PHOTOS INTEGRATION ===");
  
  const scriptProperties = PropertiesService.getScriptProperties();
  const albumId = scriptProperties.getProperty(GOOGLE_PHOTOS_ALBUM_ID_KEY);
  
  if (!albumId || albumId.includes("YOUR_")) {
    console.log("❌ Google Photos Album ID not set");
    console.log("💡 Set GOOGLE_PHOTOS_ALBUM_ID in Script Properties");
    console.log("💡 Use folder ID from Google Drive shared album");
    return;
  // Force redeploy v26
}
  
  console.log(`Testing album ID: ${albumId// Force redeploy v26
}`);
  
  try {
    const testPhoto = getGooglePhotosImage_(albumId, "mom");
    
    if (testPhoto.url) {
      console.log("✅ Google Photos integration working!");
      console.log(`Photo URL: ${testPhoto.url// Force redeploy v26
}`);
      console.log(`Caption: ${testPhoto.caption// Force redeploy v26
}`);
    // Force redeploy v26
} else {
      console.log("❌ No photos found in album");
      console.log("💡 Check that:");
      console.log("  - Album ID is correct");
      console.log("  - Folder contains image files");
      console.log("  - Script has access to the folder");
    // Force redeploy v26
}
    
  // Force redeploy v26
} catch (error) {
    console.error("❌ Google Photos test failed:", error.toString());
  // Force redeploy v26
}
// Force redeploy v26
}

function getContacts_(sheet, clientID) {
  try {
    const configSheet = sheet.getSheetByName("Config");
    if (!configSheet) return [];
    
    const configData = configSheet.getDataRange().getValues();
    
    for (let i = 1; i < configData.length; i++) {
      if (configData[i][0] === clientID) {
        const contacts = [];
        
        // Column F (5): Contact1_Name, Column G (6): Contact1_Phone  
        if (configData[i][5] && configData[i][6]) {
          const name1 = String(configData[i][5]).trim();
          const phone1 = String(configData[i][6]).replace(/[^+\d]/g, '');
          if (name1 && phone1) {
            contacts.push({ name: name1, phone: phone1 // Force redeploy v26
});
          // Force redeploy v26
}
        // Force redeploy v26
}
        
        // Column H (7): Contact2_Name, Column I (8): Contact2_Phone
        if (configData[i][7] && configData[i][8]) {
          const name2 = String(configData[i][7]).trim();
          const phone2 = String(configData[i][8]).replace(/[^+\d]/g, '');
          if (name2 && phone2) {
            contacts.push({ name: name2, phone: phone2 // Force redeploy v26
});
          // Force redeploy v26
}
        // Force redeploy v26
}
        
        console.log(`Found ${contacts.length// Force redeploy v26
} contacts for ${clientID// Force redeploy v26
}:`, contacts);
        return contacts;
      // Force redeploy v26
}
    // Force redeploy v26
}
  // Force redeploy v26
} catch (error) {
    console.log('Error getting contacts:', error.toString());
  // Force redeploy v26
}
  
  return [];
// Force redeploy v26
}

function getDailyTasks_(sheet, clientID, timeOfDay) {
  try {
    const tasksSheet = sheet.getSheetByName("PaivanTehtavat");
    if (!tasksSheet) return [];
    
    const helsinkiTimeZone = "Europe/Helsinki";
    const today = new Date();
    const weekdayNames = ["Sunnuntai", "Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai", "Lauantai"];
    const currentWeekday = weekdayNames[today.getDay()];
    
    const tasksData = tasksSheet.getDataRange().getValues();
    const tasks = [];
    
    for (let i = 1; i < tasksData.length; i++) {
      const row = tasksData[i];
      if (!row[0] || !row[1] || !row[2]) continue;
      
      // A: ClientID, B: Weekday, C: TimeOfDay, D: TaskType, E: Description, F: RequiresAck, G: LastAcked
      if (row[0] === clientID && 
          (row[1] === currentWeekday || row[1] === "Päivittäin") && 
          row[2] === timeOfDay) {
        
        const task = {
          type: String(row[3] || "").toUpperCase(),
          description: String(row[4] || ""),
          requiresAck: String(row[5] || "").toUpperCase() === "TRUE",
          lastAcked: row[6] ? new Date(row[6]) : null,
          isAckedToday: false
        // Force redeploy v26
};
        
        // Check if task was acknowledged today from Kuittaukset sheet
        task.isAckedToday = isTaskAckedToday_(sheet, task.type, timeOfDay, today);
        
        tasks.push(task);
      // Force redeploy v26
}
    // Force redeploy v26
}
    
    return tasks;
  // Force redeploy v26
} catch (error) {
    console.log('Error getting daily tasks:', error.toString());
    return [];
  // Force redeploy v26
}
// Force redeploy v26
}

function isTaskAckedToday_(sheet, taskType, timeOfDay, today) {
  try {
    const ackSheet = sheet.getSheetByName("Kuittaukset");
    if (!ackSheet) return false;
    
    const helsinkiTimeZone = "Europe/Helsinki";
    const todayStr = Utilities.formatDate(today, helsinkiTimeZone, "yyyy-MM-dd");
    
    const ackData = ackSheet.getDataRange().getValues();
    
    // Check if task was acknowledged today at this time of day
    for (let i = 1; i < ackData.length; i++) {
      const row = ackData[i];
      if (row[0] && row[1] && row[2]) { // Date, TimeOfDay, TaskType
        const ackDate = row[0];
        const ackTimeOfDay = String(row[1]).trim();
        const ackTaskType = String(row[2]).trim().toUpperCase();
        
        // Convert date to string for comparison
        const ackDateStr = typeof ackDate === 'string' ? ackDate : 
                          Utilities.formatDate(new Date(ackDate), helsinkiTimeZone, "yyyy-MM-dd");
        
        if (ackDateStr === todayStr && 
            ackTimeOfDay === timeOfDay && 
            ackTaskType === taskType.toUpperCase()) {
          return true;
        // Force redeploy v26
}
      // Force redeploy v26
}
    // Force redeploy v26
}
    
    return false;
  // Force redeploy v26
} catch (error) {
    console.error("Error checking acknowledgment:", error.toString());
    return false;
  // Force redeploy v26
}
// Force redeploy v26
}

function getWeatherData_(weatherApiKey) {
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=Helsinki&units=metric&lang=fi&appid=${weatherApiKey// Force redeploy v26
}`;
  let defaultResult = {
    message: "Säätietoja ei saatu.",
    temperature: "N/A",
    isRaining: false,
    isCold: true,
    isGoodForOutdoor: false
  // Force redeploy v26
};
  
  try {
    const response = UrlFetchApp.fetch(weatherUrl, { muteHttpExceptions: true // Force redeploy v26
});
    if (response.getResponseCode() == 200) {
      const weatherData = JSON.parse(response.getContentText());
      const temp = weatherData.main.temp;
      const description = weatherData.weather[0].description.toLowerCase();
      const mainWeather = weatherData.weather[0].main.toLowerCase();
      
      // Analyze weather conditions
      const isRaining = mainWeather === "rain" || description.includes("sade") || description.includes("shower");
      const isSnowing = mainWeather === "snow" || description.includes("lumi");
      const isCold = temp < 5; // Under 5°C is too cold for outdoor activities
      const isVeryCold = temp < 0; // Below freezing
      const isGoodForOutdoor = !isRaining && !isSnowing && temp >= 5;
      
      let weatherMessage;
      if (isRaining) {
        weatherMessage = `Sää tänään: ${description// Force redeploy v26
}, ${temp.toFixed(0)// Force redeploy v26
}°C. Sisäpuolella on mukavampaa! ☔`;
      // Force redeploy v26
} else if (isSnowing) {
        weatherMessage = `Sää tänään: ${description// Force redeploy v26
}, ${temp.toFixed(0)// Force redeploy v26
}°C. Ulkona on kaunista mutta kylmää! ❄️`;
      // Force redeploy v26
} else if (isGoodForOutdoor) {
        weatherMessage = `Sää tänään: ${description// Force redeploy v26
}, ${temp.toFixed(0)// Force redeploy v26
}°C. Loistava päivä ulkoiluun! ☀️`;
      // Force redeploy v26
} else if (isCold) {
        weatherMessage = `Sää tänään: ${description// Force redeploy v26
}, ${temp.toFixed(0)// Force redeploy v26
}°C. Pukeudu lämpimästi jos menet ulos! 🧥`;
      // Force redeploy v26
} else {
        weatherMessage = `Sää tänään: ${description// Force redeploy v26
}, ${temp.toFixed(0)// Force redeploy v26
}°C.`;
      // Force redeploy v26
}
      
      return {
        message: weatherMessage,
        temperature: `${temp.toFixed(0)// Force redeploy v26
}°C`,
        isRaining: isRaining,
        isSnowing: isSnowing,
        isCold: isCold,
        isVeryCold: isVeryCold,
        isGoodForOutdoor: isGoodForOutdoor,
        temp: temp
      // Force redeploy v26
};
    // Force redeploy v26
}
    return defaultResult;
  // Force redeploy v26
} catch (e) {
    console.error("Error fetching weather: " + e);
    return defaultResult;
  // Force redeploy v26
}
// Force redeploy v26
}

function getWeatherDataOptimized_(weatherApiKey, clientID) {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // Cache key with date to refresh daily
  const todayStr = Utilities.formatDate(now, "Europe/Helsinki", "yyyy-MM-dd");
  const cacheKey = `weather_${clientID// Force redeploy v26
}_${todayStr// Force redeploy v26
}`;
  
  // Check if it's weather update time (8, 12, 16, 20) with 10-minute window
  const isWeatherUpdateTime = (hour === 8 || hour === 12 || hour === 16 || hour === 20) && minute < 10;
  
  try {
    // Get cached weather
    const cachedWeatherStr = PropertiesService.getScriptProperties().getProperty(cacheKey);
    
    // If it's update time, fetch fresh weather
    if (isWeatherUpdateTime) {
      console.log(`Weather update time detected at ${hour// Force redeploy v26
}:${minute// Force redeploy v26
}, fetching fresh weather for ${clientID// Force redeploy v26
}`);
      const freshWeather = getWeatherData_(weatherApiKey);
      
      // Cache the fresh weather
      PropertiesService.getScriptProperties().setProperty(cacheKey, JSON.stringify(freshWeather));
      console.log(`Weather cached for ${clientID// Force redeploy v26
} at ${hour// Force redeploy v26
}:${minute// Force redeploy v26
}`);
      
      return freshWeather;
    // Force redeploy v26
}
    
    // If not update time, use cached weather if available
    if (cachedWeatherStr) {
      console.log(`Using cached weather for ${clientID// Force redeploy v26
} at ${hour// Force redeploy v26
}:${minute// Force redeploy v26
}`);
      return JSON.parse(cachedWeatherStr);
    // Force redeploy v26
}
    
    // If no cached weather exists, fetch fresh weather (first time today)
    console.log(`No cached weather found for ${clientID// Force redeploy v26
}, fetching fresh weather`);
    const freshWeather = getWeatherData_(weatherApiKey);
    PropertiesService.getScriptProperties().setProperty(cacheKey, JSON.stringify(freshWeather));
    
    return freshWeather;
    
  // Force redeploy v26
} catch (error) {
    console.error(`Error in weather optimization for ${clientID// Force redeploy v26
}: ${error// Force redeploy v26
}`);
    // Fallback to direct weather fetch
    return getWeatherData_(weatherApiKey);
  // Force redeploy v26
}
// Force redeploy v26
}

// ===================================================================================
//  SETUP AND TEST FUNCTIONS
// ===================================================================================

function setupScriptProperties() {
  console.log("=== Setting up Script Properties ===");
  
  const scriptProperties = PropertiesService.getScriptProperties();
  
  const properties = {
    [SHEET_ID_KEY]: "14i3QPYquqSqyE7fTp_pa2LNBq2Jb_re2rwsuUpRRSHo",
    [TELEGRAM_BOT_TOKEN_KEY]: "7650897551:AAGdACo33Q37dhpUvvlg6XVTzYqjm5oR6xI"
  // Force redeploy v26
};
  
  scriptProperties.setProperties(properties);
  console.log("✅ Properties set successfully!");
  
  checkScriptProperties();
// Force redeploy v26
}

// NEW: Complete setup function for all services
function setupAllScriptProperties() {
  console.log("=== Setting up ALL Script Properties ===");
  
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // Basic properties (already working)
  const properties = {
    [SHEET_ID_KEY]: "14i3QPYquqSqyE7fTp_pa2LNBq2Jb_re2rwsuUpRRSHo",
    [TELEGRAM_BOT_TOKEN_KEY]: "7650897551:AAGdACo33Q37dhpUvvlg6XVTzYqjm5oR6xI"
  // Force redeploy v26
};
  
  // Add placeholders for Twilio (REPLACE WITH YOUR REAL VALUES)
  properties[TWILIO_ACCOUNT_SID_KEY] = "YOUR_TWILIO_ACCOUNT_SID_HERE";
  properties[TWILIO_AUTH_TOKEN_KEY] = "YOUR_TWILIO_AUTH_TOKEN_HERE";
  properties[TWILIO_FROM_NUMBER_KEY] = "YOUR_TWILIO_PHONE_NUMBER_HERE"; // Format: +1234567890
  
  // Add placeholder for Weather API (optional for now)
  properties[WEATHER_API_KEY_KEY] = "YOUR_OPENWEATHER_API_KEY_HERE";
  
  // Add placeholder for Google Photos Album ID (optional)
  properties[GOOGLE_PHOTOS_ALBUM_ID_KEY] = "YOUR_GOOGLE_PHOTOS_ALBUM_ID_HERE";
  
  scriptProperties.setProperties(properties);
  console.log("✅ All properties set! Remember to replace placeholder values with real ones.");
  
  checkAllScriptProperties();
// Force redeploy v26
}

function checkScriptProperties() {
  console.log("=== Script Properties Check ===");
  
  const scriptProperties = PropertiesService.getScriptProperties();
  const allProperties = scriptProperties.getProperties();
  
  console.log("Available properties:", Object.keys(allProperties));
  
  const required = [SHEET_ID_KEY, TELEGRAM_BOT_TOKEN_KEY];
  
  required.forEach(key => {
    const value = allProperties[key];
    if (value) {
      console.log(`✅ ${key// Force redeploy v26
}: ${key.includes('TOKEN') ? 'SET (hidden)' : value// Force redeploy v26
}`);
    // Force redeploy v26
} else {
      console.log(`❌ ${key// Force redeploy v26
}: NOT SET`);
    // Force redeploy v26
}
  // Force redeploy v26
});
  
  return allProperties;
// Force redeploy v26
}

// NEW: Check all properties including Twilio
function checkAllScriptProperties() {
  console.log("=== ALL Script Properties Check ===");
  
  const scriptProperties = PropertiesService.getScriptProperties();
  const allProperties = scriptProperties.getProperties();
  
  console.log("Available properties:", Object.keys(allProperties));
  
  const allRequired = [
    SHEET_ID_KEY, 
    TELEGRAM_BOT_TOKEN_KEY,
    TWILIO_ACCOUNT_SID_KEY,
    TWILIO_AUTH_TOKEN_KEY,
    TWILIO_FROM_NUMBER_KEY,
    WEATHER_API_KEY_KEY,
    GOOGLE_PHOTOS_ALBUM_ID_KEY
  ];
  
  allRequired.forEach(key => {
    const value = allProperties[key];
    if (value && !value.includes("YOUR_") && !value.includes("HERE")) {
      console.log(`✅ ${key// Force redeploy v26
}: ${key.includes('TOKEN') || key.includes('KEY') ? 'SET (hidden)' : value// Force redeploy v26
}`);
    // Force redeploy v26
} else if (value && (value.includes("YOUR_") || value.includes("HERE"))) {
      console.log(`⚠️ ${key// Force redeploy v26
}: PLACEHOLDER - Please replace with real value`);
    // Force redeploy v26
} else {
      console.log(`❌ ${key// Force redeploy v26
}: NOT SET`);
    // Force redeploy v26
}
  // Force redeploy v26
});
  
  return allProperties;
// Force redeploy v26
}

function testEverything() {
  console.log("=== COMPLETE SYSTEM TEST ===");
  
  // Test 1: Script Properties
  console.log("\n1. Testing Script Properties...");
  checkScriptProperties();
  
  // Test 2: Sheet Access
  console.log("\n2. Testing Sheet Access...");
  testSheetAccess();
  
  // Test 3: Config Sheet
  console.log("\n3. Testing Config Sheet...");
  testConfigSheet();
  
  // Test 4: doGet Function
  console.log("\n4. Testing doGet Function...");
  testDoGet();
  
  console.log("\n=== TEST COMPLETE ===");
// Force redeploy v26
}

function testSheetAccess() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    
    if (!sheetId) {
      console.log("❌ SHEET_ID not set");
      return;
    // Force redeploy v26
}
    
    const sheet = SpreadsheetApp.openById(sheetId);
    console.log("✅ Sheet access OK:", sheet.getName());
    
    const sheets = sheet.getSheets();
    console.log("Available sheets:", sheets.map(s => s.getName()));
    
  // Force redeploy v26
} catch (error) {
    console.error("❌ Sheet access failed:", error.toString());
  // Force redeploy v26
}
// Force redeploy v26
}

function testConfigSheet() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    const sheet = SpreadsheetApp.openById(sheetId);
    
    const configSheet = sheet.getSheetByName("Config");
    if (!configSheet) {
      console.log("❌ Config sheet not found");
      return;
    // Force redeploy v26
}
    
    const configData = configSheet.getDataRange().getValues();
    console.log("✅ Config sheet found!");
    console.log("Rows:", configData.length);
    console.log("Headers:", configData[0]);
    
    if (configData.length > 1) {
      const clientRow = configData[1];
      console.log("Client data:");
      console.log("- ClientID:", clientRow[0]);
      console.log("- Name:", clientRow[1]);
      console.log("- Phone:", clientRow[2]);
      console.log("- UseTelegram:", clientRow[8]);
      console.log("- UsePhotos:", clientRow[9]);
    // Force redeploy v26
}
    
  // Force redeploy v26
} catch (error) {
    console.error("❌ Config test failed:", error.toString());
  // Force redeploy v26
}
// Force redeploy v26
}

function testDoGet() {
  try {
    console.log("Testing doGet function...");
    
    const result1 = doGet();
    console.log("✅ doGet (no params) result:", result1.getContent().substring(0, 100) + "...");
    
    const result2 = doGet({ parameter: { clientID: 'mom' // Force redeploy v26
} // Force redeploy v26
});
    console.log("✅ doGet (with clientID) result:", result2.getContent().substring(0, 100) + "...");
    
  // Force redeploy v26
} catch (error) {
    console.error("❌ doGet test failed:", error.toString());
  // Force redeploy v26
}
// Force redeploy v26
}

// ===================================================================================
//  WEB APP DEPLOYMENT TEST FUNCTIONS
// ===================================================================================

function testWebAppSimple() {
  console.log("=== TESTING SIMPLE WEB APP RESPONSE ===");
  
  // Test the doGet function directly
  try {
    const result = doGet();
    console.log("✅ Simple doGet works!");
    console.log("Response:", result.getContent());
    
    const result2 = doGet({ parameter: { clientID: 'test123' // Force redeploy v26
} // Force redeploy v26
});
    console.log("✅ doGet with parameters works!");
    console.log("Response:", result2.getContent());
    
  // Force redeploy v26
} catch (error) {
    console.error("❌ Simple doGet failed:", error.toString());
  // Force redeploy v26
}
// Force redeploy v26
}

// ===================================================================================
//  PLACEHOLDER FOR REMINDER FUNCTION
// ===================================================================================

async function mainReminderFunction() {
  const executionTime = new Date();
  console.log(`Main trigger executed at: ${executionTime// Force redeploy v26
}`);
  
  const scriptProperties = PropertiesService.getScriptProperties();
  const sheet = SpreadsheetApp.openById(scriptProperties.getProperty(SHEET_ID_KEY));
  const clientData = sheet.getSheetByName("Config").getDataRange().getValues();
  
  // Loop through all clients in the Config sheet (for future scalability)
  // Skip header row (i=0)
  for (let i = 1; i < clientData.length; i++) {
    const clientID = clientData[i][0];
    const clientName = clientData[i][1];
    const recipientPhoneNumber = clientData[i][2];
    const recipientTelegramChatID = clientData[i][3];

    console.log(`Processing client: ${clientName// Force redeploy v26
} (${clientID// Force redeploy v26
})`);
    await processSingleClient_(clientID, recipientPhoneNumber, recipientTelegramChatID, executionTime);
  // Force redeploy v26
}
  console.log("mainReminderFunction finished.");
// Force redeploy v26
}

async function processSingleClient_(clientID, recipientPhoneNumber, recipientTelegramChatID, executionTime) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();

    // Get credentials from script properties
    const twilioFromNumber = scriptProperties.getProperty(TWILIO_FROM_NUMBER_KEY);
    const authToken = scriptProperties.getProperty(TWILIO_AUTH_TOKEN_KEY);
    const accountSid = scriptProperties.getProperty(TWILIO_ACCOUNT_SID_KEY);
    const weatherApiKey = scriptProperties.getProperty(WEATHER_API_KEY_KEY);
    const telegramToken = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY);
    
    // --- Get current date and hour in Helsinki timezone ---
    const helsinkiTimeZone = "Europe/Helsinki";
    const currentHour = Utilities.formatDate(executionTime, helsinkiTimeZone, "HH");
    const currentDate = Utilities.formatDate(executionTime, helsinkiTimeZone, "yyyy-MM-dd");

    // Check if a message for this specific hour and day has already been sent
    const flagKey = `sent_${clientID// Force redeploy v26
}_${currentDate// Force redeploy v26
}_${currentHour// Force redeploy v26
}`;
    if (scriptProperties.getProperty(flagKey) === "true") {
      console.log(`Message for ${clientID// Force redeploy v26
} at ${currentHour// Force redeploy v26
}:00 has already been sent. Skipping.`);
      return;
    // Force redeploy v26
}
    
    const scheduledHours = ["08", "12", "16", "21"];
    if (!scheduledHours.includes(currentHour)) {
        console.log(`No message scheduled for ${clientID// Force redeploy v26
} at hour: ${currentHour// Force redeploy v26
}`);
        return;
    // Force redeploy v26
}
    
    console.log(`Matched ${currentHour// Force redeploy v26
}:00 for ${clientID// Force redeploy v26
}. Preparing message.`);

    // --- Get message from Google Sheet ---
    const sheet = SpreadsheetApp.openById(scriptProperties.getProperty(SHEET_ID_KEY));
    
    // Get messages from the main sheet (your current structure)
    const allMessages = sheet.getDataRange().getValues();
    
    // Determine which column to use based on hour and weather
    let columnIndex;
    switch(currentHour) {
      case "08": 
        columnIndex = 0; // Column A (Morning)
        break;
      case "12": 
        // For midday, use weather to choose appropriate activity
        const weather12 = getWeatherDataOptimized_(weatherApiKey, clientID);
        columnIndex = chooseMiddayColumn_(weather12);
        console.log(`Midday weather-based choice: column ${columnIndex// Force redeploy v26
} (${getColumnName_(columnIndex)// Force redeploy v26
})`);
        break;
      case "16": 
        // For afternoon, use weather to choose appropriate activity  
        const weather16 = getWeatherDataOptimized_(weatherApiKey, clientID);
        columnIndex = chooseAfternoonColumn_(weather16);
        console.log(`Afternoon weather-based choice: column ${columnIndex// Force redeploy v26
} (${getColumnName_(columnIndex)// Force redeploy v26
})`);
        break;
      case "21": 
        columnIndex = 7; // Column H (Klo 21)
        break;
      default:
        console.warn(`No messages configured for hour: ${currentHour// Force redeploy v26
}`);
        return;
    // Force redeploy v26
}
    
    // Get all message options from the determined column (skip header row)
    const relevantMessages = allMessages.slice(1) // Skip header
                                       .map(row => row[columnIndex])
                                       .filter(msg => msg && msg.trim() !== ""); // Remove empty messages

    if (relevantMessages.length === 0) {
      console.warn(`No messages found for ${currentHour// Force redeploy v26
}:00 in column ${columnIndex// Force redeploy v26
}.`);
      return;
    // Force redeploy v26
}

    let message = randomChoice_(relevantMessages);

    // Inject weather info for midday and afternoon messages
    if (currentHour === "12") {
      const weather12 = getWeatherDataOptimized_(weatherApiKey, clientID);
      if (message.includes("{weather// Force redeploy v26
}")) {
        message = message.replace("{weather// Force redeploy v26
}", weather12.message);
      // Force redeploy v26
} else {
        // Add weather info even if placeholder is not present
        message = `${message// Force redeploy v26
}\n\n${weather12.message// Force redeploy v26
}`;
      // Force redeploy v26
}
    // Force redeploy v26
} else if (currentHour === "16") {
      const weather16 = getWeatherDataOptimized_(weatherApiKey, clientID);
      // For afternoon, add weather as additional context
      if (weather16.isGoodForOutdoor && columnIndex === 5) {
        // If outdoor activity was chosen due to good weather, mention it
        message = `${message// Force redeploy v26
}\n\n${weather16.message// Force redeploy v26
} Hyvä hetki ulkoiluun! 🌟`;
      // Force redeploy v26
} else if ((weather16.isRaining || weather16.isCold) && (columnIndex === 4 || columnIndex === 6)) {
        // If indoor/social was chosen due to bad weather, mention it
        message = `${message// Force redeploy v26
}\n\n${weather16.message// Force redeploy v26
}`;
      // Force redeploy v26
}
    // Force redeploy v26
}
    
    // Store this message so the tablet app can display it
    scriptProperties.setProperty(`lastMessage_${clientID// Force redeploy v26
}`, message);

    // --- Send Notifications ---
    // Smart notification strategy based on time and available channels
    let notificationsSent = 0;
    
    // Check communication preferences from Config sheet
    const configSheet = sheet.getSheetByName("Config");
    const configData = configSheet.getDataRange().getValues();
    let useTelegram = false;
    let usePhotos = false;
    
    // Find client's communication settings 
    // Column I (8) = UseTelegram, Column J (9) = UsePhotos
    for (let i = 1; i < configData.length; i++) {
      if (configData[i][0] === clientID) {
        useTelegram = configData[i][8] === "YES" || configData[i][8] === "yes" || configData[i][8] === true;
        usePhotos = configData[i][9] === "YES" || configData[i][9] === "yes" || configData[i][9] === true;
        break;
      // Force redeploy v26
}
    // Force redeploy v26
}
    
    // Check if Telegram is available (if enabled, chat ID is set and token exists)
    const telegramAvailable = useTelegram && telegramToken && recipientTelegramChatID && recipientTelegramChatID !== "";
    
    console.log(`Notification strategy for ${clientID// Force redeploy v26
} at ${currentHour// Force redeploy v26
}:00 - UseTelegram: ${useTelegram// Force redeploy v26
}, UsePhotos: ${usePhotos// Force redeploy v26
}, Telegram available: ${telegramAvailable// Force redeploy v26
}`);
    
    // STRATEGY: Use the most appropriate channel for each time
    if (currentHour === "08") {
      // MORNING: Gentle start with SMS
      await sendSmsNotification_(message, recipientPhoneNumber, twilioFromNumber, accountSid, authToken, clientID);
      notificationsSent++;
      
    // Force redeploy v26
} else if (currentHour === "12") {
             // MIDDAY: Primary channel (Telegram if available, otherwise SMS)
       if (telegramAvailable) {
         await sendTelegramNotification_(sheet, clientID, message, telegramToken, recipientTelegramChatID, usePhotos);
         notificationsSent++;
       // Force redeploy v26
} else {
         await sendSmsNotification_(message, recipientPhoneNumber, twilioFromNumber, accountSid, authToken, clientID);
         notificationsSent++;
       // Force redeploy v26
}
      
    // Force redeploy v26
} else if (currentHour === "16") {
             // AFTERNOON: Dual approach - both SMS and Telegram (if available)
       if (telegramAvailable) {
         await sendTelegramNotification_(sheet, clientID, message, telegramToken, recipientTelegramChatID, usePhotos);
         notificationsSent++;
       // Force redeploy v26
}
      // Always send SMS in afternoon as backup/reinforcement
      await sendSmsNotification_(message, recipientPhoneNumber, twilioFromNumber, accountSid, authToken, clientID);
      notificationsSent++;
      
    // Force redeploy v26
} else if (currentHour === "21") {
      // EVENING: Strong reminder with voice call + optional telegram
      const callMessage = `Hei äiti. Tämä on Hyvän yön muistuttaja. ${message// Force redeploy v26
}`;
      try {
        const callSuccess = makeTwilioCall_(callMessage, recipientPhoneNumber, twilioFromNumber, accountSid, authToken);
        if (callSuccess) {
          notificationsSent++;
          console.log(`Twilio call initiated successfully for ${clientID// Force redeploy v26
}`);
        // Force redeploy v26
}
      // Force redeploy v26
} catch (e) {
        console.error(`Failed to make Twilio call for ${clientID// Force redeploy v26
}: ${e.toString()// Force redeploy v26
}`);
      // Force redeploy v26
}
      
             // Also send gentle telegram message if available (softer than call)
       if (telegramAvailable) {
         await sendTelegramNotification_(sheet, clientID, message, telegramToken, recipientTelegramChatID, usePhotos);
         notificationsSent++;
       // Force redeploy v26
}
    // Force redeploy v26
}
    
    console.log(`Total notifications sent for ${clientID// Force redeploy v26
}: ${notificationsSent// Force redeploy v26
}`);
    
    // Set the flag to prevent re-sending
    scriptProperties.setProperty(flagKey, "true");
    console.log(`Flag set: ${flagKey// Force redeploy v26
} = true.`);

  // Force redeploy v26
} catch (ex) {
    console.error(`Unhandled exception in processSingleClient_ for ${clientID// Force redeploy v26
}: ${ex.toString()// Force redeploy v26
} \nStack: ${ex.stack// Force redeploy v26
}`);
  // Force redeploy v26
}
// Force redeploy v26
}

function checkReminderTime_() {
  const helsinkiTimeZone = "Europe/Helsinki";
  const now = new Date();
  const currentHour = Utilities.formatDate(now, helsinkiTimeZone, "HH");
  const currentMinute = Utilities.formatDate(now, helsinkiTimeZone, "mm");
  const currentDate = Utilities.formatDate(now, helsinkiTimeZone, "yyyy-MM-dd");
  
  // Send reminders at 08:00, 12:00, 16:00, 21:00 (within first 5 minutes)
  const scheduledHours = ["08", "12", "16", "21"];
  const isScheduledHour = scheduledHours.includes(currentHour);
  const isWithinTimeWindow = parseInt(currentMinute) < 5; // First 5 minutes of the hour
  
  if (isScheduledHour && isWithinTimeWindow) {
    // Check if already sent today at this hour
    const scriptProperties = PropertiesService.getScriptProperties();
    const flagKey = `sent_global_${currentDate// Force redeploy v26
}_${currentHour// Force redeploy v26
}`;
    
    if (scriptProperties.getProperty(flagKey) === "true") {
      console.log(`Reminder for ${currentHour// Force redeploy v26
}:00 already sent today`);
      return { send: false, hour: currentHour // Force redeploy v26
};
    // Force redeploy v26
}
    
    // Set flag to prevent duplicate sends
    scriptProperties.setProperty(flagKey, "true");
    console.log(`Time to send reminder: ${currentHour// Force redeploy v26
}:00`);
    return { send: true, hour: currentHour // Force redeploy v26
};
  // Force redeploy v26
}
  
  console.log(`Not reminder time. Current: ${currentHour// Force redeploy v26
}:${currentMinute// Force redeploy v26
}`);
  return { send: false, hour: currentHour // Force redeploy v26
};
// Force redeploy v26
}

async function sendReminderToClient_(sheet, clientID, phoneNumber, telegramChatID, hour) {
  try {
    console.log(`Sending ${hour// Force redeploy v26
}:00 reminder to ${clientID// Force redeploy v26
}`);
    
    // Get message from sheet
    const message = getReminderMessage_(sheet, clientID, hour);
    if (!message) {
      console.log(`No message found for ${clientID// Force redeploy v26
} at ${hour// Force redeploy v26
}:00`);
      return;
    // Force redeploy v26
}
    
    // Get client settings
    const { usePhotos, useTelegram // Force redeploy v26
} = getClientSettings_(sheet, clientID);
    
    // Store message for tablet display
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty(`lastMessage_${clientID// Force redeploy v26
}`, message);
    
    // Send notifications based on strategy
    await executeNotificationStrategy_(sheet, clientID, message, hour, {
      phoneNumber,
      telegramChatID,
      useTelegram,
      usePhotos
    // Force redeploy v26
});
    
  // Force redeploy v26
} catch (error) {
    console.error(`Error sending reminder to ${clientID// Force redeploy v26
}:`, error.toString());
  // Force redeploy v26
}
// Force redeploy v26
}

function getReminderMessage_(sheet, clientID, hour) {
  try {
    const mainSheet = sheet.getSheets()[0]; // First sheet with messages
    const allMessages = mainSheet.getDataRange().getValues();
    
    // Determine column based on hour and weather (for 12:00 and 16:00)
    let columnIndex;
    const scriptProperties = PropertiesService.getScriptProperties();
    const weatherApiKey = scriptProperties.getProperty(WEATHER_API_KEY_KEY);
    
    switch(hour) {
      case "08": 
        columnIndex = 0; // Column A (Morning)
        break;
      case "12": 
        // For midday, use weather to choose appropriate activity
        const weather12 = getWeatherDataOptimized_(weatherApiKey, clientID);
        columnIndex = chooseMiddayColumn_(weather12);
        console.log(`Midday weather-based choice: column ${columnIndex// Force redeploy v26
} (${getColumnName_(columnIndex)// Force redeploy v26
})`);
        break;
      case "16": 
        // For afternoon, use weather to choose appropriate activity  
        const weather16 = getWeatherDataOptimized_(weatherApiKey, clientID);
        columnIndex = chooseAfternoonColumn_(weather16);
        console.log(`Afternoon weather-based choice: column ${columnIndex// Force redeploy v26
} (${getColumnName_(columnIndex)// Force redeploy v26
})`);
        break;
      case "21": 
        columnIndex = 7; // Column H (Evening)
        break;
      default:
        console.warn(`No messages configured for hour: ${hour// Force redeploy v26
}`);
        return null;
    // Force redeploy v26
}
    
    // Get all messages from column (skip header)
    const messages = allMessages.slice(1)
                                .map(row => row[columnIndex])
                                .filter(msg => msg && msg.trim() !== "");
    
    if (messages.length === 0) return null;
    
    let message = randomChoice_(messages);
    
    // Inject weather info for midday and afternoon messages
    if (hour === "12") {
      const weather12 = getWeatherDataOptimized_(weatherApiKey, clientID);
      if (message.includes("{weather// Force redeploy v26
}")) {
        message = message.replace("{weather// Force redeploy v26
}", weather12.message);
      // Force redeploy v26
} else {
        // Add weather info even if placeholder is not present
        message = `${message// Force redeploy v26
}\n\n${weather12.message// Force redeploy v26
}`;
      // Force redeploy v26
}
    // Force redeploy v26
} else if (hour === "16") {
      const weather16 = getWeatherDataOptimized_(weatherApiKey, clientID);
      // For afternoon, add weather as additional context
      if (weather16.isGoodForOutdoor && columnIndex === 5) {
        // If outdoor activity was chosen due to good weather, mention it
        message = `${message// Force redeploy v26
}\n\n${weather16.message// Force redeploy v26
} Hyvä hetki ulkoiluun! 🌟`;
      // Force redeploy v26
} else if ((weather16.isRaining || weather16.isCold) && (columnIndex === 4 || columnIndex === 6)) {
        // If indoor/social was chosen due to bad weather, mention it
        message = `${message// Force redeploy v26
}\n\n${weather16.message// Force redeploy v26
}`;
      // Force redeploy v26
}
    // Force redeploy v26
}
    
    return message;
    
  // Force redeploy v26
} catch (error) {
    console.error("Error getting reminder message:", error.toString());
    return null;
  // Force redeploy v26
}
// Force redeploy v26
}

async function executeNotificationStrategy_(sheet, clientID, message, hour, options) {
  const { phoneNumber, telegramChatID, useTelegram, usePhotos // Force redeploy v26
} = options;
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // Get Twilio credentials
  const twilioFromNumber = scriptProperties.getProperty(TWILIO_FROM_NUMBER_KEY);
  const authToken = scriptProperties.getProperty(TWILIO_AUTH_TOKEN_KEY);
  const accountSid = scriptProperties.getProperty(TWILIO_ACCOUNT_SID_KEY);
  const telegramToken = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY);
  
  const telegramAvailable = useTelegram && telegramToken && telegramChatID;
  
  console.log(`Strategy for ${clientID// Force redeploy v26
} at ${hour// Force redeploy v26
}:00 - Telegram: ${telegramAvailable// Force redeploy v26
}, Photos: ${usePhotos// Force redeploy v26
}`);
  
  // Execute strategy based on time
  if (hour === "08") {
    // Morning: Gentle SMS
    if (phoneNumber && twilioFromNumber && authToken && accountSid) {
      sendSMS_(message, phoneNumber, twilioFromNumber, accountSid, authToken);
    // Force redeploy v26
}
    
  // Force redeploy v26
} else if (hour === "12") {
    // Midday: Telegram first, SMS backup
    if (telegramAvailable) {
      await sendTelegramMessage_(telegramToken, telegramChatID, message, sheet, clientID, usePhotos);
    // Force redeploy v26
} else if (phoneNumber && twilioFromNumber) {
      sendSMS_(message, phoneNumber, twilioFromNumber, accountSid, authToken);
    // Force redeploy v26
}
    
  // Force redeploy v26
} else if (hour === "16") {
    // Afternoon: Both channels
    if (telegramAvailable) {
      await sendTelegramMessage_(telegramToken, telegramChatID, message, sheet, clientID, usePhotos);
    // Force redeploy v26
}
    if (phoneNumber && twilioFromNumber) {
      sendSMS_(message, phoneNumber, twilioFromNumber, accountSid, authToken);
    // Force redeploy v26
}
    
  // Force redeploy v26
} else if (hour === "21") {
    // Evening: Voice call primary, Telegram secondary
    if (phoneNumber && twilioFromNumber && authToken && accountSid) {
      const callMessage = `Hei äiti. Tämä on illan muistuttaja. ${message// Force redeploy v26
}`;
      makeVoiceCall_(callMessage, phoneNumber, twilioFromNumber, accountSid, authToken);
    // Force redeploy v26
}
    if (telegramAvailable) {
      await sendTelegramMessage_(telegramToken, telegramChatID, message, sheet, clientID, usePhotos);
    // Force redeploy v26
}
  // Force redeploy v26
}
// Force redeploy v26
}

// ===================================================================================
//  NOTIFICATION SENDING FUNCTIONS - SMART STRATEGY
// ===================================================================================

async function sendSmsNotification_(message, phoneNumber, fromNumber, accountSid, authToken, clientID) {
  try {
    // Normalize phone number before sending
    const normalizedPhone = normalizePhoneNumber_(phoneNumber);
    if (!normalizedPhone) {
      console.error(`Invalid phone number for ${clientID// Force redeploy v26
}: ${phoneNumber// Force redeploy v26
}`);
      return false;
    // Force redeploy v26
}
    
    const smsSuccess = sendSmsViaTwilio_(message, normalizedPhone, fromNumber, accountSid, authToken);
    if (smsSuccess) {
      console.log(`SMS sent successfully for ${clientID// Force redeploy v26
} to ${normalizedPhone// Force redeploy v26
}`);
      return true;
    // Force redeploy v26
}
  // Force redeploy v26
} catch (e) {
    console.error(`Failed to send SMS for ${clientID// Force redeploy v26
}: ${e.toString()// Force redeploy v26
}`);
  // Force redeploy v26
}
  return false;
// Force redeploy v26
}

async function sendTelegramNotification_(sheet, clientID, message, telegramToken, chatID, usePhotos = false) {
  try {
    let telegramMessage = message;
    
    if (usePhotos) {
      // Try to get photo only if photos are enabled
      const photo = getDailyPhotoEnhanced_(sheet, clientID);
      telegramMessage = photo.caption ? `${message// Force redeploy v26
}\n\n${photo.caption// Force redeploy v26
}` : message;
      
      if (photo.url) {
        sendTelegramPhoto_(telegramToken, chatID, photo.url, telegramMessage);
        console.log(`Telegram photo message sent successfully for ${clientID// Force redeploy v26
}`);
        return true;
      // Force redeploy v26
} else {
        console.log(`Photos enabled but no photo found for ${clientID// Force redeploy v26
}, sending text only`);
      // Force redeploy v26
}
    // Force redeploy v26
}
    
    // Send text message (either photos disabled or no photo available)
    sendTelegramMessage_(telegramToken, chatID, telegramMessage);
    console.log(`Telegram text message sent successfully for ${clientID// Force redeploy v26
}`);
    return true;
  // Force redeploy v26
} catch (e) {
    console.error(`Failed to send Telegram message for ${clientID// Force redeploy v26
}: ${e.toString()// Force redeploy v26
}`);
  // Force redeploy v26
}
  return false;
// Force redeploy v26
}

// ===================================================================================
//  ORIGINAL NOTIFICATION FUNCTIONS
// ===================================================================================

function sendSMS_(message, toPhone, fromPhone, accountSid, authToken) {
  if (!toPhone || !fromPhone || !accountSid || !authToken) {
    console.log("SMS: Missing Twilio credentials");
    return false;
  // Force redeploy v26
}
  
  // Normalize phone number before sending
  const normalizedPhone = normalizePhoneNumber_(toPhone);
  if (!normalizedPhone) {
    console.error(`Invalid phone number: ${toPhone// Force redeploy v26
}`);
    return false;
  // Force redeploy v26
}
  
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid// Force redeploy v26
}/Messages.json`;
  
  const payload = {
    method: "post",
    headers: {
      "Authorization": "Basic " + Utilities.base64Encode(`${accountSid// Force redeploy v26
}:${authToken// Force redeploy v26
}`)
    // Force redeploy v26
},
    payload: {
      "To": normalizedPhone,
      "From": fromPhone,
      "Body": message
    // Force redeploy v26
},
    muteHttpExceptions: true
  // Force redeploy v26
};
  
  try {
    const response = UrlFetchApp.fetch(twilioUrl, payload);
    const responseCode = response.getResponseCode();
    console.log(`SMS response: ${responseCode// Force redeploy v26
} to ${normalizedPhone// Force redeploy v26
}`);
    return responseCode >= 200 && responseCode < 300;
  // Force redeploy v26
} catch (e) {
    console.error("SMS error:", e.toString());
    return false;
  // Force redeploy v26
}
// Force redeploy v26
}

function sendSmsViaTwilio_(messageBody, to, from, accountSid, authToken) {
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid// Force redeploy v26
}/Messages.json`;
  
  const payload = {
    method: "post",
    headers: {
      "Authorization": "Basic " + Utilities.base64Encode(`${accountSid// Force redeploy v26
}:${authToken// Force redeploy v26
}`)
    // Force redeploy v26
},
    payload: {
      "To": to,
      "From": from,
      "Body": messageBody
    // Force redeploy v26
},
    muteHttpExceptions: true
  // Force redeploy v26
};
  
  try {
    const response = UrlFetchApp.fetch(twilioUrl, payload);
    const responseCode = response.getResponseCode();
    console.log(`Twilio SMS response: ${responseCode// Force redeploy v26
} - ${response.getContentText()// Force redeploy v26
}`);
    return responseCode >= 200 && responseCode < 300;
  // Force redeploy v26
} catch (e) {
    console.error(`Error sending SMS: ${e.toString()// Force redeploy v26
}`);
    return false;
  // Force redeploy v26
}
// Force redeploy v26
}

async function sendTelegramMessage_(token, chatId, message, sheet, clientID, usePhotos) {
  if (!token || !chatId) {
    console.log("Telegram: Missing token or chat ID");
    return false;
  // Force redeploy v26
}
  
  try {
    if (usePhotos) {
      const photo = getDailyPhotoEnhanced_(sheet, clientID);
      if (photo.url) {
        return sendTelegramPhoto_(token, chatId, photo.url, `${message// Force redeploy v26
}\n\n${photo.caption// Force redeploy v26
}`);
      // Force redeploy v26
}
    // Force redeploy v26
}
    
    // Send text message
    const apiUrl = `https://api.telegram.org/bot${token// Force redeploy v26
}/sendMessage`;
    const payload = {
      method: "post",
      payload: {
        chat_id: String(chatId),
        text: message
      // Force redeploy v26
},
      muteHttpExceptions: true
    // Force redeploy v26
};
    
    const response = UrlFetchApp.fetch(apiUrl, payload);
    const responseCode = response.getResponseCode();
    console.log(`Telegram message response: ${responseCode// Force redeploy v26
}`);
    return responseCode >= 200 && responseCode < 300;
    
  // Force redeploy v26
} catch (e) {
    console.error("Telegram error:", e.toString());
    return false;
  // Force redeploy v26
}
// Force redeploy v26
}

function sendTelegramPhoto_(token, chatId, photoUrl, caption) {
  const apiUrl = `https://api.telegram.org/bot${token// Force redeploy v26
}/sendPhoto`;
  const payload = {
    method: "post",
    payload: {
      chat_id: String(chatId),
      photo: photoUrl,
      caption: caption
    // Force redeploy v26
},
    muteHttpExceptions: true
  // Force redeploy v26
};
  
  try {
    const response = UrlFetchApp.fetch(apiUrl, payload);
    const responseCode = response.getResponseCode();
    console.log(`Telegram photo response: ${responseCode// Force redeploy v26
}`);
    return responseCode >= 200 && responseCode < 300;
  // Force redeploy v26
} catch(e) {
    console.error("Telegram photo error:", e.toString());
    return false;
  // Force redeploy v26
}
// Force redeploy v26
}

function makeVoiceCall_(message, toPhone, fromPhone, accountSid, authToken) {
  if (!toPhone || !fromPhone || !accountSid || !authToken) {
    console.log("Voice: Missing Twilio credentials");
    return false;
  // Force redeploy v26
}
  
  // Normalize phone number before calling
  const normalizedPhone = normalizePhoneNumber_(toPhone);
  if (!normalizedPhone) {
    console.error(`Invalid phone number for voice call: ${toPhone// Force redeploy v26
}`);
    return false;
  // Force redeploy v26
}
  
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid// Force redeploy v26
}/Calls.json`;
  const twimlUrl = `https://handler.twilio.com/twiml/EH${accountSid.slice(-10)// Force redeploy v26
}?Text=${encodeURIComponent(xmlEscape_(message))// Force redeploy v26
}`;
  
  const payload = {
    method: "post",
    headers: {
      "Authorization": "Basic " + Utilities.base64Encode(`${accountSid// Force redeploy v26
}:${authToken// Force redeploy v26
}`)
    // Force redeploy v26
},
    payload: {
      "To": normalizedPhone,
      "From": fromPhone,
      "Url": twimlUrl
    // Force redeploy v26
},
    muteHttpExceptions: true
  // Force redeploy v26
};
  
  try {
    const response = UrlFetchApp.fetch(twilioUrl, payload);
    const responseCode = response.getResponseCode();
    console.log(`Voice call response: ${responseCode// Force redeploy v26
} to ${normalizedPhone// Force redeploy v26
}`);
    return responseCode >= 200 && responseCode < 300;
  // Force redeploy v26
} catch (e) {
    console.error("Voice call error:", e.toString());
    return false;
  // Force redeploy v26
}
// Force redeploy v26
}

function makeTwilioCall_(messageToSpeak, to, from, accountSid, authToken) {
  // Normalize phone number before calling
  const normalizedPhone = normalizePhoneNumber_(to);
  if (!normalizedPhone) {
    console.error(`Invalid phone number for Twilio call: ${to// Force redeploy v26
}`);
    return false;
  // Force redeploy v26
}
  
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid// Force redeploy v26
}/Calls.json`;
  const twimlUrl = `https://handler.twilio.com/twiml/EH${accountSid.slice(-10)// Force redeploy v26
}?Text=${encodeURIComponent(xmlEscape_(messageToSpeak))// Force redeploy v26
}`;
  
  const payload = {
    method: "post",
    headers: {
      "Authorization": "Basic " + Utilities.base64Encode(`${accountSid// Force redeploy v26
}:${authToken// Force redeploy v26
}`)
    // Force redeploy v26
},
    payload: {
      "To": normalizedPhone,
      "From": from,
      "Url": twimlUrl
    // Force redeploy v26
},
    muteHttpExceptions: true
  // Force redeploy v26
};
  
  try {
    const response = UrlFetchApp.fetch(twilioUrl, payload);
    const responseCode = response.getResponseCode();
    console.log(`Twilio call response: ${responseCode// Force redeploy v26
} to ${normalizedPhone// Force redeploy v26
} - ${response.getContentText()// Force redeploy v26
}`);
    return responseCode >= 200 && responseCode < 300;
  // Force redeploy v26
} catch (e) {
    console.error(`Error making Twilio call: ${e.toString()// Force redeploy v26
}`);
    return false;
  // Force redeploy v26
}
// Force redeploy v26
}

function xmlEscape_(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
// Force redeploy v26
}

// ===================================================================================
//  WEATHER-BASED SMART COLUMN SELECTION
// ===================================================================================

function randomChoice_(list) {
  if (!list || list.length === 0) return "";
  return list[Math.floor(Math.random() * list.length)];
// Force redeploy v26
}

// Weather-based column selection for midday (12:00)
function chooseMiddayColumn_(weather) {
  // Columns: B=1 (Social), C=2 (Outdoor), D=3 (Indoor)
  
  if (weather.isRaining || weather.isSnowing) {
    // Bad weather: prefer indoor or social activities
    console.log("Bad weather detected for midday - choosing indoor/social activity");
    return randomChoice_([1, 3]); // Social or Indoor
  // Force redeploy v26
} else if (weather.isGoodForOutdoor) {
    // Good weather: prefer outdoor but allow variety
    console.log("Good weather detected for midday - favoring outdoor activity");
    const options = [2, 2, 2, 1, 3]; // 60% outdoor, 20% social, 20% indoor
    return randomChoice_(options);
  // Force redeploy v26
} else if (weather.isCold) {
    // Cold but not raining: indoor preferred, some social
    console.log("Cold weather detected for midday - preferring indoor activities");
    const options = [3, 3, 1]; // 67% indoor, 33% social
    return randomChoice_(options);
  // Force redeploy v26
} else {
    // Neutral weather: equal distribution
    console.log("Neutral weather for midday - equal distribution");
    return randomChoice_([1, 2, 3]);
  // Force redeploy v26
}
// Force redeploy v26
}

// Weather-based column selection for afternoon (16:00)
function chooseAfternoonColumn_(weather) {
  // Columns: E=4 (Social), F=5 (Outdoor), G=6 (Indoor)
  
  if (weather.isRaining || weather.isSnowing) {
    // Bad weather: prefer indoor or social activities
    console.log("Bad weather detected for afternoon - choosing indoor/social activity");
    return randomChoice_([4, 6]); // Social or Indoor
  // Force redeploy v26
} else if (weather.isGoodForOutdoor && weather.temp >= 10) {
    // Good weather and warm enough: strongly prefer outdoor
    console.log("Great weather detected for afternoon - strongly favoring outdoor activity");
    const options = [5, 5, 5, 5, 4]; // 80% outdoor, 20% social
    return randomChoice_(options);
  // Force redeploy v26
} else if (weather.isGoodForOutdoor) {
    // Good weather but cooler: prefer outdoor but allow indoor
    console.log("Good but cool weather for afternoon - favoring outdoor activity");
    const options = [5, 5, 4, 6]; // 50% outdoor, 25% social, 25% indoor
    return randomChoice_(options);
  // Force redeploy v26
} else if (weather.isCold) {
    // Cold: strongly prefer indoor
    console.log("Cold weather detected for afternoon - preferring indoor activities");
    const options = [6, 6, 4]; // 67% indoor, 33% social
    return randomChoice_(options);
  // Force redeploy v26
} else {
    // Neutral weather: slight outdoor preference (afternoon is good for walks)
    console.log("Neutral weather for afternoon - slight outdoor preference");
    const options = [5, 4, 6]; // Equal distribution
    return randomChoice_(options);
  // Force redeploy v26
}
// Force redeploy v26
}

// Helper function to get column names for logging
function getColumnName_(columnIndex) {
  const names = {
    0: "Morning",
    1: "Midday_Social", 
    2: "Midday_Outdoor",
    3: "Midday_Indoor",
    4: "Afternoon_Social",
    5: "Afternoon_Outdoor", 
    6: "Afternoon_Indoor",
    7: "Evening"
  // Force redeploy v26
};
  return names[columnIndex] || "Unknown";
// Force redeploy v26
}

// ===================================================================================
//  TELEGRAM TESTING AND SETUP FUNCTIONS
// ===================================================================================

/**
 * Test function to get Chat ID for a user who has messaged the bot
 * Run this manually in Google Apps Script after the user has sent a message to the bot
 */
function getTelegramChatId() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const telegramToken = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY);
  
  if (!telegramToken) {
    console.error("TELEGRAM_BOT_TOKEN not set in Script Properties");
    return;
  // Force redeploy v26
}
  
  const apiUrl = `https://api.telegram.org/bot${telegramToken// Force redeploy v26
}/getUpdates`;
  
  try {
    const response = UrlFetchApp.fetch(apiUrl);
    const data = JSON.parse(response.getContentText());
    
    if (data.ok && data.result.length > 0) {
      console.log("=== TELEGRAM CHAT IDs ===");
      data.result.forEach((update, index) => {
        if (update.message) {
          const chatId = update.message.chat.id;
          const firstName = update.message.chat.first_name || "Unknown";
          const lastName = update.message.chat.last_name || "";
          const username = update.message.chat.username ? `@${update.message.chat.username// Force redeploy v26
}` : "";
          const messageText = update.message.text || "";
          const date = new Date(update.message.date * 1000).toLocaleString('fi-FI');
          
          console.log(`${index + 1// Force redeploy v26
}. Chat ID: ${chatId// Force redeploy v26
}`);
          console.log(`   Name: ${firstName// Force redeploy v26
} ${lastName// Force redeploy v26
} ${username// Force redeploy v26
}`);
          console.log(`   Last message: "${messageText// Force redeploy v26
}"`);
          console.log(`   Date: ${date// Force redeploy v26
}`);
          console.log("---");
        // Force redeploy v26
}
      // Force redeploy v26
});
      
      // Return the most recent chat ID for easy copying
      const latestUpdate = data.result[data.result.length - 1];
      if (latestUpdate.message) {
        const latestChatId = latestUpdate.message.chat.id;
        console.log(`\n🎯 LATEST CHAT ID (copy this): ${latestChatId// Force redeploy v26
}`);
        return latestChatId;
      // Force redeploy v26
}
    // Force redeploy v26
} else {
      console.log("No messages found. Ask the user to send a message to the bot first.");
    // Force redeploy v26
}
  // Force redeploy v26
} catch (e) {
    console.error("Error getting chat IDs: " + e.toString());
  // Force redeploy v26
}
// Force redeploy v26
}

/**
 * Test function to send a message to a specific chat ID
 * Use this to test the connection before setting up automatic messages
 */
function testTelegramMessage(chatId, message) {
  if (!chatId || !message) {
    console.error("Usage: testTelegramMessage(123456789, 'Test message')");
    return;
  // Force redeploy v26
}
  
  const scriptProperties = PropertiesService.getScriptProperties();
  const telegramToken = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY);
  
  const success = sendTelegramMessage_(telegramToken, chatId, message);
  if (success) {
    console.log(`✅ Test message sent successfully to chat ID: ${chatId// Force redeploy v26
}`);
  // Force redeploy v26
} else {
    console.log(`❌ Failed to send test message to chat ID: ${chatId// Force redeploy v26
}`);
  // Force redeploy v26
}
// Force redeploy v26
}

// ===================================================================================
//  TRIGGER SETUP FUNCTION
// ===================================================================================

function setupHourlyTrigger() {
  console.log("=== Setting up hourly trigger ===");
  
  // Delete existing triggers first
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'mainReminderFunction') {
      ScriptApp.deleteTrigger(trigger);
    // Force redeploy v26
}
  // Force redeploy v26
});
  
  // Create new hourly trigger
  ScriptApp.newTrigger('mainReminderFunction')
    .timeBased()
    .everyHours(1)
    .create();
    
  console.log("✅ Hourly trigger created for mainReminderFunction");
  
  // List all triggers
  const triggers = ScriptApp.getProjectTriggers();
  console.log("Active triggers:", triggers.map(t => `${t.getHandlerFunction()// Force redeploy v26
} - ${t.getTriggerSource()// Force redeploy v26
}`));
// Force redeploy v26
}

// NEW: Test Twilio SMS functionality
function testTwilioSMS() {
  console.log("=== TESTING TWILIO SMS ===");
  
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // Get Twilio credentials
  const accountSid = scriptProperties.getProperty(TWILIO_ACCOUNT_SID_KEY);
  const authToken = scriptProperties.getProperty(TWILIO_AUTH_TOKEN_KEY);
  const fromNumber = scriptProperties.getProperty(TWILIO_FROM_NUMBER_KEY);
  
  // Check if credentials are set
  if (!accountSid || accountSid.includes("YOUR_")) {
    console.log("❌ TWILIO_ACCOUNT_SID not set properly");
    return;
  // Force redeploy v26
}
  
  if (!authToken || authToken.includes("YOUR_")) {
    console.log("❌ TWILIO_AUTH_TOKEN not set properly");
    return;
  // Force redeploy v26
}
  
  if (!fromNumber || fromNumber.includes("YOUR_")) {
    console.log("❌ TWILIO_FROM_NUMBER not set properly");
    return;
  // Force redeploy v26
}
  
  console.log("✅ Twilio credentials found");
  console.log(`From number: ${fromNumber// Force redeploy v26
}`);
  
  // Get test phone number from Config sheet
  try {
    const sheet = SpreadsheetApp.openById(scriptProperties.getProperty(SHEET_ID_KEY));
    const configSheet = sheet.getSheetByName("Config");
    
    if (!configSheet) {
      console.log("❌ Config sheet not found");
      return;
    // Force redeploy v26
}
    
    const configData = configSheet.getDataRange().getValues();
    if (configData.length < 2) {
      console.log("❌ No client data in Config sheet");
      return;
    // Force redeploy v26
}
    
    const rawTestPhone = configData[1][2]; // Phone number from first client
    if (!rawTestPhone) {
      console.log("❌ No phone number found for first client");
      return;
    // Force redeploy v26
}
    
    // Normalize phone number
    const testPhone = normalizePhoneNumber_(rawTestPhone);
    console.log(`Raw phone number: ${rawTestPhone// Force redeploy v26
}`);
    console.log(`Normalized phone number: ${testPhone// Force redeploy v26
}`);
    
    if (!testPhone) {
      console.log("❌ Invalid phone number format");
      return;
    // Force redeploy v26
}
    
    // Send test message
    const testMessage = "Tämä on testimuistuttaja ReminderApp:sta. Aika: " + new Date().toLocaleString('fi-FI');
    
    console.log("Sending test SMS...");
    const success = sendSmsViaTwilio_(testMessage, testPhone, fromNumber, accountSid, authToken);
    
    if (success) {
      console.log("✅ Test SMS sent successfully!");
      console.log(`Message: "${testMessage// Force redeploy v26
}"`);
      console.log(`To: ${testPhone// Force redeploy v26
}`);
    // Force redeploy v26
} else {
      console.log("❌ Failed to send test SMS");
    // Force redeploy v26
}
    
  // Force redeploy v26
} catch (error) {
    console.error("❌ Error in SMS test:", error.toString());
  // Force redeploy v26
}
// Force redeploy v26
}

// NEW: Phone number normalization function
function normalizePhoneNumber_(phoneNumber) {
  if (!phoneNumber) return null;
  
  // Convert to string and remove all spaces, dots, dashes, parentheses
  let normalized = String(phoneNumber).replace(/[\s\.\-\(\)]/g, '');
  
  console.log(`Normalizing phone: "${phoneNumber// Force redeploy v26
}" -> "${normalized// Force redeploy v26
}"`);
  
  // Remove leading zeros
  normalized = normalized.replace(/^0+/, '');
  
  // Handle Finnish numbers
  if (normalized.startsWith('358')) {
    // Already has country code
    normalized = '+' + normalized;
  // Force redeploy v26
} else if (normalized.length === 10 && normalized.startsWith('4') || normalized.startsWith('5')) {
    // Finnish mobile number without country code (like 0401234567 -> 401234567)
    normalized = '+358' + normalized;
  // Force redeploy v26
} else if (normalized.length === 9 && (normalized.startsWith('4') || normalized.startsWith('5'))) {
    // Finnish mobile number without 0 and country code (like 401234567)
    normalized = '+358' + normalized;
  // Force redeploy v26
} else if (!normalized.startsWith('+')) {
    // Try to add + if missing
    normalized = '+' + normalized;
  // Force redeploy v26
}
  
  console.log(`Final normalized phone: "${normalized// Force redeploy v26
}"`);
  
  // Validate format (+country code + number, at least 10 digits total)
  if (normalized.match(/^\+\d{10,15// Force redeploy v26
}$/)) {
    return normalized;
  // Force redeploy v26
} else {
    console.error(`Invalid phone number format: ${normalized// Force redeploy v26
}`);
    return null;
  // Force redeploy v26
}
// Force redeploy v26
}

// NEW: Help function to check Config sheet phone number formatting
function checkPhoneNumberFormats() {
  console.log("=== CHECKING PHONE NUMBER FORMATS ===");
  
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheet = SpreadsheetApp.openById(scriptProperties.getProperty(SHEET_ID_KEY));
    const configSheet = sheet.getSheetByName("Config");
    
    if (!configSheet) {
      console.log("❌ Config sheet not found");
      return;
    // Force redeploy v26
}
    
    const configData = configSheet.getDataRange().getValues();
    console.log("\nPhone numbers in Config sheet:");
    
    for (let i = 1; i < configData.length; i++) {
      const clientID = configData[i][0];
      const rawPhone = configData[i][2];
      
      console.log(`\nClient: ${clientID// Force redeploy v26
}`);
      console.log(`Raw phone: "${rawPhone// Force redeploy v26
}" (type: ${typeof rawPhone// Force redeploy v26
})`);
      
      if (rawPhone) {
        const normalized = normalizePhoneNumber_(rawPhone);
        if (normalized) {
          console.log(`✅ Normalized: ${normalized// Force redeploy v26
}`);
        // Force redeploy v26
} else {
          console.log(`❌ Failed to normalize phone number`);
          console.log(`💡 TIP: In Google Sheets, format this as TEXT:`)
          console.log(`   - Select the phone number cell`);
          console.log(`   - Format → Number → Plain text`);
          console.log(`   - Enter number as: +358401234567`);
        // Force redeploy v26
}
      // Force redeploy v26
} else {
        console.log(`⚠️ No phone number found`);
      // Force redeploy v26
}
    // Force redeploy v26
}
    
    console.log("\n=== PHONE FORMAT TIPS ===");
    console.log("To fix phone number issues in Google Sheets:");
    console.log("1. Select phone number cells in Config sheet");
    console.log("2. Format → Number → Plain text");
    console.log("3. Enter numbers as: +358401234567 (with + prefix)");
    console.log("4. Avoid spaces, dots, or parentheses");
    console.log("5. Save the sheet");
    
  // Force redeploy v26
} catch (error) {
    console.error("Error checking phone formats:", error.toString());
  // Force redeploy v26
}
// Force redeploy v26
}

// NEW: Complete test including Twilio
function testEverythingIncludingTwilio() {
  console.log("=== COMPLETE SYSTEM TEST WITH TWILIO ===");
  
  // Test 1: Script Properties
  console.log("\n1. Testing Script Properties...");
  checkAllScriptProperties();
  
  // Test 2: Sheet Access
  console.log("\n2. Testing Sheet Access...");
  testSheetAccess();
  
  // Test 3: Config Sheet
  console.log("\n3. Testing Config Sheet...");
  testConfigSheet();
  
  // Test 4: Phone Numbers
  console.log("\n4. Checking Phone Number Formats...");
  checkPhoneNumberFormats();
  
  // Test 5: doGet Function
  console.log("\n5. Testing doGet Function...");
  testDoGet();
  
  // Test 6: Google Photos
  console.log("\n6. Testing Google Photos...");
  testGooglePhotos();
  
  // Test 7: Twilio SMS
  console.log("\n7. Testing Twilio SMS...");
  testTwilioSMS();
  
  console.log("\n=== COMPLETE TEST FINISHED ===");
// Force redeploy v26
}

// NEW: Instructions for both Google Photos and Google Drive setup
function photoSetupInstructions() {
  console.log("=== PHOTO SETUP OPTIONS ===");
  console.log("");
  console.log("📸 OPTION 1: Google Photos (photos.google.com) - ADVANCED");
  console.log("❌ Requires complex OAuth setup and API keys");
  console.log("❌ Not recommended for simple family use");
  console.log("");
  console.log("📂 OPTION 2: Google Drive Folder (drive.google.com) - RECOMMENDED");
  console.log("✅ Easy setup, no API keys needed");
  console.log("✅ Works immediately with Google Apps Script");
  console.log("✅ Family can easily add photos");
  console.log("");
  console.log("🚀 QUICK SETUP (Google Drive method):");
  console.log("1. Go to https://drive.google.com");
  console.log("2. Create new folder: 'Äidin kuvat'");
  console.log("3. Upload some photos");
  console.log("4. Copy folder ID from URL:");
  console.log("   https://drive.google.com/drive/folders/1abc123xyz");
  console.log("5. Set GOOGLE_PHOTOS_ALBUM_ID = 1abc123xyz");
  console.log("6. Run: testGooglePhotos()");
  console.log("");
  console.log("💡 Note: Despite the name 'GOOGLE_PHOTOS_ALBUM_ID',");
  console.log("   it works with Google Drive folder IDs for simplicity!");
// Force redeploy v26
}

// NEW: Simple test for any photo method
function testAnyPhotoMethod() {
  console.log("=== TESTING ANY PHOTO METHOD ===");
  
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    const sheet = SpreadsheetApp.openById(sheetId);
    
    const photo = getDailyPhotoEnhanced_(sheet, "mom");
    
    if (photo.url) {
      console.log("✅ Photo system working!");
      console.log(`Photo URL: ${photo.url// Force redeploy v26
}`);
      console.log(`Caption: ${photo.caption// Force redeploy v26
}`);
      
      // Determine which method was used
      if (photo.url.includes('drive.google.com')) {
        console.log("📂 Using: Google Drive folder");
      // Force redeploy v26
} else if (photo.url.includes('photos.google.com')) {
        console.log("📸 Using: Google Photos album");
      // Force redeploy v26
} else {
        console.log("📋 Using: Google Sheets manual URLs");
      // Force redeploy v26
}
    // Force redeploy v26
} else {
      console.log("❌ No photos found");
      console.log("💡 Run: photoSetupInstructions() for help");
    // Force redeploy v26
}
    
  // Force redeploy v26
} catch (error) {
    console.error("❌ Photo test failed:", error.toString());
  // Force redeploy v26
}
// Force redeploy v26
}

// ===================================================================================
//  ACKNOWLEDGMENT NOTIFICATIONS TO FAMILY  
// ===================================================================================