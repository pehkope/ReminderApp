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
    
    // --- ROBUST PARAMETER HANDLING ---
    // Default clientID
    let clientID = 'mom'; 
    
    // Try to find the clientID parameter in multiple ways Google might pass it
    if (e && e.parameter && e.parameter.clientID) {
      clientID = e.parameter.clientID;
    } else if (e && e.parameters && e.parameters.clientID && e.parameters.clientID[0]) {
      // Sometimes parameters are passed as arrays, e.g., { clientID: ['Äiti'] }
      clientID = e.parameters.clientID[0];
    }
    // --- END OF ROBUST HANDLING ---
    
    console.log(`Processing request for clientID: ${clientID}`);

    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    
    if (!sheetId) {
      return createJsonResponse({ 
        error: "SHEET_ID not configured", 
        message: "Please add SHEET_ID to Script Properties",
        clientID: clientID
      });
    }

    // Try to access the sheet
    let sheet;
    try {
      sheet = SpreadsheetApp.openById(sheetId);
    } catch (sheetError) {
      return createJsonResponse({ 
        error: "Cannot access sheet", 
        message: sheetError.toString(),
        sheetId: sheetId
      });
    }

    // Get data from sheets
    const appointment = getTodaysAppointment_(sheet, clientID);
    const upcomingAppointments = getUpcomingAppointments_(sheet, clientID);
    const contacts = getContacts_(sheet, clientID);
    const { usePhotos, useTelegram } = getClientSettings_(sheet, clientID);
    
    // Get photo if enabled
    const photo = usePhotos ? getDailyPhotoEnhanced_(sheet, clientID) : 
                  {url: "", caption: "Kuvat eivät ole vielä käytössä"};
    
    // Get weather (optimized - only at 8, 12, 16, 20)
    const weatherApiKey = scriptProperties.getProperty(WEATHER_API_KEY_KEY);
    const weather = getWeatherDataOptimized_(weatherApiKey, clientID);
    
    // Get last message
    const lastMessage = scriptProperties.getProperty(`lastMessage_${clientID}`) || "Tervetuloa!";
    
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
      },
      importantMessage: appointment,
      upcomingAppointments: upcomingAppointments,
      dailyPhotoUrl: photo.url,
      dailyPhotoCaption: photo.caption,
      weather: {
        description: weather.message,
        temperature: weather.temperature
      },
      contacts: contacts,
      latestReminder: lastMessage,
      dailyTasks: dailyTasks,
      currentTimeOfDay: timeOfDay
    };

    return createJsonResponse(responseData);

  } catch (error) {
    console.error("doGet error:", error.toString());
    return createJsonResponse({ 
      error: error.toString(),
      stack: error.stack
    });
  }
}

// ===================================================================================
//  NEW: POST ENDPOINT FOR ACKNOWLEDGEMENTS
// ===================================================================================
function doPost(e) {
  try {
    console.log("POST request received");
    console.log("POST data:", e.postData ? e.postData.contents : "No POST data");
    
    // Parse the POST data
    let postData;
    try {
      postData = JSON.parse(e.postData.contents);
      console.log("Parsed POST data:", JSON.stringify(postData));
    } catch (parseError) {
      console.error("Error parsing POST data:", parseError.toString());
      return createJsonResponse({
        status: "error",
        message: "Invalid JSON in POST data"
      });
    }
    
    const clientID = postData.clientID;
    const taskType = postData.taskType;
    const timeOfDay = postData.timeOfDay;
    const timestamp = postData.timestamp;
    
    console.log(`Acknowledgment: ${clientID} completed ${taskType} (${timeOfDay}) at ${timestamp}`);
    
    // Save acknowledgment to Google Sheets
    const success = acknowledgeWeeklyTask_(clientID, taskType, timeOfDay, timestamp);
    
    if (success) {
      // Send acknowledgment notifications to family
      await sendAcknowledgmentNotifications_(clientID, taskType, timeOfDay, timestamp);
      
      return createJsonResponse({
        status: "success",
        message: "Task acknowledged successfully",
        clientID: clientID,
        taskType: taskType,
        timeOfDay: timeOfDay,
        timestamp: timestamp
      });
    } else {
      return createJsonResponse({
        status: "error",
        message: "Failed to acknowledge task in Google Sheets"
      });
    }
    
  } catch (error) {
    console.error("Error in doPost:", error.toString());
    return createJsonResponse({
      status: "error",
      message: error.toString()
    });
  }
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
    
    console.log(`Added acknowledgment: ${todayStr} ${timeOfDay} ${taskType} at ${timeStr}`);
    return true;
    
  } catch (error) {
    console.error("Error acknowledging task:", error.toString());
    return false;
  }
}

// Helper function to get a sheet by name or create it if it doesn't exist
function getOrCreateSheet_(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    // Add headers to the new sheet
    sheet.appendRow(["Timestamp", "ClientID", "AcknowledgedTask"]);
    console.log(`Created new sheet: "${sheetName}"`);
  }
  return sheet;
}


// ===================================================================================
//  ORIGINAL FULL doGet FUNCTION (commented out for now)
// ===================================================================================
/*
function doGet_FULL(e) {
  try {
    console.log("doGet called with:", e);
    
    // Safe parameter handling
    const params = (e && e.parameter) ? e.parameter : {};
    const clientID = params.clientID || 'mom';
    
    console.log(`Processing request for clientID: ${clientID}`);

    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    
    if (!sheetId) {
      return createJsonResponse({ 
        error: "SHEET_ID not configured", 
        message: "Please add SHEET_ID to Script Properties",
        clientID: clientID
      });
    }

    // Try to access the sheet
    let sheet;
    try {
      sheet = SpreadsheetApp.openById(sheetId);
    } catch (sheetError) {
      return createJsonResponse({ 
        error: "Cannot access sheet", 
        message: sheetError.toString(),
        sheetId: sheetId
      });
    }

    // Get data from sheets
    const appointment = getTodaysAppointment_(sheet, clientID);
    const upcomingAppointments = getUpcomingAppointments_(sheet, clientID);
    const contacts = getContacts_(sheet, clientID);
    const { usePhotos, useTelegram } = getClientSettings_(sheet, clientID);
    
    // Get photo if enabled
    const photo = usePhotos ? getDailyPhoto_(sheet, clientID) : 
                  {url: "", caption: "Kuvat eivät ole vielä käytössä"};
    
    // Get weather (optimized - only at 8, 12, 16, 20)
    const weatherApiKey = scriptProperties.getProperty(WEATHER_API_KEY_KEY);
    const weather = getWeatherDataOptimized_(weatherApiKey, clientID);
    
    // Get last message
    const lastMessage = scriptProperties.getProperty(`lastMessage_${clientID}`) || "Tervetuloa!";

    const responseData = {
      clientID: clientID,
      timestamp: new Date().toISOString(),
      status: "OK",
      settings: {
        useTelegram: useTelegram,
        usePhotos: usePhotos
      },
      importantMessage: appointment,
      upcomingAppointments: upcomingAppointments,
      dailyPhotoUrl: photo.url,
      dailyPhotoCaption: photo.caption,
      weather: {
        description: weather.message,
        temperature: weather.temperature
      },
      contacts: contacts,
      latestReminder: lastMessage
    };

    return createJsonResponse(responseData);

  } catch (error) {
    console.error("doGet error:", error.toString());
    return createJsonResponse({ 
      error: error.toString(),
      stack: error.stack
    });
  }
}
*/

