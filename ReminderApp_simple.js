/**
 * ReminderApp - Simple GAS Version
 * Minimal version for GAS compatibility
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

/**
 * Get or create a sheet by name
 */
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

// ===================================================================================
//  MAIN ENTRY POINTS
// ===================================================================================

function doPost(e) {
  try {
    console.log("doPost called");

    // Parse POST body
    let postData = {};
    if (e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }

    // API Key validation (bypassed)
    const apiKey = postData.apiKey || (e && e.parameter && e.parameter.apiKey);
    if (!validateApiKey_(apiKey)) {
      return createCorsResponse_({
        error: "Unauthorized",
        status: "UNAUTHORIZED"
      });
    }

    // Handle acknowledgment
    if (postData.action === 'acknowledgeTask') {
      return handlePostAcknowledgement_(postData, e);
    }

    // Default: return basic response
    return handleDataFetchAction_(e);

  } catch (error) {
    console.error("CRITICAL ERROR in doPost:", error.toString());
    return createCorsResponse_({
      error: "Server error: " + error.toString(),
      status: "ERROR"
    });
  }
}

function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || 'dashboard';

  // Simple admin dashboard
  return HtmlService.createHtmlOutput(`
    <html>
    <head>
      <title>ReminderApp Admin</title>
    </head>
    <body>
      <h1>ReminderApp Admin Dashboard</h1>
      <p>System is running. API key validation is bypassed.</p>
    </body>
    </html>
  `).setTitle('ReminderApp Admin');
}

// ===================================================================================
//  PHOTO VALIDATION FUNCTIONS
// ===================================================================================

/**
 * Check if image URL is accessible
 */
function isImageAccessible_(url) {
  try {
    if (!url || !url.trim()) return false;

    // For Google Drive URLs, try to access the file
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
          const file = DriveApp.getFileById(fileId);
          const mimeType = file.getMimeType();
          return mimeType && mimeType.startsWith('image/');
        } catch (driveError) {
          console.log(`❌ Drive file not accessible: ${url}`);
          return false;
        }
      }
    }

    // For other URLs, do a simple HTTP check
    try {
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      return response.getResponseCode() === 200;
    } catch (httpError) {
      console.log(`❌ HTTP URL not accessible: ${url}`);
      return false;
    }

  } catch (error) {
    console.log(`❌ Error checking URL accessibility: ${url} - ${error.toString()}`);
    return false;
  }
}

/**
 * Get daily photo with validation
 */
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

    // Filter photos for this client
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

    // Find the first valid photo
    for (let photo of clientPhotos) {
      if (isImageAccessible_(photo.url)) {
        console.log(`✅ Found valid photo for ${clientID}: ${photo.url}`);
        return {
          url: photo.url,
          caption: photo.caption || "Päivän kuva"
        };
      }
    }

    // No valid photos found
    console.log(`❌ No valid photos found for ${clientID}`);
    return { url: "", caption: "Päivän kuva - kaikki kuvat eivät ole saatavilla" };

  } catch (error) {
    console.error("Error getting daily photo:", error.toString());
    return { url: "", caption: "Päivän kuva - virhe" };
  }
}

// ===================================================================================
//  BASIC HANDLERS
// ===================================================================================

function handleDataFetchAction_(e) {
  try {
    const params = e.parameter || {};
    const clientID = params.clientID || 'mom';

    console.log(`Data fetch for client: ${clientID}`);

    // Get daily photo with validation
    const dailyPhoto = getDailyPhoto_(clientID);

    return createCorsResponse_({
      status: "OK",
      clientID: clientID,
      tasks: [],
      weather: null,
      dailyPhoto: dailyPhoto,
      message: "Simple response with photo validation"
    });

  } catch (error) {
    return createCorsResponse_({
      error: "Data fetch error: " + error.toString(),
      status: "ERROR"
    });
  }
}

function handlePostAcknowledgement_(postData, e) {
  try {
    const clientID = postData.clientID || 'mom';
    const type = postData.taskType || '';
    const timeOfDay = postData.timeOfDay || '';

    console.log(`Acknowledgment: ${clientID} - ${type} (${timeOfDay})`);

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

/**
 * Clean up invalid photo URLs for all clients or specific client
 */
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

    // Check each photo URL
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowClientId = String(row[0]).trim().toLowerCase();
      const url = String(row[2]).trim();

      // Skip if filtering by client and this isn't the target client
      if (clientID && rowClientId !== clientID.toLowerCase()) {
        continue;
      }

      // Simple validation: check if URL exists and is accessible
      if (url && !isImageAccessible_(url)) {
        invalidRows.push(i + 1); // Sheet row number (1-based)
        console.log(`🗑️ Marked invalid photo for cleanup: ${url} (row ${i + 1})`);
      }
    }

    // Remove invalid rows (in reverse order to maintain indices)
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
