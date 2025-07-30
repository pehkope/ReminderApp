// ===================================================================================
//  SIMPLIFIED REMINDER APP FOR GOOGLE APPS SCRIPT TESTING
// ===================================================================================

// Configuration constants
const SHEET_ID_KEY = "SHEET_ID";
const TELEGRAM_BOT_TOKEN_KEY = "TELEGRAM_BOT_TOKEN";
const WEATHER_API_KEY_KEY = "Weather_Api_Key";

// ===================================================================================
//  SIMPLE API ENDPOINT - FIXED VERSION
// ===================================================================================
function doGet(e) {
  try {
    console.log("doGet called with:", e);
    
    // Safe parameter handling
    const params = (e && e.parameter) ? e.parameter : {};
    const clientID = params.clientID || 'mom';
    
    console.log(`Processing request for clientID: ${clientID}`);

    // Get script properties
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

    // Basic response data
    const responseData = {
      clientID: clientID,
      timestamp: new Date().toISOString(),
      status: "OK",
      message: "ReminderApp API working",
      // Add more data here as needed
      importantMessage: "",
      dailyPhotoUrl: "",
      dailyPhotoCaption: "Ei kuvia vielä käytössä",
      weather: {
        description: "Säätietoja ei saatavilla",
        temperature: "N/A"
      },
      contacts: [],
      latestReminder: "Tervetuloa!"
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

// Helper function to create JSON response
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===================================================================================
//  TEST FUNCTIONS
// ===================================================================================

function testDoGetSimple() {
  console.log("=== Testing Simple doGet ===");
  
  try {
    // Test 1: No parameters
    console.log("Test 1: No parameters");
    const result1 = doGet();
    console.log("Result 1:", result1.getContent());
    
    // Test 2: With parameters
    console.log("Test 2: With clientID");
    const result2 = doGet({ parameter: { clientID: 'mom' } });
    console.log("Result 2:", result2.getContent());
    
    // Test 3: Empty parameter object
    console.log("Test 3: Empty parameters");
    const result3 = doGet({ parameter: {} });
    console.log("Result 3:", result3.getContent());
    
  } catch (error) {
    console.error("Test failed:", error.toString());
  }
  
  console.log("Simple doGet tests completed");
}

function checkScriptProperties() {
  console.log("=== Script Properties Check ===");
  
  const scriptProperties = PropertiesService.getScriptProperties();
  const allProperties = scriptProperties.getProperties();
  
  console.log("Available properties:", Object.keys(allProperties));
  
  // Check required properties
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

function setupScriptProperties() {
  console.log("=== Setting up Script Properties ===");
  
  const scriptProperties = PropertiesService.getScriptProperties();
  
  // Set the known values
  const properties = {
    [SHEET_ID_KEY]: "14i3QPYquqSqyE7fTp_pa2LNBq2Jb_re2rwsuUpRRSHo",
    [TELEGRAM_BOT_TOKEN_KEY]: "7650897551:AAGdACo33Q37dhpUvvlg6XVTzYqjm5oR6xI"
  };
  
  scriptProperties.setProperties(properties);
  console.log("Properties set successfully!");
  
  // Verify
  checkScriptProperties();
}

// ===================================================================================
//  PLACEHOLDER FOR MAIN REMINDER FUNCTION
// ===================================================================================

function mainReminderFunctionSimple() {
  console.log("Simple reminder function - placeholder");
  console.log("Current time:", new Date().toISOString());
  
  // Add your reminder logic here when doGet works
  return "Reminder logic placeholder";
} 