// Helper function to create JSON response
function createJsonResponse(data) {
  const output = JSON.stringify(data, null, 2);
  return ContentService
    .createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

// ===================================================================================
//  HELPER FUNCTIONS
// ===================================================================================

function getClientSettings_(sheet, clientID) {
  try {
    const configSheet = sheet.getSheetByName("Config");
    if (!configSheet) return { usePhotos: false, useTelegram: false };
    
    const configData = configSheet.getDataRange().getValues();
    
    for (let i = 1; i < configData.length; i++) {
      if (configData[i] && configData[i][0] === clientID) {
        return {
          useTelegram: configData[i][8] === "YES" || configData[i][8] === "yes" || configData[i][8] === true,
          usePhotos: configData[i][9] === "YES" || configData[i][9] === "yes" || configData[i][9] === true
        };
      }
    }
  } catch (error) {
    console.log('Error reading client settings:', error.toString());
  }
  
  return { usePhotos: false, useTelegram: false };
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
          return `📅 ${row[4] || "Tapaaminen"} ${row[3] ? 'kello ' + row[3] : ''} - ${row[2] || ""}`;
        }
      } catch (e) {
        console.error(`Error parsing appointment row ${i}:`, e.toString());
      }
    }
  } catch (error) {
    console.log('Error getting appointments:', error.toString());
  }
  
  return "";
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
    } catch (e1) {
      appointments = sheet.getSheetByName("Appointments").getDataRange().getValues();
    }
  } catch (e) {
    console.log("Appointments/Tapaamiset sheet not found, skipping upcoming appointments check");
    return [];
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
        });
      }
    } catch (e) {
      console.error(`Error parsing upcoming appointment row ${i}: ${e.toString()}`);
    }
  }
  
  // Sort by date
  upcomingAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  return upcomingAppointments;
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
        }
        console.log("Google Photos failed, trying Google Drive method...");
      }
      
      // Method 2: Try Google Drive folder (drive.google.com)
      const drivePhoto = getGooglePhotosImage_(albumId, clientID);
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
    
    const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const photoIndex = dayOfYear % photos.length;
    
    return {
      url: photos[photoIndex][1],
      caption: photos[photoIndex][2] || "Kuva äidille"
    };
  } catch (error) {
    console.log('Error getting photo:', error.toString());
    return {url: "", caption: "Kuvia ei voitu hakea"};
  }
}

// NEW: Google Photos integration - ENHANCED FOR WEEKLY ROTATION
function getGooglePhotosImage_(albumId, clientID) {
  try {
    // Get photos from Google Photos album using Drive API (simpler than Photos API)
    // Google Photos albums can be accessed via Drive if shared properly
    
    const weekNumber = getCurrentWeekNumber_();
    
    // Try to get album photos using Drive API
    const albumUrl = `https://drive.google.com/drive/folders/${albumId}`;
    
    try {
      // PRIORITEETTI 1: Etsi viikkokohtaiset tiedostot (viikko1.jpg, viikko2.jpg, etc.)
      const weeklyFileName = `viikko${weekNumber}.jpg`;
      const weeklyFiles = DriveApp.getFolderById(albumId).getFilesByName(weeklyFileName);
      
      if (weeklyFiles.hasNext()) {
        const weeklyFile = weeklyFiles.next();
        console.log(`✅ Löytyi viikottainen kuva: ${weeklyFileName} viikolle ${weekNumber}`);
        
        return {
          url: `https://drive.google.com/uc?id=${weeklyFile.getId()}`,
          caption: `📅 Viikon ${weekNumber} perhekuva 💕`
        };
      }
      
      console.log(`⚠️ Viikottaista kuvaa ${weeklyFileName} ei löytynyt, käytetään kiertävää järjestelmää`);
      
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
            url: `https://drive.google.com/uc?id=${file.getId()}`,
            caption: file.getName().replace(/\.(jpg|jpeg|png|gif)$/i, '') // Use filename as caption
          });
        }
      }
      
      if (imageFiles.length > 0) {
        // Select image based on week number (cycling through all images)
        const imageIndex = (weekNumber - 1) % imageFiles.length;
        const selectedImage = imageFiles[imageIndex];
        
        console.log(`📸 Viikon ${weekNumber} mukaan valittu kuva ${imageIndex + 1}/${imageFiles.length}: ${selectedImage.name}`);
        
        return {
          url: selectedImage.url,
          caption: `📸 Viikon ${weekNumber} kuva: ${selectedImage.caption} (${imageIndex + 1}/${imageFiles.length})`
        };
      }
      
    } catch (driveError) {
      console.log(`Drive API error for album ${albumId}: ${driveError.toString()}`);
    }
    
    return {url: "", caption: ""};
    
  } catch (error) {
    console.log(`Google Photos error: ${error.toString()}`);
    return {url: "", caption: ""};
  }
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
  }
  
  const weekNumber = getCurrentWeekNumber_();
  console.log(`Testing album ID: ${albumId}`);
  console.log(`Current week number: ${weekNumber}`);
  console.log(`Looking for file: viikko${weekNumber}.jpg`);
  
  try {
    const testPhoto = getGooglePhotosImage_(albumId, "mom");
    
    if (testPhoto.url) {
      console.log("✅ Weekly Photos integration working!");
      console.log(`Photo URL: ${testPhoto.url}`);
      console.log(`Caption: ${testPhoto.caption}`);
    } else {
      console.log("❌ No photos found in album");
      console.log("💡 Check that:");
      console.log("  - Album ID is correct");
      console.log("  - Folder contains image files (viikko1.jpg, viikko2.jpg, etc.)");
      console.log("  - Files are properly named");
      console.log("  - Script has access to the folder");
    }
    
  } catch (error) {
    console.error("❌ Weekly Photos test failed:", error.toString());
  }
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
  }
  
  console.log(`Testing album ID: ${albumId}`);
  
  try {
    const testPhoto = getGooglePhotosImage_(albumId, "mom");
    
    if (testPhoto.url) {
      console.log("✅ Google Photos integration working!");
      console.log(`Photo URL: ${testPhoto.url}`);
      console.log(`Caption: ${testPhoto.caption}`);
    } else {
      console.log("❌ No photos found in album");
      console.log("💡 Check that:");
      console.log("  - Album ID is correct");
      console.log("  - Folder contains image files");
      console.log("  - Script has access to the folder");
    }
    
  } catch (error) {
    console.error("❌ Google Photos test failed:", error.toString());
  }
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
            contacts.push({ name: name1, phone: phone1 });
          }
        }
        
        // Column H (7): Contact2_Name, Column I (8): Contact2_Phone
        if (configData[i][7] && configData[i][8]) {
          const name2 = String(configData[i][7]).trim();
          const phone2 = String(configData[i][8]).replace(/[^+\d]/g, '');
          if (name2 && phone2) {
            contacts.push({ name: name2, phone: phone2 });
          }
        }
        
        console.log(`Found ${contacts.length} contacts for ${clientID}:`, contacts);
        return contacts;
      }
    }
  } catch (error) {
    console.log('Error getting contacts:', error.toString());
  }
  
  return [];
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
        };
        
        // Check if task was acknowledged today from Kuittaukset sheet
        task.isAckedToday = isTaskAckedToday_(sheet, task.type, timeOfDay, today);
        
        tasks.push(task);
      }
    }
    
    return tasks;
  } catch (error) {
    console.log('Error getting daily tasks:', error.toString());
    return [];
  }
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
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error("Error checking acknowledgment:", error.toString());
    return false;
  }
}

