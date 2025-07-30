// --- Configuration Keys ---
// These are now fetched from the Google Sheet, but we keep Twilio/Weather keys here.
// 
// IMPORTANT: Set these in Google Apps Script > Settings > Script Properties:
// SHEET_ID = "14i3QPYquqSqyE7fTp_pa2LNBq2Jb_re2rwsuUpRRSHo"
// TELEGRAM_BOT_TOKEN = "7650897551:AAGdACo33Q37dhpUvvlg6XVTzYqjm5oR6xI"
// Twilio_Phone_Number = "+1234567890"
// Account_SID = "your-twilio-account-sid"
// Twilio_Auth_Token = "your-twilio-auth-token"
// Weather_Api_Key = "your-openweather-api-key"
//
const TWILIO_FROM_NUMBER_KEY = "Twilio_Phone_Number";
const TWILIO_AUTH_TOKEN_KEY = "Twilio_Auth_Token";
const TWILIO_ACCOUNT_SID_KEY = "Account_SID";
const WEATHER_API_KEY_KEY = "Weather_Api_Key";
const TELEGRAM_BOT_TOKEN_KEY = "TELEGRAM_BOT_TOKEN";
const SHEET_ID_KEY = "SHEET_ID";

// ===================================================================================
//  API ENDPOINT FOR THE TABLET APP
//  To use this, you must Deploy the script as a Web App.
//  Deploy > New Deployment > Type: Web App > Execute as: Me > Who has access: Anyone
// ===================================================================================
function doGet(e) {
  try {
    // Check if we have the event parameter object
    if (!e || !e.parameter) {
      console.log('doGet called without parameters, using defaults');
      e = { parameter: {} };
    }
    
    // We get the client ID from the URL, e.g., .../exec?clientID=mom
    const clientID = e.parameter.clientID || 'mom'; // Default to 'mom' if not provided
    console.log(`doGet received request for clientID: ${clientID}`);

    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    
    if (!sheetId) {
      throw new Error('SHEET_ID not configured in Script Properties');
    }
    
    const sheet = SpreadsheetApp.openById(sheetId);
    const weatherApiKey = scriptProperties.getProperty(WEATHER_API_KEY_KEY);
    
    // 1. Get today's appointment
    const appointment = getTodaysAppointment_(sheet, clientID);

    // 1b. Get upcoming appointments (next 7 days)
    const upcomingAppointments = getUpcomingAppointments_(sheet, clientID);

    // 2. Get today's photo (check if photos are enabled)
    let usePhotos = false;
    try {
      const configSheet = sheet.getSheetByName("Config");
      if (configSheet) {
        const configData = configSheet.getDataRange().getValues();
        
        // Find client's photo settings
        for (let i = 1; i < configData.length; i++) {
          if (configData[i] && configData[i][0] === clientID) {
            usePhotos = configData[i][9] === "YES" || configData[i][9] === "yes" || configData[i][9] === true;
            break;
          }
        }
      } else {
        console.log('Config sheet not found, using defaults');
      }
    } catch (configError) {
      console.log('Error reading Config sheet: ' + configError.toString());
    }
    
    const photo = usePhotos ? getDailyPhoto_(sheet, clientID) : {url: "", caption: "Kuvat eivät ole vielä käytössä"};

    // 3. Get weather
    const weather = getWeatherData_(weatherApiKey);

    // 4. Get contacts
    const contacts = getContacts_(sheet, clientID);

    // 5. Get the latest sent message (for display on tablet)
    // We store the last sent message in script properties for the tablet to fetch.
    const lastMessage = scriptProperties.getProperty(`lastMessage_${clientID}`) || "Tervetuloa! Ladataan tietoja...";

    const tabletData = {
      importantMessage: appointment,
      upcomingAppointments: upcomingAppointments,
      dailyPhotoUrl: photo.url,
      dailyPhotoCaption: photo.caption,
      weather: {
        description: weather.message,
        temperature: weather.temperature, // Added temperature for more detail
      },
      contacts: contacts,
      latestReminder: lastMessage,
      timestamp: new Date().toISOString()
    };
    
    // Return data as JSON
    return ContentService.createTextOutput(JSON.stringify(tabletData))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (ex) {
    console.error(`Error in doGet: ${ex.toString()}`);
    return ContentService.createTextOutput(JSON.stringify({ error: ex.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}


// ===================================================================================
//  MAIN TIMED FUNCTION - RUN THIS ON A TRIGGER (e.g., every hour)
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
        const weather12 = getWeatherData_(weatherApiKey);
        columnIndex = chooseMiddayColumn_(weather12);
        console.log(`Midday weather-based choice: column ${columnIndex} (${getColumnName_(columnIndex)})`);
        break;
      case "16": 
        // For afternoon, use weather to choose appropriate activity  
        const weather16 = getWeatherData_(weatherApiKey);
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
      const weather12 = getWeatherData_(weatherApiKey);
      if (message.includes("{weather}")) {
        message = message.replace("{weather}", weather12.message);
      } else {
        // Add weather info even if placeholder is not present
        message = `${message}\n\n${weather12.message}`;
      }
    } else if (currentHour === "16") {
      const weather16 = getWeatherData_(weatherApiKey);
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


// ===================================================================================
//  HELPER FUNCTIONS (DATA FETCHING)
// ===================================================================================

function getTodaysAppointment_(sheet, clientID) {
  const helsinkiTimeZone = "Europe/Helsinki";
  const today = Utilities.formatDate(new Date(), helsinkiTimeZone, "yyyy-MM-dd");
  
  // Check if Appointments/Tapaamiset sheet exists, if not return empty
  let appointments;
  try {
    // Try Finnish name first, then English
    try {
      appointments = sheet.getSheetByName("Tapaamiset").getDataRange().getValues();
    } catch (e1) {
      appointments = sheet.getSheetByName("Appointments").getDataRange().getValues();
    }
  } catch (e) {
    console.log("Appointments/Tapaamiset sheet not found, skipping appointment check");
    return "";
  }
  
  let todaysAppointments = [];
  
  for (let i = 1; i < appointments.length; i++) {
    const row = appointments[i];
    if (!row[0] || !row[1]) continue; // Skip empty rows
    
    try {
      // Check clientID and if the date in the sheet matches today's date
      const appointmentDate = Utilities.formatDate(new Date(row[1]), helsinkiTimeZone, "yyyy-MM-dd");
      if (row[0] === clientID && appointmentDate === today) {
        todaysAppointments.push({
          time: row[3] || "", // Time column (new)
          type: row[4] || "Tapaaminen", // Appointment type (new)
          message: row[2] || "", // Message
          location: row[5] || "" // Location (new)
        });
      }
    } catch (e) {
      console.error(`Error parsing appointment row ${i}: ${e.toString()}`);
    }
  }
  
  if (todaysAppointments.length === 0) return "";
  
  // Format multiple appointments
  if (todaysAppointments.length === 1) {
    const apt = todaysAppointments[0];
    return `📅 ${apt.type} ${apt.time ? 'kello ' + apt.time : ''} ${apt.location ? '(' + apt.location + ')' : ''} - ${apt.message}`;
  } else {
    let message = "📅 Tänään on useita tapaamisia:\n";
    todaysAppointments.forEach((apt, index) => {
      message += `${index + 1}. ${apt.type} ${apt.time ? 'klo ' + apt.time : ''} - ${apt.message}\n`;
    });
    return message;
  }
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

function getDailyPhoto_(sheet, clientID) {
  // Check if Photos sheet exists, if not return empty
  let allPhotos;
  try {
    allPhotos = sheet.getSheetByName("Photos").getDataRange().getValues();
  } catch (e) {
    console.log("Photos sheet not found, using default empty photo");
    return {url: "", caption: ""};
  }
  
  const photos = allPhotos.filter((row, index) => index > 0 && row[0] === clientID); // Skip header and filter by clientID
  
  if (photos.length === 0) return {url: "", caption: ""};
  
  // Cycle through photos daily
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const photoIndex = dayOfYear % photos.length; // No need to add 1 since we already filtered headers
  
  return {
    url: photos[photoIndex][1],
    caption: photos[photoIndex][2] || ""
  };
}

function getContacts_(sheet, clientID) {
  // Check if Config sheet exists, if not return empty array
  let configData;
  try {
    configData = sheet.getSheetByName("Config").getDataRange().getValues();
  } catch (e) {
    console.log("Config sheet not found, using empty contacts list");
    return [];
  }
  
  const contacts = [];
  for(let i = 1; i < configData.length; i++) {
    if (configData[i][0] === clientID) {
      // Assuming Contact1_Name, Contact1_Phone, Contact2_Name, Contact2_Phone
      if (configData[i][4] && configData[i][5]) {
        contacts.push({ name: configData[i][4], phone: configData[i][5] });
      }
      if (configData[i][6] && configData[i][7]) {
        contacts.push({ name: configData[i][6], phone: configData[i][7] });
      }
      // Add more contacts here if needed
      break;
    }
  }
  return contacts;
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


// ===================================================================================
//  NOTIFICATION SENDING FUNCTIONS - SMART STRATEGY
// ===================================================================================

async function sendSmsNotification_(message, phoneNumber, fromNumber, accountSid, authToken, clientID) {
  try {
    const smsSuccess = sendSmsViaTwilio_(message, phoneNumber, fromNumber, accountSid, authToken);
    if (smsSuccess) {
      console.log(`SMS sent successfully for ${clientID}`);
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
      const photo = getDailyPhoto_(sheet, clientID);
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

function sendTelegramPhoto_(botToken, chatId, photoUrl, caption) {
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
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
    console.log(`Telegram photo response: ${responseCode} - ${response.getContentText()}`);
    return responseCode >= 200 && responseCode < 300;
  } catch(e) {
    console.error(`Error sending photo to Telegram: ${e.toString()}`);
    return false;
  }
}

function sendTelegramMessage_(botToken, chatId, message) {
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    method: "post",
    payload: {
      chat_id: String(chatId),
      text: message
    },
    muteHttpExceptions: true
  };
  try {
    const response = UrlFetchApp.fetch(apiUrl, payload);
    const responseCode = response.getResponseCode();
    console.log(`Telegram message response: ${responseCode} - ${response.getContentText()}`);
    return responseCode >= 200 && responseCode < 300;
  } catch(e) {
    console.error(`Error sending message to Telegram: ${e.toString()}`);
    return false;
  }
}

// Your existing sendSmsViaTwilio_, makeTwilioCall_, xmlEscape_, and randomChoice_ functions
// remain here. I'm omitting them for brevity, but you should copy them into this script.
// --- PASTE YOUR ORIGINAL TWILIO/HELPER FUNCTIONS BELOW ---

function makeTwilioCall_(messageToSpeak, to, from, accountSid, authToken) {
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
  const twimlUrl = `https://handler.twilio.com/twiml/EH${accountSid.slice(-10)}?Text=${encodeURIComponent(xmlEscape_(messageToSpeak))}`;
  
  const payload = {
    method: "post",
    headers: {
      "Authorization": "Basic " + Utilities.base64Encode(`${accountSid}:${authToken}`)
    },
    payload: {
      "To": to,
      "From": from,
      "Url": twimlUrl
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(twilioUrl, payload);
    const responseCode = response.getResponseCode();
    console.log(`Twilio call response: ${responseCode} - ${response.getContentText()}`);
    return responseCode >= 200 && responseCode < 300;
  } catch (e) {
    console.error(`Error making Twilio call: ${e.toString()}`);
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

function xmlEscape_(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
//  TESTING AND SETUP FUNCTIONS
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

/**
 * Test function for doGet - call this manually to test the web app
 */
function testDoGet() {
  console.log("Testing doGet function...");
  
  // Test with no parameters (should use defaults)
  const result1 = doGet();
  console.log("Test 1 (no params):", result1.getContent());
  
  // Test with clientID parameter
  const result2 = doGet({ parameter: { clientID: 'mom' } });
  console.log("Test 2 (with clientID):", result2.getContent());
  
  console.log("doGet tests completed");
}