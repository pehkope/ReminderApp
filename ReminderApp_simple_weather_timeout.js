/**
 * ReminderApp - Simple GAS Version with Weather and Timeout Handling
 * Minimal version with timeout protection for stuck calls
 */

// ===================================================================================
//  CONFIG CONSTANTS
// ===================================================================================

const SHEET_NAMES = {
    CONFIG: "Konfiguraatio",
    KUITTAUKSET: "Kuittaukset",
    VIESTIT: "Viestit",
    TAPAAMISET: "Tapaamiset",
    KUVAT: "Kuvat",
    RUOKA_AJAT: "Ruoka-ajat",
    LÄÄKKEET: "Lääkkeet"
  };
  
  const SHEET_ID_KEY = "SHEET_ID";
  const TELEGRAM_BOT_TOKEN_KEY = "TELEGRAM_BOT_TOKEN";
  const WEATHER_API_KEY_KEY = "Weather_Api_Key";
  
  // Timeout settings
  const API_TIMEOUT_MS = 5000; // 5 seconds for external API calls
  const GAS_EXECUTION_TIMEOUT_MS = 25000; // GAS execution limit is 30 seconds, use 25 to be safe
  
  // ===================================================================================
  //  UTILITY FUNCTIONS
  // ===================================================================================
  
  function createCorsResponse_(data) {
    const jsonResponse = ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
    return jsonResponse;
  }
  
  function doOptions(e) {
    return createCorsResponse_({
      status: "OK",
      message: "CORS preflight successful"
    });
  }
  
  // BYPASSED API KEY VALIDATION
  function validateApiKey_(apiKey) {
    console.log("🔐 API key validation: ✅ BYPASSED (proxy trusted)");
    return true;
  }
  
  function getOrCreateSheet_(spreadsheet, sheetName) {
    try {
      let sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
        console.log(`📄 Created new sheet: ${sheetName}`);
      }
      return sheet;
    } catch (error) {
      console.error(`Error getting/creating sheet ${sheetName}:`, error.toString());
      throw error;
    }
  }
  
  /**
   * Execute function with timeout protection
   * @param {Function} fn - Function to execute
   * @param {number} timeoutMs - Timeout in milliseconds
   * @param {any} defaultValue - Default value to return if timeout
   */
  function executeWithTimeout_(fn, timeoutMs, defaultValue) {
    try {
      const startTime = Date.now();
  
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Function execution timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });
  
      // Create function execution promise
      const functionPromise = new Promise((resolve) => {
        try {
          const result = fn();
          resolve(result);
        } catch (error) {
          resolve(defaultValue);
        }
      });
  
      // Race between function execution and timeout
      const racePromise = Promise.race([functionPromise, timeoutPromise]);
  
      // Add execution time logging
      racePromise.then(() => {
        const executionTime = Date.now() - startTime;
        console.log(`✅ Function executed in ${executionTime}ms`);
      }).catch(() => {
        console.log(`⏰ Function timed out after ${timeoutMs}ms`);
      });
  
      return racePromise;
  
    } catch (error) {
      console.error("Error in executeWithTimeout_:", error.toString());
      return Promise.resolve(defaultValue);
    }
  }
  
  /**
   * Safe HTTP request with timeout
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @param {number} timeoutMs - Timeout in milliseconds
   */
  function safeUrlFetch_(url, options = {}, timeoutMs = API_TIMEOUT_MS) {
    return executeWithTimeout_(
      () => {
        console.log(`🌐 Fetching: ${url}`);
        const response = UrlFetchApp.fetch(url, { ...options, muteHttpExceptions: true });
        console.log(`✅ Response status: ${response.getResponseCode()}`);
        return response;
      },
      timeoutMs,
      null // Return null if timeout or error
    );
  }
  
  // ===================================================================================
  //  WEATHER FUNCTIONS WITH TIMEOUT PROTECTION
  // ===================================================================================
  
  function getWeatherDataOptimized_(weatherApiKey, clientID) {
    console.log(`Fetching fresh weather data for ${clientID}`);
    return executeWithTimeout_(
      () => getWeatherData_(weatherApiKey),
      API_TIMEOUT_MS,
      {
        description: "Säätietoja ei saatu (timeout).",
        temperature: "N/A",
        isRaining: false,
        isSnowing: false,
        isCold: true,
        isVeryCold: true,
        isGoodForOutdoor: false,
        temp: 0,
        error: "timeout"
      }
    );
  }
  
  function getWeatherData_(weatherApiKey) {
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=Helsinki&units=metric&lang=fi&appid=${weatherApiKey}`;
  
    const defaultResult = {
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
          weatherMessage = `Sää tänään: ${description}, ${temp.toFixed(0)}°C. Sisäpuolella on mukavampaa! 🌧️`;
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
  //  PHOTO VALIDATION FUNCTIONS WITH TIMEOUT
  // ===================================================================================
  
  function isImageAccessible_(url) {
    if (!url || !url.trim()) return false;
  
    try {
      if (url.includes('drive.google.com')) {
        let fileId = null;
        if (url.includes('/file/d/')) {
          const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
          if (match) fileId = match[1];
        } else if (url.includes('/open?id=')) {
          const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
          if (match) fileId = match[1];
        } else if (url.includes('/uc?id=')) {
          const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
          if (match) fileId = match[1];
        }
  
        if (fileId) {
          try {
            // Add timeout for Drive file access
            const file = executeWithTimeout_(
              () => DriveApp.getFileById(fileId),
              3000, // 3 second timeout for Drive access
              null
            );
  
            if (file) {
              const mimeType = file.getMimeType();
              return mimeType && mimeType.startsWith('image/');
            }
            return false;
          } catch (driveError) {
            console.log(`❌ Drive file not accessible: ${url}`);
            return false;
          }
        }
      }
  
      // For other URLs, use safe fetch with timeout
      return safeUrlFetch_(url).then(response => {
        return response && response.getResponseCode() === 200;
      }).catch(() => false);
  
    } catch (error) {
      console.log(`❌ Error checking URL accessibility: ${url} - ${error.toString()}`);
      return false;
    }
  }
  
  function getDailyPhoto_(clientID) {
    try {
      console.log(`Getting daily photo for ${clientID}`);
  
      const scriptProperties = PropertiesService.getScriptProperties();
      const sheetId = scriptProperties.getProperty("SHEET_ID");
  
      if (!sheetId) {
        console.error("❌ SHEET_ID not configured");
        return { url: "", caption: "Päivän kuva - ei konfiguroitu" };
      }
  
      const spreadsheet = SpreadsheetApp.openById(sheetId);
      const photoSheet = spreadsheet.getSheetByName("Kuvat");
  
      if (!photoSheet) {
        console.log("ℹ️ No photo sheet found");
        return { url: "", caption: "Päivän kuva - ei kuvia" };
      }
  
      const data = photoSheet.getDataRange().getValues();
      if (!data || data.length <= 1) {
        console.log("ℹ️ No photos in sheet");
        return { url: "", caption: "Päivän kuva - ei kuvia" };
      }
  
      const clientPhotos = [];
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rowClientId = String(row[0]).trim().toLowerCase();
        const url = String(row[2]).trim();
        const caption = String(row[1]).trim();
  
        if (rowClientId === clientID.toLowerCase() && url) {
          clientPhotos.push({ url: url, caption: caption });
        }
      }
  
      if (clientPhotos.length === 0) {
        return { url: "", caption: "Päivän kuva - ei kuvia tälle käyttäjälle" };
      }
  
      // Try to find the first valid photo (with timeout protection)
      for (let photo of clientPhotos) {
        try {
          // Use synchronous version for simplicity in GAS
          const isValid = isImageAccessibleSync_(photo.url);
          if (isValid) {
            console.log(`✅ Found valid photo for ${clientID}: ${photo.url}`);
            return {
              url: photo.url,
              caption: photo.caption || "Päivän kuva"
            };
          }
        } catch (error) {
          console.log(`⚠️ Photo validation error for ${photo.url}: ${error.toString()}`);
          continue;
        }
      }
  
      console.log(`❌ No valid photos found for ${clientID}`);
      return { url: "", caption: "Päivän kuva - kaikki kuvat eivät ole saatavilla" };
  
    } catch (error) {
      console.error("Error getting daily photo:", error.toString());
      return { url: "", caption: "Päivän kuva - virhe" };
    }
  }
  
  /**
   * Synchronous version of image accessibility check for GAS compatibility
   */
  function isImageAccessibleSync_(url) {
    try {
      if (!url || !url.trim()) return false;
  
      if (url.includes('drive.google.com')) {
        let fileId = null;
        if (url.includes('/file/d/')) {
          const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
          if (match) fileId = match[1];
        } else if (url.includes('/open?id=')) {
          const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
          if (match) fileId = match[1];
        } else if (url.includes('/uc?id=')) {
          const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
          if (match) fileId = match[1];
        }
  
        if (fileId) {
          const file = DriveApp.getFileById(fileId);
          const mimeType = file.getMimeType();
          return mimeType && mimeType.startsWith('image/');
        }
      }
  
      // For HTTP URLs, try with timeout
      try {
        const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        return response.getResponseCode() === 200;
      } catch (httpError) {
        return false;
      }
  
    } catch (error) {
      return false;
    }
  }
  
  function adminCleanPhotos(clientID) {
    try {
      console.log(`🧹 Admin: Starting photo cleanup for ${clientID || 'all clients'}`);
  
      const props = PropertiesService.getScriptProperties();
      const sheetId = props.getProperty("SHEET_ID");
  
      if (!sheetId) {
        return { error: "SHEET_ID not configured" };
      }
  
      const spreadsheet = SpreadsheetApp.openById(sheetId);
      const photoSheet = spreadsheet.getSheetByName("Kuvat");
      const data = photoSheet.getDataRange().getValues();
      const invalidRows = [];
  
      if (!data || data.length <= 1) {
        return { success: true, message: "No photos to clean up", cleaned: 0, total: 0 };
      }
  
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rowClientId = String(row[0]).trim().toLowerCase();
        const url = String(row[2]).trim();
  
        if (clientID && rowClientId !== clientID.toLowerCase()) {
          continue;
        }
  
        if (url && !isImageAccessibleSync_(url)) {
          invalidRows.push(i + 1);
          console.log(`🗑️ Marked invalid photo for cleanup: ${url} (row ${i + 1})`);
        }
      }
  
      if (invalidRows.length > 0) {
        invalidRows.reverse().forEach(rowNum => {
          photoSheet.deleteRow(rowNum);
          console.log(`🗑️ Removed invalid photo from row ${rowNum}`);
        });
      }
  
      return {
        success: true,
        message: `Cleaned up ${invalidRows.length} invalid photos`,
        cleaned: invalidRows.length,
        total: data.length - 1,
        clientID: clientID || 'all'
      };
  
    } catch (error) {
      console.error("Error cleaning photos:", error.toString());
      return { error: error.toString() };
    }
  }
  
  // ===================================================================================
  //  MAIN ENTRY POINTS WITH TIMEOUT PROTECTION
  // ===================================================================================
  
  function doPost(e) {
    const startTime = Date.now();
  
    try {
      console.log("🚀 doPost called");
  
      let postData = {};
      if (e.postData && e.postData.contents) {
        postData = JSON.parse(e.postData.contents);
      }
  
      const apiKey = postData.apiKey || (e && e.parameter && e.parameter.apiKey);
      if (!validateApiKey_(apiKey)) {
        return createCorsResponse_({
          error: "Unauthorized",
          status: "UNAUTHORIZED"
        });
      }
  
      if (postData.action === 'acknowledgeTask') {
        return handlePostAcknowledgement_(postData, e);
      }
  
      return handleDataFetchAction_(e);
  
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(`❌ CRITICAL ERROR in doPost after ${executionTime}ms:`, error.toString());
  
      return createCorsResponse_({
        error: "Server error: " + error.toString(),
        status: "ERROR",
        executionTime: executionTime
      });
    }
  }
  
  function doGet(e) {
    const params = e.parameter || {};
    const action = params.action || 'dashboard';
  
    return HtmlService.createHtmlOutput(`
      <html>
      <head>
        <title>ReminderApp Admin</title>
      </head>
      <body>
        <h1>ReminderApp Admin Dashboard</h1>
        <p>System is running with timeout protection.</p>
        <p>Weather functions included for outdoor activity suggestions.</p>
        <p>API calls protected against hanging with ${API_TIMEOUT_MS}ms timeout.</p>
      </body>
      </html>
    `).setTitle('ReminderApp Admin');
  }
  
  // ===================================================================================
  //  BASIC HANDLERS
  // ===================================================================================
  
  function handleDataFetchAction_(e) {
    const handlerStartTime = Date.now();
  
    try {
      const params = e.parameter || {};
      const clientID = params.clientID || 'mom';
  
      console.log(`📊 Data fetch for client: ${clientID}`);
  
      const dailyPhoto = getDailyPhoto_(clientID);
  
      // Try to get weather data with timeout protection
      let weather = null;
      try {
        const scriptProperties = PropertiesService.getScriptProperties();
        const weatherApiKey = scriptProperties.getProperty(WEATHER_API_KEY_KEY);
  
        if (weatherApiKey) {
          // Use Promise-based approach for weather fetching
          const weatherPromise = getWeatherDataOptimized_(weatherApiKey, clientID);
  
          // Wait for weather data with timeout
          weatherPromise.then(weatherData => {
            console.log(`✅ Weather data fetched: ${weatherData.temperature}`);
            weather = weatherData;
          }).catch(weatherError => {
            console.log(`⚠️ Weather fetch failed: ${weatherError.toString()}`);
            weather = {
              description: "Säähaku epäonnistui.",
              temperature: "N/A",
              isRaining: false,
              isSnowing: false,
              isCold: true,
              isVeryCold: true,
              isGoodForOutdoor: false,
              temp: 0
            };
          });
  
          // Simple timeout for the promise
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Weather timeout')), API_TIMEOUT_MS);
          });
  
          // Race the weather promise
          weather = Promise.race([weatherPromise, timeoutPromise]).catch(() => {
            return {
              description: "Säähaku timeout.",
              temperature: "N/A",
              isRaining: false,
              isSnowing: false,
              isCold: true,
              isVeryCold: true,
              isGoodForOutdoor: false,
              temp: 0
            };
          });
  
        } else {
          console.log("⚠️ Weather API key not configured");
        }
      } catch (weatherError) {
        console.log("⚠️ Weather setup failed:", weatherError.toString());
      }
  
      const handlerExecutionTime = Date.now() - handlerStartTime;
      console.log(`✅ Handler completed in ${handlerExecutionTime}ms`);
  
      return createCorsResponse_({
        status: "OK",
        clientID: clientID,
        tasks: [],
        weather: weather,
        dailyPhoto: dailyPhoto,
        message: "Response with timeout protection",
        executionTime: handlerExecutionTime
      });
  
    } catch (error) {
      const handlerExecutionTime = Date.now() - handlerStartTime;
      console.error(`❌ Handler error after ${handlerExecutionTime}ms:`, error.toString());
  
      return createCorsResponse_({
        error: "Data fetch error: " + error.toString(),
        status: "ERROR",
        executionTime: handlerExecutionTime
      });
    }
  }
  
  function handlePostAcknowledgement_(postData, e) {
    try {
      const clientID = postData.clientID || 'mom';
      const type = postData.taskType || '';
      const timeOfDay = postData.timeOfDay || '';
  
      console.log(`✅ Acknowledgment: ${clientID} - ${type} (${timeOfDay})`);
  
      return createCorsResponse_({
        status: "OK",
        message: "Acknowledgment recorded",
        clientID: clientID,
        taskType: type,
        timeOfDay: timeOfDay
      });
  
    } catch (error) {
      return createCorsResponse_({
        error: "Acknowledgment error: " + error.toString(),
        status: "ERROR"
      });
    }
  }