function getWeatherData_(weatherApiKey) {
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=Helsinki&units=metric&lang=fi&appid=${weatherApiKey}`;
  let defaultResult = {
    message: "Säätietoja ei saatu.",
    temperature: "N/A",
    isRaining: false,
    isCold: true,
    isGoodForOutdoor: false
  };
  
  try {
    const response = UrlFetchApp.fetch(weatherUrl, { muteHttpExceptions: true });
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
        weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Sisäpuolella on mukavampaa! ☔`;
      } else if (isSnowing) {
        weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Ulkona on kaunista mutta kylmää! ❄️`;
      } else if (isGoodForOutdoor) {
        weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Loistava päivä ulkoiluun! ☀️`;
      } else if (isCold) {
        weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Pukeudu lämpimästi jos menet ulos! 🧥`;
      } else {
        weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C.`;
      }
      
      return {
        message: weatherMessage,
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

function getWeatherDataOptimized_(weatherApiKey, clientID) {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // Cache key with date to refresh daily
  const todayStr = Utilities.formatDate(now, "Europe/Helsinki", "yyyy-MM-dd");
  const cacheKey = `weather_${clientID}_${todayStr}`;
  
  // Check if it's weather update time (8, 12, 16, 20) with 10-minute window
  const isWeatherUpdateTime = (hour === 8 || hour === 12 || hour === 16 || hour === 20) && minute < 10;
  
  try {
    // Get cached weather
    const cachedWeatherStr = PropertiesService.getScriptProperties().getProperty(cacheKey);
    
    // If it's update time, fetch fresh weather
    if (isWeatherUpdateTime) {
      console.log(`Weather update time detected at ${hour}:${minute}, fetching fresh weather for ${clientID}`);
      const freshWeather = getWeatherData_(weatherApiKey);
      
      // Cache the fresh weather
      PropertiesService.getScriptProperties().setProperty(cacheKey, JSON.stringify(freshWeather));
      console.log(`Weather cached for ${clientID} at ${hour}:${minute}`);
      
      return freshWeather;
    }
    
    // If not update time, use cached weather if available
    if (cachedWeatherStr) {
      console.log(`Using cached weather for ${clientID} at ${hour}:${minute}`);
      return JSON.parse(cachedWeatherStr);
    }
    
    // If no cached weather exists, fetch fresh weather (first time today)
    console.log(`No cached weather found for ${clientID}, fetching fresh weather`);
    const freshWeather = getWeatherData_(weatherApiKey);
    PropertiesService.getScriptProperties().setProperty(cacheKey, JSON.stringify(freshWeather));
    
    return freshWeather;
    
  } catch (error) {
    console.error(`Error in weather optimization for ${clientID}: ${error}`);
    // Fallback to direct weather fetch
    return getWeatherData_(weatherApiKey);
  }
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
  };
  
  scriptProperties.setProperties(properties);
  console.log("✅ Properties set successfully!");
  
  checkScriptProperties();
}

// NEW: Complete setup function for all services
function setupAllScriptProperties() {
  console.log("=== Setting up ALL Script Properties ===");
  
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // Basic properties (already working)
  const properties = {
    [SHEET_ID_KEY]: "14i3QPYquqSqyE7fTp_pa2LNBq2Jb_re2rwsuUpRRSHo",
    [TELEGRAM_BOT_TOKEN_KEY]: "7650897551:AAGdACo33Q37dhpUvvlg6XVTzYqjm5oR6xI"
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
      console.log(`✅ ${key}: ${key.includes('TOKEN') ? 'SET (hidden)' : value}`);
    } else {
      console.log(`❌ ${key}: NOT SET`);
    }
  });
  
  return allProperties;
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
      console.log(`✅ ${key}: ${key.includes('TOKEN') || key.includes('KEY') ? 'SET (hidden)' : value}`);
    } else if (value && (value.includes("YOUR_") || value.includes("HERE"))) {
      console.log(`⚠️ ${key}: PLACEHOLDER - Please replace with real value`);
    } else {
      console.log(`❌ ${key}: NOT SET`);
    }
  });
  
  return allProperties;
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
}

function testSheetAccess() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    
    if (!sheetId) {
      console.log("❌ SHEET_ID not set");
      return;
    }
    
    const sheet = SpreadsheetApp.openById(sheetId);
    console.log("✅ Sheet access OK:", sheet.getName());
    
    const sheets = sheet.getSheets();
    console.log("Available sheets:", sheets.map(s => s.getName()));
    
  } catch (error) {
    console.error("❌ Sheet access failed:", error.toString());
  }
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
    }
    
  } catch (error) {
    console.error("❌ Config test failed:", error.toString());
  }
}

