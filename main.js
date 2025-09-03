/**
 * Main entry point for ReminderApp
 * Modularized version using separate modules for different functionalities
 */

// Include all modules
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/config.js').getContentText());
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/utils.js').getContentText());
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/telegram.js').getContentText());
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/sms.js').getContentText());
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/reminders.js').getContentText());
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/weather.js').getContentText());
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/photos.js').getContentText());
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/admin.js').getContentText());
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/dashboard.js').getContentText());

// ===================================================================================
//  MAIN ENTRY POINTS
// ===================================================================================

/**
 * Handle OPTIONS requests for CORS preflight
 */
function doOptions(e) {
  return doOptions(e);
}

/**
 * Main POST handler - routes requests to appropriate modules
 */
function doPost(e) {
  try {
    console.log("doPost called with:", JSON.stringify(e, null, 2));

    // Parse POST body
    let postData = {};
    if (e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }

    // Check for Telegram webhook
    const isTelegramWebhook = postData && (postData.update_id || postData.message || postData.edited_message);
    if (isTelegramWebhook) {
      console.log("✅ Telegram webhook detected, calling handleTelegramWebhook_");
      return handleTelegramWebhook_(e, postData);
    }

    // Validate API key
    const apiKey = postData.apiKey || (e && e.parameter && e.parameter.apiKey);
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
 * Main GET handler - handles admin interface and API routes
 */
function doGet(e) {
  const params = e.parameter || {};
  const action = params.action || 'dashboard';

  // Require authentication for all admin pages
  if (!isAuthenticated_(e)) {
    return HtmlService.createHtmlOutput(getLoginPage_())
      .setTitle('ReminderApp Admin - Login')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // Route to appropriate admin page
  switch (action) {
    case 'webhook':
      return HtmlService.createHtmlOutput(getWebhookAdminPage_())
        .setTitle('ReminderApp - Webhook Management')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    case 'logs':
      return HtmlService.createHtmlOutput(getLogsPage_())
        .setTitle('ReminderApp - System Logs')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    case 'settings':
      return HtmlService.createHtmlOutput(getSettingsPage_())
        .setTitle('ReminderApp - System Settings')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    default:
      return HtmlService.createHtmlOutput(getAdminDashboard_())
        .setTitle('ReminderApp - Admin Dashboard')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * Handle data fetch requests from frontend
 */
function handleDataFetchAction_(e) {
  try {
    const params = e.parameter || {};
    const clientID = params.clientID || 'mom';

    console.log(`📊 Data fetch request for client: ${clientID}`);

    // Get sheet access
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);

    if (!sheetId) {
      return createCorsResponse_({
        error: "Sheet ID not configured",
        status: "ERROR"
      });
    }

    const spreadsheet = SpreadsheetApp.openById(sheetId);

    // Get daily tasks
    const timeOfDay = params.timeOfDay || getTimeOfDay_(new Date());
    const dailyTasks = getDailyTasks_(spreadsheet, clientID, timeOfDay);

    // Get weather data
    const weatherApiKey = scriptProperties.getProperty(WEATHER_API_KEY_KEY);
    const weather = weatherApiKey ? getWeatherDataOptimized_(weatherApiKey, clientID) : null;

    // Get daily photo
    const dailyPhoto = getDailyPhoto_(spreadsheet, clientID);

    // Get latest reminder
    const latestReminder = getLatestReminder_(spreadsheet, clientID);

    // Get upcoming appointments
    const upcomingAppointments = getUpcomingAppointments_(spreadsheet, clientID);

    // Get important message
    const importantMessage = getImportantMessage_(spreadsheet);

    // Get contacts
    const contacts = getContacts_(spreadsheet);

    // Get client settings
    const clientSettings = getClientSettings_(spreadsheet, clientID);

    return createCorsResponse_({
      status: "OK",
      data: {
        clientID,
        timeOfDay,
        tasks: dailyTasks,
        weather,
        dailyPhoto,
        latestReminder,
        upcomingAppointments,
        importantMessage,
        contacts,
        clientSettings
      }
    });

  } catch (error) {
    console.error("Error in data fetch:", error.toString());
    return createCorsResponse_({
      error: "Server error: " + error.toString(),
      status: "ERROR"
    });
  }
}

// ===================================================================================
//  AUTHENTICATION STUBS (for future implementation)
// ===================================================================================

/**
 * Authentication check (placeholder)
 */
function isAuthenticated_(e) {
  // TODO: Implement proper authentication
  return true; // Temporarily allow all access
}

/**
 * Login page (placeholder)
 */
function getLoginPage_() {
  return `
    <html>
    <head>
      <meta charset="utf-8">
      <title>Admin Login</title>
      <style>
        body{font-family:Arial,sans-serif;margin:40px;text-align:center;}
        .login-form{max-width:300px;margin:0 auto;padding:20px;border:1px solid #ddd;border-radius:5px;}
      </style>
    </head>
    <body>
      <h2>🔐 ReminderApp Admin Login</h2>
      <div class="login-form">
        <p>Authentication system will be implemented here.</p>
        <p><a href="?action=dashboard">Continue to Dashboard</a></p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Admin dashboard page (placeholder)
 */
function getAdminDashboard_() {
  return `
    <html>
    <head>
      <meta charset="utf-8">
      <title>Admin Dashboard</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px;}
        .nav{margin-bottom:20px;}
        .nav a{margin-right:15px;padding:5px 10px;text-decoration:none;border:1px solid #ddd;border-radius:3px;}
      </style>
    </head>
    <body>
      <h1>🎛️ ReminderApp Admin Dashboard</h1>
      <div class="nav">
        <a href="?action=webhook">Webhook Management</a>
        <a href="?action=logs">System Logs</a>
        <a href="?action=settings">Settings</a>
      </div>
      <p>Dashboard functionality implemented in dashboard.js module.</p>
    </body>
    </html>
  `;
}

/**
 * Webhook admin page (placeholder)
 */
function getWebhookAdminPage_() {
  return `
    <html>
    <head>
      <meta charset="utf-8">
      <title>Webhook Management</title>
      <style>body{font-family:Arial,sans-serif;margin:20px;}</style>
    </head>
    <body>
      <h2>🔗 Webhook Management</h2>
      <p>Webhook management implemented in telegram.js and admin.js modules.</p>
      <p><a href="?action=dashboard">← Back to Dashboard</a></p>
    </body>
    </html>
  `;
}

// ===================================================================================
//  MISSING FUNCTIONS (to be implemented in appropriate modules)
// ===================================================================================

/**
 * Get contacts from sheet
 */
function getContacts_(sheet) {
  try {
    // TODO: Implement in appropriate module
    return { phone: "", email: "" };
  } catch (error) {
    console.error("Error getting contacts:", error.toString());
    return { phone: "", email: "" };
  }
}

/**
 * Get client settings
 */
function getClientSettings_(sheet, clientID) {
  try {
    // TODO: Implement in appropriate module
    return { timezone: "Europe/Helsinki", language: "fi" };
  } catch (error) {
    console.error("Error getting client settings:", error.toString());
    return { timezone: "Europe/Helsinki", language: "fi" };
  }
}

/**
 * Get latest reminder
 */
function getLatestReminder_(sheet, clientID) {
  try {
    // TODO: Implement in reminders module
    return null;
  } catch (error) {
    console.error("Error getting latest reminder:", error.toString());
    return null;
  }
}

/**
 * Get upcoming appointments
 */
function getUpcomingAppointments_(sheet, clientID) {
  try {
    // TODO: Implement in appropriate module
    return [];
  } catch (error) {
    console.error("Error getting upcoming appointments:", error.toString());
    return [];
  }
}

/**
 * Get important message
 */
function getImportantMessage_(sheet) {
  try {
    // TODO: Implement in appropriate module
    return null;
  } catch (error) {
    console.error("Error getting important message:", error.toString());
    return null;
  }
}