function testDoGet() {
  try {
    console.log("Testing doGet function...");
    
    const result1 = doGet();
    console.log("✅ doGet (no params) result:", result1.getContent().substring(0, 100) + "...");
    
    const result2 = doGet({ parameter: { clientID: 'mom' } });
    console.log("✅ doGet (with clientID) result:", result2.getContent().substring(0, 100) + "...");
    
  } catch (error) {
    console.error("❌ doGet test failed:", error.toString());
  }
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
    
    const result2 = doGet({ parameter: { clientID: 'test123' } });
    console.log("✅ doGet with parameters works!");
    console.log("Response:", result2.getContent());
    
  } catch (error) {
    console.error("❌ Simple doGet failed:", error.toString());
  }
}

// ===================================================================================
//  PLACEHOLDER FOR REMINDER FUNCTION
// ===================================================================================

async function mainReminderFunction() {
  const executionTime = new Date();
  console.log(`Main trigger executed at: ${executionTime}`);
  
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

    console.log(`Processing client: ${clientName} (${clientID})`);
    await processSingleClient_(clientID, recipientPhoneNumber, recipientTelegramChatID, executionTime);
  }
  console.log("mainReminderFunction finished.");
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
    const flagKey = `sent_${clientID}_${currentDate}_${currentHour}`;
    if (scriptProperties.getProperty(flagKey) === "true") {
      console.log(`Message for ${clientID} at ${currentHour}:00 has already been sent. Skipping.`);
      return;
    }
    
    const scheduledHours = ["08", "12", "16", "21"];
    if (!scheduledHours.includes(currentHour)) {
        console.log(`No message scheduled for ${clientID} at hour: ${currentHour}`);
        return;
    }
    
    console.log(`Matched ${currentHour}:00 for ${clientID}. Preparing message.`);

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
        console.log(`Midday weather-based choice: column ${columnIndex} (${getColumnName_(columnIndex)})`);
        break;
      case "16": 
        // For afternoon, use weather to choose appropriate activity  
        const weather16 = getWeatherDataOptimized_(weatherApiKey, clientID);
        columnIndex = chooseAfternoonColumn_(weather16);
        console.log(`Afternoon weather-based choice: column ${columnIndex} (${getColumnName_(columnIndex)})`);
        break;
      case "21": 
        columnIndex = 7; // Column H (Klo 21)
        break;
      default:
        console.warn(`No messages configured for hour: ${currentHour}`);
        return;
    }
    
    // Get all message options from the determined column (skip header row)
    const relevantMessages = allMessages.slice(1) // Skip header
                                       .map(row => row[columnIndex])
                                       .filter(msg => msg && msg.trim() !== ""); // Remove empty messages

    if (relevantMessages.length === 0) {
      console.warn(`No messages found for ${currentHour}:00 in column ${columnIndex}.`);
      return;
    }

    let message = randomChoice_(relevantMessages);

    // Inject weather info for midday and afternoon messages
    if (currentHour === "12") {
      const weather12 = getWeatherDataOptimized_(weatherApiKey, clientID);
      if (message.includes("{weather}")) {
        message = message.replace("{weather}", weather12.message);
      } else {
        // Add weather info even if placeholder is not present
        message = `${message}\n\n${weather12.message}`;
      }
    } else if (currentHour === "16") {
      const weather16 = getWeatherDataOptimized_(weatherApiKey, clientID);
      // For afternoon, add weather as additional context
      if (weather16.isGoodForOutdoor && columnIndex === 5) {
        // If outdoor activity was chosen due to good weather, mention it
        message = `${message}\n\n${weather16.message} Hyvä hetki ulkoiluun! 🌟`;
      } else if ((weather16.isRaining || weather16.isCold) && (columnIndex === 4 || columnIndex === 6)) {
        // If indoor/social was chosen due to bad weather, mention it
        message = `${message}\n\n${weather16.message}`;
      }
    }
    
    // Store this message so the tablet app can display it
    scriptProperties.setProperty(`lastMessage_${clientID}`, message);

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
      }
    }
    
    // Check if Telegram is available (if enabled, chat ID is set and token exists)
    const telegramAvailable = useTelegram && telegramToken && recipientTelegramChatID && recipientTelegramChatID !== "";
    
    console.log(`Notification strategy for ${clientID} at ${currentHour}:00 - UseTelegram: ${useTelegram}, UsePhotos: ${usePhotos}, Telegram available: ${telegramAvailable}`);
    
    // STRATEGY: Use the most appropriate channel for each time
    if (currentHour === "08") {
      // MORNING: Gentle start with SMS
      await sendSmsNotification_(message, recipientPhoneNumber, twilioFromNumber, accountSid, authToken, clientID);
      notificationsSent++;
      
    } else if (currentHour === "12") {
             // MIDDAY: Primary channel (Telegram if available, otherwise SMS)
       if (telegramAvailable) {
         await sendTelegramNotification_(sheet, clientID, message, telegramToken, recipientTelegramChatID, usePhotos);
         notificationsSent++;
       } else {
         await sendSmsNotification_(message, recipientPhoneNumber, twilioFromNumber, accountSid, authToken, clientID);
         notificationsSent++;
       }
      
    } else if (currentHour === "16") {
             // AFTERNOON: Dual approach - both SMS and Telegram (if available)
       if (telegramAvailable) {
         await sendTelegramNotification_(sheet, clientID, message, telegramToken, recipientTelegramChatID, usePhotos);
         notificationsSent++;
       }
      // Always send SMS in afternoon as backup/reinforcement
      await sendSmsNotification_(message, recipientPhoneNumber, twilioFromNumber, accountSid, authToken, clientID);
      notificationsSent++;
      
    } else if (currentHour === "21") {
      // EVENING: Strong reminder with voice call + optional telegram
      const callMessage = `Hei äiti. Tämä on Hyvän yön muistuttaja. ${message}`;
      try {
        const callSuccess = makeTwilioCall_(callMessage, recipientPhoneNumber, twilioFromNumber, accountSid, authToken);
        if (callSuccess) {
          notificationsSent++;
          console.log(`Twilio call initiated successfully for ${clientID}`);
        }
      } catch (e) {
        console.error(`Failed to make Twilio call for ${clientID}: ${e.toString()}`);
      }
      
             // Also send gentle telegram message if available (softer than call)
       if (telegramAvailable) {
         await sendTelegramNotification_(sheet, clientID, message, telegramToken, recipientTelegramChatID, usePhotos);
         notificationsSent++;
       }
    }
    
    console.log(`Total notifications sent for ${clientID}: ${notificationsSent}`);
    
    // Set the flag to prevent re-sending
    scriptProperties.setProperty(flagKey, "true");
    console.log(`Flag set: ${flagKey} = true.`);

  } catch (ex) {
    console.error(`Unhandled exception in processSingleClient_ for ${clientID}: ${ex.toString()} \nStack: ${ex.stack}`);
  }
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
    const flagKey = `sent_global_${currentDate}_${currentHour}`;
    
    if (scriptProperties.getProperty(flagKey) === "true") {
      console.log(`Reminder for ${currentHour}:00 already sent today`);
      return { send: false, hour: currentHour };
    }
    
    // Set flag to prevent duplicate sends
    scriptProperties.setProperty(flagKey, "true");
    console.log(`Time to send reminder: ${currentHour}:00`);
    return { send: true, hour: currentHour };
  }
  
  console.log(`Not reminder time. Current: ${currentHour}:${currentMinute}`);
  return { send: false, hour: currentHour };
}

async function sendReminderToClient_(sheet, clientID, phoneNumber, telegramChatID, hour) {
  try {
    console.log(`Sending ${hour}:00 reminder to ${clientID}`);
    
    // Get message from sheet
    const message = getReminderMessage_(sheet, clientID, hour);
    if (!message) {
      console.log(`No message found for ${clientID} at ${hour}:00`);
      return;
    }
    
    // Get client settings
    const { usePhotos, useTelegram } = getClientSettings_(sheet, clientID);
    
    // Store message for tablet display
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty(`lastMessage_${clientID}`, message);
    
    // Send notifications based on strategy
    await executeNotificationStrategy_(sheet, clientID, message, hour, {
      phoneNumber,
      telegramChatID,
      useTelegram,
      usePhotos
    });
    
  } catch (error) {
    console.error(`Error sending reminder to ${clientID}:`, error.toString());
  }
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
        console.log(`Midday weather-based choice: column ${columnIndex} (${getColumnName_(columnIndex)})`);
        break;
      case "16": 
        // For afternoon, use weather to choose appropriate activity  
        const weather16 = getWeatherDataOptimized_(weatherApiKey, clientID);
        columnIndex = chooseAfternoonColumn_(weather16);
        console.log(`Afternoon weather-based choice: column ${columnIndex} (${getColumnName_(columnIndex)})`);
        break;
      case "21": 
        columnIndex = 7; // Column H (Evening)
        break;
      default:
        console.warn(`No messages configured for hour: ${hour}`);
        return null;
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
      if (message.includes("{weather}")) {
        message = message.replace("{weather}", weather12.message);
      } else {
        // Add weather info even if placeholder is not present
        message = `${message}\n\n${weather12.message}`;
      }
    } else if (hour === "16") {
      const weather16 = getWeatherDataOptimized_(weatherApiKey, clientID);
      // For afternoon, add weather as additional context
      if (weather16.isGoodForOutdoor && columnIndex === 5) {
        // If outdoor activity was chosen due to good weather, mention it
        message = `${message}\n\n${weather16.message} Hyvä hetki ulkoiluun! 🌟`;
      } else if ((weather16.isRaining || weather16.isCold) && (columnIndex === 4 || columnIndex === 6)) {
        // If indoor/social was chosen due to bad weather, mention it
        message = `${message}\n\n${weather16.message}`;
      }
    }
    
    return message;
    
  } catch (error) {
    console.error("Error getting reminder message:", error.toString());
    return null;
  }
}

async function executeNotificationStrategy_(sheet, clientID, message, hour, options) {
  const { phoneNumber, telegramChatID, useTelegram, usePhotos } = options;
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // Get Twilio credentials
  const twilioFromNumber = scriptProperties.getProperty(TWILIO_FROM_NUMBER_KEY);
  const authToken = scriptProperties.getProperty(TWILIO_AUTH_TOKEN_KEY);
  const accountSid = scriptProperties.getProperty(TWILIO_ACCOUNT_SID_KEY);
  const telegramToken = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY);
  
  const telegramAvailable = useTelegram && telegramToken && telegramChatID;
  
  console.log(`Strategy for ${clientID} at ${hour}:00 - Telegram: ${telegramAvailable}, Photos: ${usePhotos}`);
  
  // Execute strategy based on time
  if (hour === "08") {
    // Morning: Gentle SMS
    if (phoneNumber && twilioFromNumber && authToken && accountSid) {
      sendSMS_(message, phoneNumber, twilioFromNumber, accountSid, authToken);
    }
    
  } else if (hour === "12") {
    // Midday: Telegram first, SMS backup
    if (telegramAvailable) {
      await sendTelegramMessage_(telegramToken, telegramChatID, message, sheet, clientID, usePhotos);
    } else if (phoneNumber && twilioFromNumber) {
      sendSMS_(message, phoneNumber, twilioFromNumber, accountSid, authToken);
    }
    
  } else if (hour === "16") {
    // Afternoon: Both channels
    if (telegramAvailable) {
      await sendTelegramMessage_(telegramToken, telegramChatID, message, sheet, clientID, usePhotos);
    }
    if (phoneNumber && twilioFromNumber) {
      sendSMS_(message, phoneNumber, twilioFromNumber, accountSid, authToken);
    }
    
  } else if (hour === "21") {
    // Evening: Voice call primary, Telegram secondary
    if (phoneNumber && twilioFromNumber && authToken && accountSid) {
      const callMessage = `Hei äiti. Tämä on illan muistuttaja. ${message}`;
      makeVoiceCall_(callMessage, phoneNumber, twilioFromNumber, accountSid, authToken);
    }
    if (telegramAvailable) {
      await sendTelegramMessage_(telegramToken, telegramChatID, message, sheet, clientID, usePhotos);
    }
  }
}

// ===================================================================================
//  NOTIFICATION SENDING FUNCTIONS - SMART STRATEGY
// ===================================================================================

async function sendSmsNotification_(message, phoneNumber, fromNumber, accountSid, authToken, clientID) {
  try {
    // Normalize phone number before sending
    const normalizedPhone = normalizePhoneNumber_(phoneNumber);
    if (!normalizedPhone) {
      console.error(`Invalid phone number for ${clientID}: ${phoneNumber}`);
      return false;
    }
    
    const smsSuccess = sendSmsViaTwilio_(message, normalizedPhone, fromNumber, accountSid, authToken);
    if (smsSuccess) {
      console.log(`SMS sent successfully for ${clientID} to ${normalizedPhone}`);
      return true;
    }
  } catch (e) {
    console.error(`Failed to send SMS for ${clientID}: ${e.toString()}`);
  }
  return false;
}

async function sendTelegramNotification_(sheet, clientID, message, telegramToken, chatID, usePhotos = false) {
  try {
    let telegramMessage = message;
    
    if (usePhotos) {
      // Try to get photo only if photos are enabled
      const photo = getDailyPhotoEnhanced_(sheet, clientID);
      telegramMessage = photo.caption ? `${message}\n\n${photo.caption}` : message;
      
      if (photo.url) {
        sendTelegramPhoto_(telegramToken, chatID, photo.url, telegramMessage);
        console.log(`Telegram photo message sent successfully for ${clientID}`);
        return true;
      } else {
        console.log(`Photos enabled but no photo found for ${clientID}, sending text only`);
      }
    }
    
    // Send text message (either photos disabled or no photo available)
    sendTelegramMessage_(telegramToken, chatID, telegramMessage);
    console.log(`Telegram text message sent successfully for ${clientID}`);
    return true;
  } catch (e) {
    console.error(`Failed to send Telegram message for ${clientID}: ${e.toString()}`);
  }
  return false;
}

// ===================================================================================
//  ORIGINAL NOTIFICATION FUNCTIONS
// ===================================================================================

function sendSMS_(message, toPhone, fromPhone, accountSid, authToken) {
  if (!toPhone || !fromPhone || !accountSid || !authToken) {
    console.log("SMS: Missing Twilio credentials");
    return false;
  }
  
  // Normalize phone number before sending
  const normalizedPhone = normalizePhoneNumber_(toPhone);
  if (!normalizedPhone) {
    console.error(`Invalid phone number: ${toPhone}`);
    return false;
  }
  
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const payload = {
    method: "post",
    headers: {
      "Authorization": "Basic " + Utilities.base64Encode(`${accountSid}:${authToken}`)
    },
    payload: {
      "To": normalizedPhone,
      "From": fromPhone,
      "Body": message
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(twilioUrl, payload);
    const responseCode = response.getResponseCode();
    console.log(`SMS response: ${responseCode} to ${normalizedPhone}`);
    return responseCode >= 200 && responseCode < 300;
  } catch (e) {
    console.error("SMS error:", e.toString());
    return false;
  }
}

function sendSmsViaTwilio_(messageBody, to, from, accountSid, authToken) {
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  const payload = {
    method: "post",
    headers: {
      "Authorization": "Basic " + Utilities.base64Encode(`${accountSid}:${authToken}`)
    },
    payload: {
      "To": to,
      "From": from,
      "Body": messageBody
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(twilioUrl, payload);
    const responseCode = response.getResponseCode();
    console.log(`Twilio SMS response: ${responseCode} - ${response.getContentText()}`);
    return responseCode >= 200 && responseCode < 300;
  } catch (e) {
    console.error(`Error sending SMS: ${e.toString()}`);
    return false;
  }
}

async function sendTelegramMessage_(token, chatId, message, sheet, clientID, usePhotos) {
  if (!token || !chatId) {
    console.log("Telegram: Missing token or chat ID");
    return false;
  }
  
  try {
    if (usePhotos) {
      const photo = getDailyPhotoEnhanced_(sheet, clientID);
      if (photo.url) {
        return sendTelegramPhoto_(token, chatId, photo.url, `${message}\n\n${photo.caption}`);
      }
    }
    
    // Send text message
    const apiUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const payload = {
      method: "post",
      payload: {
        chat_id: String(chatId),
        text: message
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(apiUrl, payload);
    const responseCode = response.getResponseCode();
    console.log(`Telegram message response: ${responseCode}`);
    return responseCode >= 200 && responseCode < 300;
    
  } catch (e) {
    console.error("Telegram error:", e.toString());
    return false;
  }
}

function sendTelegramPhoto_(token, chatId, photoUrl, caption) {
  const apiUrl = `https://api.telegram.org/bot${token}/sendPhoto`;
  const payload = {
    method: "post",
    payload: {
      chat_id: String(chatId),
      photo: photoUrl,
      caption: caption
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(apiUrl, payload);
    const responseCode = response.getResponseCode();
    console.log(`Telegram photo response: ${responseCode}`);
    return responseCode >= 200 && responseCode < 300;
  } catch(e) {
    console.error("Telegram photo error:", e.toString());
    return false;
  }
}

function makeVoiceCall_(message, toPhone, fromPhone, accountSid, authToken) {
  if (!toPhone || !fromPhone || !accountSid || !authToken) {
    console.log("Voice: Missing Twilio credentials");
    return false;
  }
  
  // Normalize phone number before calling
  const normalizedPhone = normalizePhoneNumber_(toPhone);
  if (!normalizedPhone) {
    console.error(`Invalid phone number for voice call: ${toPhone}`);
    return false;
  }
  
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
  const twimlUrl = `https://handler.twilio.com/twiml/EH${accountSid.slice(-10)}?Text=${encodeURIComponent(xmlEscape_(message))}`;
  
  const payload = {
    method: "post",
    headers: {
      "Authorization": "Basic " + Utilities.base64Encode(`${accountSid}:${authToken}`)
    },
    payload: {
      "To": normalizedPhone,
      "From": fromPhone,
      "Url": twimlUrl
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(twilioUrl, payload);
    const responseCode = response.getResponseCode();
    console.log(`Voice call response: ${responseCode} to ${normalizedPhone}`);
    return responseCode >= 200 && responseCode < 300;
  } catch (e) {
    console.error("Voice call error:", e.toString());
    return false;
  }
}

function makeTwilioCall_(messageToSpeak, to, from, accountSid, authToken) {
  // Normalize phone number before calling
  const normalizedPhone = normalizePhoneNumber_(to);
  if (!normalizedPhone) {
    console.error(`Invalid phone number for Twilio call: ${to}`);
    return false;
  }
  
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
  const twimlUrl = `https://handler.twilio.com/twiml/EH${accountSid.slice(-10)}?Text=${encodeURIComponent(xmlEscape_(messageToSpeak))}`;
  
  const payload = {
    method: "post",
    headers: {
      "Authorization": "Basic " + Utilities.base64Encode(`${accountSid}:${authToken}`)
    },
    payload: {
      "To": normalizedPhone,
      "From": from,
      "Url": twimlUrl
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(twilioUrl, payload);
    const responseCode = response.getResponseCode();
    console.log(`Twilio call response: ${responseCode} to ${normalizedPhone} - ${response.getContentText()}`);
    return responseCode >= 200 && responseCode < 300;
  } catch (e) {
    console.error(`Error making Twilio call: ${e.toString()}`);
    return false;
  }
}

function xmlEscape_(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ===================================================================================
//  WEATHER-BASED SMART COLUMN SELECTION
// ===================================================================================

function randomChoice_(list) {
  if (!list || list.length === 0) return "";
  return list[Math.floor(Math.random() * list.length)];
}

// Weather-based column selection for midday (12:00)
function chooseMiddayColumn_(weather) {
  // Columns: B=1 (Social), C=2 (Outdoor), D=3 (Indoor)
  
  if (weather.isRaining || weather.isSnowing) {
    // Bad weather: prefer indoor or social activities
    console.log("Bad weather detected for midday - choosing indoor/social activity");
    return randomChoice_([1, 3]); // Social or Indoor
  } else if (weather.isGoodForOutdoor) {
    // Good weather: prefer outdoor but allow variety
    console.log("Good weather detected for midday - favoring outdoor activity");
    const options = [2, 2, 2, 1, 3]; // 60% outdoor, 20% social, 20% indoor
    return randomChoice_(options);
  } else if (weather.isCold) {
    // Cold but not raining: indoor preferred, some social
    console.log("Cold weather detected for midday - preferring indoor activities");
    const options = [3, 3, 1]; // 67% indoor, 33% social
    return randomChoice_(options);
  } else {
    // Neutral weather: equal distribution
    console.log("Neutral weather for midday - equal distribution");
    return randomChoice_([1, 2, 3]);
  }
}

// Weather-based column selection for afternoon (16:00)
function chooseAfternoonColumn_(weather) {
  // Columns: E=4 (Social), F=5 (Outdoor), G=6 (Indoor)
  
  if (weather.isRaining || weather.isSnowing) {
    // Bad weather: prefer indoor or social activities
    console.log("Bad weather detected for afternoon - choosing indoor/social activity");
    return randomChoice_([4, 6]); // Social or Indoor
  } else if (weather.isGoodForOutdoor && weather.temp >= 10) {
    // Good weather and warm enough: strongly prefer outdoor
    console.log("Great weather detected for afternoon - strongly favoring outdoor activity");
    const options = [5, 5, 5, 5, 4]; // 80% outdoor, 20% social
    return randomChoice_(options);
  } else if (weather.isGoodForOutdoor) {
    // Good weather but cooler: prefer outdoor but allow indoor
    console.log("Good but cool weather for afternoon - favoring outdoor activity");
    const options = [5, 5, 4, 6]; // 50% outdoor, 25% social, 25% indoor
    return randomChoice_(options);
  } else if (weather.isCold) {
    // Cold: strongly prefer indoor
    console.log("Cold weather detected for afternoon - preferring indoor activities");
    const options = [6, 6, 4]; // 67% indoor, 33% social
    return randomChoice_(options);
  } else {
    // Neutral weather: slight outdoor preference (afternoon is good for walks)
    console.log("Neutral weather for afternoon - slight outdoor preference");
    const options = [5, 4, 6]; // Equal distribution
    return randomChoice_(options);
  }
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
  };
  return names[columnIndex] || "Unknown";
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
  }
  
  const apiUrl = `https://api.telegram.org/bot${telegramToken}/getUpdates`;
  
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
          const username = update.message.chat.username ? `@${update.message.chat.username}` : "";
          const messageText = update.message.text || "";
          const date = new Date(update.message.date * 1000).toLocaleString('fi-FI');
          
          console.log(`${index + 1}. Chat ID: ${chatId}`);
          console.log(`   Name: ${firstName} ${lastName} ${username}`);
          console.log(`   Last message: "${messageText}"`);
          console.log(`   Date: ${date}`);
          console.log("---");
        }
      });
      
      // Return the most recent chat ID for easy copying
      const latestUpdate = data.result[data.result.length - 1];
      if (latestUpdate.message) {
        const latestChatId = latestUpdate.message.chat.id;
        console.log(`\n🎯 LATEST CHAT ID (copy this): ${latestChatId}`);
        return latestChatId;
      }
    } else {
      console.log("No messages found. Ask the user to send a message to the bot first.");
    }
  } catch (e) {
    console.error("Error getting chat IDs: " + e.toString());
  }
}

/**
 * Test function to send a message to a specific chat ID
 * Use this to test the connection before setting up automatic messages
 */
function testTelegramMessage(chatId, message) {
  if (!chatId || !message) {
    console.error("Usage: testTelegramMessage(123456789, 'Test message')");
    return;
  }
  
  const scriptProperties = PropertiesService.getScriptProperties();
  const telegramToken = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY);
  
  const success = sendTelegramMessage_(telegramToken, chatId, message);
  if (success) {
    console.log(`✅ Test message sent successfully to chat ID: ${chatId}`);
  } else {
    console.log(`❌ Failed to send test message to chat ID: ${chatId}`);
  }
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
    }
  });
  
  // Create new hourly trigger
  ScriptApp.newTrigger('mainReminderFunction')
    .timeBased()
    .everyHours(1)
    .create();
    
  console.log("✅ Hourly trigger created for mainReminderFunction");
  
  // List all triggers
  const triggers = ScriptApp.getProjectTriggers();
  console.log("Active triggers:", triggers.map(t => `${t.getHandlerFunction()} - ${t.getTriggerSource()}`));
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
  }
  
  if (!authToken || authToken.includes("YOUR_")) {
    console.log("❌ TWILIO_AUTH_TOKEN not set properly");
    return;
  }
  
  if (!fromNumber || fromNumber.includes("YOUR_")) {
    console.log("❌ TWILIO_FROM_NUMBER not set properly");
    return;
  }
  
  console.log("✅ Twilio credentials found");
  console.log(`From number: ${fromNumber}`);
  
  // Get test phone number from Config sheet
  try {
    const sheet = SpreadsheetApp.openById(scriptProperties.getProperty(SHEET_ID_KEY));
    const configSheet = sheet.getSheetByName("Config");
    
    if (!configSheet) {
      console.log("❌ Config sheet not found");
      return;
    }
    
    const configData = configSheet.getDataRange().getValues();
    if (configData.length < 2) {
      console.log("❌ No client data in Config sheet");
      return;
    }
    
    const rawTestPhone = configData[1][2]; // Phone number from first client
    if (!rawTestPhone) {
      console.log("❌ No phone number found for first client");
      return;
    }
    
    // Normalize phone number
    const testPhone = normalizePhoneNumber_(rawTestPhone);
    console.log(`Raw phone number: ${rawTestPhone}`);
    console.log(`Normalized phone number: ${testPhone}`);
    
    if (!testPhone) {
      console.log("❌ Invalid phone number format");
      return;
    }
    
    // Send test message
    const testMessage = "Tämä on testimuistuttaja ReminderApp:sta. Aika: " + new Date().toLocaleString('fi-FI');
    
    console.log("Sending test SMS...");
    const success = sendSmsViaTwilio_(testMessage, testPhone, fromNumber, accountSid, authToken);
    
    if (success) {
      console.log("✅ Test SMS sent successfully!");
      console.log(`Message: "${testMessage}"`);
      console.log(`To: ${testPhone}`);
    } else {
      console.log("❌ Failed to send test SMS");
    }
    
  } catch (error) {
    console.error("❌ Error in SMS test:", error.toString());
  }
}

// NEW: Phone number normalization function
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
  } else if (normalized.length === 10 && normalized.startsWith('4') || normalized.startsWith('5')) {
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
    console.error(`Invalid phone number format: ${normalized}`);
    return null;
  }
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
    }
    
    const configData = configSheet.getDataRange().getValues();
    console.log("\nPhone numbers in Config sheet:");
    
    for (let i = 1; i < configData.length; i++) {
      const clientID = configData[i][0];
      const rawPhone = configData[i][2];
      
      console.log(`\nClient: ${clientID}`);
      console.log(`Raw phone: "${rawPhone}" (type: ${typeof rawPhone})`);
      
      if (rawPhone) {
        const normalized = normalizePhoneNumber_(rawPhone);
        if (normalized) {
          console.log(`✅ Normalized: ${normalized}`);
        } else {
          console.log(`❌ Failed to normalize phone number`);
          console.log(`💡 TIP: In Google Sheets, format this as TEXT:`)
          console.log(`   - Select the phone number cell`);
          console.log(`   - Format → Number → Plain text`);
          console.log(`   - Enter number as: +358401234567`);
        }
      } else {
        console.log(`⚠️ No phone number found`);
      }
    }
    
    console.log("\n=== PHONE FORMAT TIPS ===");
    console.log("To fix phone number issues in Google Sheets:");
    console.log("1. Select phone number cells in Config sheet");
    console.log("2. Format → Number → Plain text");
    console.log("3. Enter numbers as: +358401234567 (with + prefix)");
    console.log("4. Avoid spaces, dots, or parentheses");
    console.log("5. Save the sheet");
    
  } catch (error) {
    console.error("Error checking phone formats:", error.toString());
  }
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
      console.log(`Photo URL: ${photo.url}`);
      console.log(`Caption: ${photo.caption}`);
      
      // Determine which method was used
      if (photo.url.includes('drive.google.com')) {
        console.log("📂 Using: Google Drive folder");
      } else if (photo.url.includes('photos.google.com')) {
        console.log("📸 Using: Google Photos album");
      } else {
        console.log("📋 Using: Google Sheets manual URLs");
      }
    } else {
      console.log("❌ No photos found");
      console.log("💡 Run: photoSetupInstructions() for help");
    }
    
  } catch (error) {
    console.error("❌ Photo test failed:", error.toString());
  }
}

// ===================================================================================
//  ACKNOWLEDGMENT NOTIFICATIONS TO FAMILY
// ===================================================================================

async function sendAcknowledgmentNotifications_(clientID, taskType, timeOfDay, timestamp) {
  try {
    console.log(`Sending acknowledgment notifications for ${clientID}: ${taskType} (${timeOfDay})`);
    
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    const sheet = SpreadsheetApp.openById(sheetId);
    
    // Get notification recipients from existing Config sheet
    const configSheet = sheet.getSheetByName("Config");
    if (!configSheet) {
      console.error("Config sheet not found for notification config");
      return;
    }
    
    // Find Tiitta and Petri from existing contacts
    let notificationRecipients = [];
    const configData = configSheet.getDataRange().getValues();
    
    for (let i = 1; i < configData.length; i++) {
      const clientID = String(configData[i][0]).trim();
      const name = String(configData[i][1]).trim();
      const phone = String(configData[i][2]).trim();
      
      // Look for Tiitta and Petri contacts
      if (name.toLowerCase().includes('tiitta') || name.toLowerCase().includes('petri')) {
        // Chat ID might be in column D (3) or we'll add it later
        const telegramChatID = configData[i][3] ? String(configData[i][3]).trim() : "";
        
        notificationRecipients.push({
          name: name,
          phone: phone, 
          telegramChatID: telegramChatID
        });
        
        console.log(`Found notification recipient: ${name}, Phone: ${phone}, Chat ID: ${telegramChatID || 'Not set'}`);
      }
    }
    
    // Create acknowledgment message
    const timeStr = new Date(timestamp).toLocaleTimeString('fi-FI', { 
      timeZone: 'Europe/Helsinki',
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const taskEmoji = taskType.toLowerCase() === 'ruoka' ? '🍽️' : 
                     taskType.toLowerCase() === 'lääkkeet' ? '💊' : '✅';
    
    const message = `${taskEmoji} Äiti kuitannut: ${taskType.toUpperCase()} (${timeOfDay})\n🕒 Aika: ${timeStr}\n📍 Sovellus: ReminderApp`;
    
    // Send notifications using existing functions
    const telegramToken = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY);
    const twilioFromNumber = scriptProperties.getProperty(TWILIO_FROM_NUMBER_KEY);
    const accountSid = scriptProperties.getProperty(TWILIO_ACCOUNT_SID_KEY);
    const authToken = scriptProperties.getProperty(TWILIO_AUTH_TOKEN_KEY);
    
    for (const recipient of notificationRecipients) {
      // Strategy: Telegram first, SMS backup
      let sent = false;
      
      // Try Telegram first
      if (telegramToken && recipient.telegramChatID && recipient.telegramChatID !== "") {
        try {
          await sendTelegramNotification_(sheet, clientID, message, telegramToken, recipient.telegramChatID, false);
          console.log(`✅ Telegram acknowledgment sent to ${recipient.name}`);
          sent = true;
        } catch (e) {
          console.error(`❌ Telegram failed for ${recipient.name}: ${e.toString()}`);
        }
      }
      
      // Fallback to SMS if Telegram failed or not available
      if (!sent && twilioFromNumber && authToken && accountSid && recipient.phone && recipient.phone !== "") {
        try {
          await sendSmsNotification_(message, recipient.phone, twilioFromNumber, accountSid, authToken, recipient.name);
          console.log(`✅ SMS acknowledgment sent to ${recipient.name}`);
        } catch (e) {
          console.error(`❌ SMS failed for ${recipient.name}: ${e.toString()}`);
        }
      }
    }
    
  } catch (error) {
    console.error(`Error sending acknowledgment notifications: ${error.toString()}`);
  }
} 