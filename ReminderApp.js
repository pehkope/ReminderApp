/**
 * Meal suggestions from 'Ruoka-ajat' sheet
 * Columns: A=ClientID, B=Aika (AAMU/PÄIVÄ/ILTA/YÖ), C=Ateria, D=Ehdotus (vaihtoehdot ' | '), E=Kellonaika (HH:mm), F=Tagit
 */
function getMealSuggestions_(sheet, clientID, timeOfDay, now) {
  try {
    const mealsSheet = sheet.getSheetByName(SHEET_NAMES.RUOKA_AJAT);
    if (!mealsSheet) return null;
    const data = mealsSheet.getDataRange().getValues();
    if (!data || data.length <= 1) return null;

    const to = (v) => String(v || '').trim();
    const tod = String(timeOfDay || '').toUpperCase();
    const clientLower = String(clientID || '').trim().toLowerCase();

    // Oletusikkunat (paikallisaika)
    const defaultWindows = {
      AAMU: { start: { h:8, m:0 }, end: { h:9, m:0 } },
      PÄIVÄ: { start: { h:11, m:0 }, end: { h:14, m:0 } },
      PAIVA: { start: { h:11, m:0 }, end: { h:14, m:0 } }, // varmuuden vuoksi
      ILTA: { start: { h:17, m:0 }, end: { h:18, m:0 } },
      YÖ:   { start: { h:21, m:0 }, end: { h:22, m:0 } },
      YO:   { start: { h:21, m:0 }, end: { h:22, m:0 } }
    };

    const inWindow = (n, win) => {
      const s = new Date(n.getFullYear(), n.getMonth(), n.getDate(), win.start.h, win.start.m, 0, 0);
      const e = new Date(n.getFullYear(), n.getMonth(), n.getDate(), win.end.h, win.end.m, 0, 0);
      return n >= s && n <= e;
    };

    const debug = { tod: tod, phase: 'collect', candidates: 0, fallbackRows: 0, defaultUsed: false };
    const candidates = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowClient = to(row[0]).toLowerCase();
      const rowTod = to(row[1]).toUpperCase();
      const mealType = to(row[2]);
      const suggestion = to(row[3]);
      const hhmm = to(row[4]);
      if (!suggestion) continue;
      if (rowClient && rowClient !== clientLower && rowClient !== '*') continue;
      if (rowTod && rowTod !== tod) continue;
      // Aikaikkuna tulkinta:
      // 1) Range "HH:MM-HH:MM" → sisällä = true
      // 2) Yksittäinen "HH:MM" → ±90 min
      // 3) Tyhjä → käytä oletusikkunaa rowTod (tai nykyinen tod)
      let timeMatch = true;
      if (hhmm) {
        const rangeMatch = hhmm.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
        if (rangeMatch) {
          const sh = parseInt(rangeMatch[1])||0, sm = parseInt(rangeMatch[2])||0;
          const eh = parseInt(rangeMatch[3])||0, em = parseInt(rangeMatch[4])||0;
          timeMatch = inWindow(now, { start:{h:sh,m:sm}, end:{h:eh,m:em} });
        } else if (/^\d{1,2}:\d{2}$/.test(hhmm)) {
          const [h, m] = hhmm.split(':').map(x => parseInt(x) || 0);
          const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
          const diffMin = Math.abs((now - target) / 60000);
          timeMatch = diffMin <= 90;
        }
      } else {
        const winKey = rowTod || tod;
        const win = defaultWindows[winKey] || null;
        timeMatch = win ? inWindow(now, win) : true;
      }
      if (!timeMatch) continue;

      const options = suggestion.split('|').map(s => to(s)).filter(s => s);
      if (options.length === 0) continue;
      candidates.push({ mealType, hhmm, options });
    }
    debug.candidates = candidates.length;
    if (candidates.length === 0) {
      // Fallback: valitse seuraavan ateriaikkunan ehdotus, vaikka ei oltaisi sen sisällä
      const order = ['AAMU','PÄIVÄ','ILTA','YÖ'];
      const curIdx = Math.max(0, order.indexOf(tod));
      const nextIdx = (curIdx + 1) % order.length;
      const tryTods = [order[nextIdx], 'AAMU','PÄIVÄ','ILTA','YÖ'];

      let fallbackRows = [];
      for (let k = 0; k < tryTods.length && fallbackRows.length === 0; k++) {
        const targetTod = tryTods[k];
        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          const rowClient = to(row[0]).toLowerCase();
          const rowTod = to(row[1]).toUpperCase();
          const mealType = to(row[2]);
          const suggestion = to(row[3]);
          const hhmm = to(row[4]);
          if (!suggestion) continue;
          if (rowClient && rowClient !== clientLower && rowClient !== '*') continue;
          if (rowTod && rowTod !== targetTod) continue;
          const options = suggestion.split('|').map(s => to(s)).filter(s => s);
          if (options.length === 0) continue;
          fallbackRows.push({ mealType, hhmm, options });
        }
      }
      debug.fallbackRows = fallbackRows.length;

      // Palauta nykyhetken oletus aina (konsistentti UX)
      debug.phase = 'defaults';
      debug.defaultUsed = true;
      const defaults = {
        AAMU: { type: 'aamupala', time: '08:00-09:00', options: ['kaurapuuro marjoilla', 'jugurtti ja banaani', 'leipä + juusto', 'smoothie'] },
        'PÄIVÄ': { type: 'lounas', time: '11:00-14:00', options: ['keitto + leipä', 'kanasalaatti', 'uunilohi ja perunat', 'kasvispasta'] },
        ILTA: { type: 'päivällinen', time: '17:00-18:00', options: ['kasvismunakas', 'kana-riisi', 'tomaattipasta', 'lohisalaatti'] },
        'YÖ': { type: 'yöpala', time: '20:00-21:30', options: ['leipä + maito', 'croissant', 'hedelmä & jugurtti'] }
      };
      const def = defaults[tod] || defaults['PÄIVÄ'];
      return {
        nextMealType: def.type,
        nextMealTime: def.time,
        mealOptions: def.options,
        debug
      };

      const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const pickStable = (len, salt='') => { let h=0; const s=`${clientID}|${tod}|${todayKey}|fallback|${salt}|${len}`; for (let k=0;k<s.length;k++){ h=((h<<5)-h)+s.charCodeAt(k); h|=0; } return Math.abs(h)%len; };
      const chosen = fallbackRows[pickStable(fallbackRows.length)];
      const shuffledIdx = []; for (let i=0;i<chosen.options.length;i++) shuffledIdx.push(i);
      shuffledIdx.sort((a,b)=> (pickStable(chosen.options.length, String(a))-pickStable(chosen.options.length, String(b))));
      const mealOptions = shuffledIdx.slice(0, Math.min(5, chosen.options.length)).map(i=>chosen.options[i]);

      return {
        nextMealType: chosen.mealType,
        nextMealTime: chosen.hhmm,
        mealOptions,
        debug
      };
    }

    // Valitse stabiilisti päivän mukaan 2–3 vaihtoehtoa
    const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const pickStable = (len, salt='') => { let h=0; const s=`${clientID}|${tod}|${todayKey}|${salt}|${len}`; for (let k=0;k<s.length;k++){ h=((h<<5)-h)+s.charCodeAt(k); h|=0; } return Math.abs(h)%len; };
    const chosen = candidates[pickStable(candidates.length)];
    const shuffledIdx = []; for (let i=0;i<chosen.options.length;i++) shuffledIdx.push(i);
    // yksinkertainen deterministinen sekoitus
    shuffledIdx.sort((a,b)=> (pickStable(chosen.options.length, String(a))-pickStable(chosen.options.length, String(b))));
    const mealOptions = shuffledIdx.slice(0, Math.min(5, chosen.options.length)).map(i=>chosen.options[i]);

    debug.phase = 'window';
    return {
      nextMealType: chosen.mealType,
      nextMealTime: chosen.hhmm,
      mealOptions,
      debug
    };
  } catch (__) { return null; }
}
/**
 * ReminderApp Backend for Google Apps Script - Version 2.0 Modular FIXED
 * Yhdistetty versio modulaarisista tiedostoista GAS:ia varten
 * Korjattu duplikaatti-ongelma ja optimoitu notifikaatiot
 */

// ===================================================================================
//  CONSTANTS AND CONFIGURATION  
// ===================================================================================
const SHEET_ID_KEY = "SHEET_ID";
const APP_VERSION = "v2.28.0"; // Päivitä tarvittaessa
const TELEGRAM_BOT_TOKEN_KEY = "TELEGRAM_BOT_TOKEN";
const WEATHER_API_KEY_KEY = "Weather_Api_Key";
const TWILIO_FROM_NUMBER_KEY = "Twilio_Phone_Number";
const TWILIO_AUTH_TOKEN_KEY = "Twilio_Auth_Token";
const TWILIO_ACCOUNT_SID_KEY = "Account_SID";
const GOOGLE_PHOTOS_ALBUM_ID_KEY = "Google_Photos_Album_ID";

const HELSINKI_TIMEZONE = "Europe/Helsinki";
const TELEGRAM_API_BASE = "https://api.telegram.org/bot";
const TELEGRAM_WEBHOOK_SECRET_KEY = "TELEGRAM_WEBHOOK_SECRET";
const TELEGRAM_PHOTOS_FOLDER_ID_KEY = "TELEGRAM_PHOTOS_FOLDER_ID";
const ALLOWED_TELEGRAM_CHAT_IDS_KEY = "ALLOWED_TELEGRAM_CHAT_IDS"; // comma separated
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
    // HARD LOG: ensure WebhookLogs tab is created whenever doPost is hit
    try {
      const propsHL = PropertiesService.getScriptProperties();
      const ssHL = SpreadsheetApp.openById(propsHL.getProperty(SHEET_ID_KEY));
      const shHL = ssHL.getSheetByName('WebhookLogs') || ssHL.insertSheet('WebhookLogs');
      if (shHL.getLastRow() === 0) shHL.appendRow(['Timestamp','Note','PostDataType']);
      shHL.appendRow([new Date(), 'HIT', (e && e.postData && e.postData.type) || 'no-postData']);
    } catch(__) {}
    // Lightweight webhook visibility log
    try { appendWebhookLog_("POST_HIT", (e && e.postData && e.postData.type) || "no-postData"); } catch(__) {}
    
    // Parse POST body
    let postData = {};
    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (parseError) {
        console.error("Failed to parse POST data:", parseError.toString());
        try { appendWebhookLog_("POST_PARSE_ERROR", String(parseError)); } catch(__) {}
        return createCorsResponse_({
          error: "Invalid JSON in POST body",
          status: "ERROR"
        });
      }
    }
    
    // 1) Telegram webhook detection (before API-key checks)
    console.log("🔍 DEBUG: Starting webhook detection");
    console.log("🔍 DEBUG: e exists:", !!e);
    console.log("🔍 DEBUG: postData exists:", !!postData);

    // Enhanced webhook detection - handle cases where e is undefined
    let isTelegramWebhook = false;

    if (postData && (postData.update_id || postData.message || postData.edited_message)) {
      isTelegramWebhook = true;
      console.log("✅ Webhook detected via postData");
    } else if (e && e.parameter && (e.parameter.source === 'telegram' || e.parameter.src === 'tg')) {
      isTelegramWebhook = true;
      console.log("✅ Webhook detected via e.parameter");
    } else {
      console.log("⚠️ No webhook indicators found");
    }

    console.log("🔍 Webhook detection - isTelegramWebhook:", isTelegramWebhook);
    console.log("🔍 e.parameter:", e ? JSON.stringify(e.parameter || {}, null, 2) : "e is null");
    console.log("🔍 postData keys:", postData ? Object.keys(postData) : "null");

    if (isTelegramWebhook) {
      console.log("✅ Telegram webhook detected, calling handleTelegramWebhook_");
      return handleTelegramWebhook_(e, postData);
    }

    // Not a telegram webhook; log minimal info and continue to API auth path
    try { appendWebhookLog_("POST_NOT_TELEGRAM", JSON.stringify((e && e.parameter) || {})); } catch(__) {}

    // 2) API Key authentication for normal POST
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

// ===================================================================================
//  TELEGRAM WEBHOOK HANDLER
// ===================================================================================

// ===================================================================================
//  ADMIN UI FUNCTIONS - Webhook Management & System Administration
// ===================================================================================
// This section provides administrative interface for managing the ReminderApp system.
// Includes webhook management, system monitoring, and administrative controls.
// All admin functions require authentication and are accessible via /admin routes.

/**
 * Main admin interface entry point
 * Handles routing for different admin pages
 * @param {Object} e - GAS event object with parameters
 * @returns {HtmlOutput} Admin page HTML
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
 * Admin API endpoints for AJAX calls from admin UI
 * Handles all administrative operations via POST requests
 * @param {Object|null} e - GAS event object with POST data (optional)
 * @returns {TextOutput} JSON response
 */
function doPost(e = null) {
  console.log("🔍 DEBUG: doPost called with e:", !!e);
  console.log("🔍 DEBUG: e object:", e ? JSON.stringify(e, null, 2) : "UNDEFINED");

  if (!e) {
    console.error("❌ doPost: e parameter is undefined - trying alternative approaches");

    // Try multiple approaches to get POST data
    let postData = null;

    // Method 1: Try HtmlService.getUserAgent() or other GAS globals
    try {
      console.log("🔍 DEBUG: Trying HtmlService approach");
      // This might not work but let's try
      const test = HtmlService.getUserAgent ? HtmlService.getUserAgent() : null;
      console.log("🔍 DEBUG: HtmlService test:", test);
    } catch (htmlError) {
      console.log("⚠️ HtmlService approach failed:", htmlError.toString());
    }

    // Method 2: Try to access raw request via Utilities
    try {
      console.log("🔍 DEBUG: Trying Utilities approach");
      // Try to get request data using GAS Utilities
      if (typeof Utilities !== 'undefined' && Utilities.computeDigest) {
        console.log("✅ Utilities is available");
      }
    } catch (utilError) {
      console.log("⚠️ Utilities approach failed:", utilError.toString());
    }

    // Method 3: Try to use ScriptApp to get execution context
    try {
      console.log("🔍 DEBUG: Trying ScriptApp approach");
      const scriptApp = ScriptApp.getService ? ScriptApp.getService() : null;
      console.log("🔍 DEBUG: ScriptApp available:", !!scriptApp);
    } catch (scriptError) {
      console.log("⚠️ ScriptApp approach failed:", scriptError.toString());
    }

    // Method 4: Direct webhook handling - assume this is a Telegram webhook
    try {
      console.log("🔄 Attempting direct webhook handling");
      // Since we can't get the POST data, let's try to handle it as a simple webhook response
      return createCorsResponse_({
        status: "OK",
        message: "Webhook received but could not parse data"
      });
    } catch (directError) {
      console.error("❌ Direct webhook handling failed:", directError.toString());
    }

    console.error("❌ All fallback methods failed");
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid request - cannot access request data'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const params = e.parameter || {};
  const action = params.action;

  // Verify authentication for all admin operations
  if (!isAuthenticated_(e)) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Unauthorized access - please login first'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    switch (action) {
      case 'toggle_webhook':
        return handleToggleWebhook_(params);
      case 'get_webhook_status':
        return handleGetWebhookStatus_();
      case 'get_dashboard_data':
        return handleGetDashboardData_();
      case 'clear_logs':
        return handleClearLogs_();
      case 'update_settings':
        return handleUpdateSettings_(params);
      default:
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: 'Unknown admin action: ' + action
          }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error('Admin API error:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Server error: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Check if user is authenticated
 */
function isAuthenticated_(e) {
  // Simple authentication using GAS properties
  // In production, use proper OAuth or secure token system
  const adminPassword = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  const sessionToken = PropertiesService.getScriptProperties().getProperty('ADMIN_SESSION_TOKEN');

  // For development: always allow access if no password set OR if it's a GET request (dashboard access)
  if (!adminPassword || (e && !e.postData)) {
    return true; // Allow access for initial setup or GET requests
  }

  // Check session token from cookies/parameters
  const providedToken = (e.parameter && e.parameter.token) ||
                       (e.parameters && e.parameters.token && e.parameters.token[0]);

  return providedToken === sessionToken;
}

/**
 * Generate login page HTML
 */
function getLoginPage_() {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Admin Login</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .login-container { max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input[type="password"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
        .btn:hover { background: #0056b3; }
        .error { color: red; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="login-container">
        <h2>🔐 Admin Login</h2>
        <form id="loginForm">
            <div class="form-group">
                <label for="password">Admin Password:</label>
                <input type="password" id="password" required>
            </div>
            <button type="submit" class="btn">Login</button>
            <div id="error" class="error" style="display:none;"></div>
        </form>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const password = document.getElementById('password').value;

            fetch('/macros/s/' + ScriptApp.getScriptId() + '/exec', {
                method: 'POST',
                body: new URLSearchParams({
                    action: 'login',
                    password: password
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.href = '?action=dashboard&token=' + data.token;
                } else {
                    document.getElementById('error').textContent = data.error || 'Login failed';
                    document.getElementById('error').style.display = 'block';
                }
            })
            .catch(error => {
                document.getElementById('error').textContent = 'Network error';
                document.getElementById('error').style.display = 'block';
            });
        });
    </script>
</body>
</html>`;
}

/**
 * Generate admin dashboard HTML
 */
function getAdminDashboard_() {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Admin Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .nav { background: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .nav a { margin-right: 20px; text-decoration: none; color: #007bff; padding: 8px 16px; border-radius: 4px; }
        .nav a:hover { background: #e9ecef; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-title { font-size: 14px; color: #6c757d; margin-bottom: 10px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #007bff; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎛️ ReminderApp Admin Dashboard</h1>
        <p>Manage your reminder application</p>
    </div>

    <div class="nav">
        <a href="?action=dashboard">📊 Dashboard</a>
        <a href="?action=webhook">🔗 Webhook Management</a>
        <a href="?action=logs">📋 System Logs</a>
        <a href="?action=settings">⚙️ Settings</a>
        <a href="/macros/s/${ScriptApp.getScriptId()}/exec?action=logout" style="color: #dc3545;">🚪 Logout</a>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-title">System Status</div>
            <div class="stat-value" id="systemStatus">Loading...</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">Webhook Status</div>
            <div class="stat-value" id="webhookStatus">Checking...</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">Active Users</div>
            <div class="stat-value">1</div>
        </div>
        <div class="stat-card">
            <div class="stat-title">Total Reminders</div>
            <div class="stat-value" id="totalReminders">Loading...</div>
        </div>
    </div>

    <script>
        // Load dashboard data
        fetch('/macros/s/${ScriptApp.getScriptId()}/exec', {
            method: 'POST',
            body: new URLSearchParams({ action: 'get_dashboard_data' })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('systemStatus').textContent = '✅ Online';
            document.getElementById('webhookStatus').textContent = data.webhookActive ? '✅ Active' : '❌ Inactive';
            document.getElementById('totalReminders').textContent = data.totalReminders || '0';
        })
        .catch(error => {
            console.error('Dashboard error:', error);
        });
    </script>
</body>
</html>`;
}

/**
 * Generate webhook admin page
 */
function getWebhookAdminPage_() {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Webhook Management</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .webhook-card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
        .status-active { background: #28a745; }
        .status-inactive { background: #dc3545; }
        .btn { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; }
        .btn-success { background: #28a745; color: white; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-primary { background: #007bff; color: white; }
        .btn:hover { opacity: 0.8; }
        .info-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        .info-table th, .info-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .info-table th { background: #f8f9fa; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔗 Webhook Management</h1>
        <p>Control Telegram webhook integration</p>
    </div>

    <div class="webhook-card">
        <h3>Webhook Status</h3>
        <p><span id="statusIndicator" class="status-indicator"></span>Status: <span id="webhookStatus">Loading...</span></p>

        <button id="toggleBtn" class="btn btn-primary">Loading...</button>
        <button id="refreshBtn" class="btn btn-primary">🔄 Refresh Status</button>

        <table class="info-table">
            <tr><th>Property</th><th>Value</th></tr>
            <tr><td>URL</td><td id="webhookUrl">-</td></tr>
            <tr><td>Pending Updates</td><td id="pendingUpdates">-</td></tr>
            <tr><td>Last Error</td><td id="lastError">-</td></tr>
            <tr><td>Max Connections</td><td id="maxConnections">-</td></tr>
        </table>
    </div>

    <div class="webhook-card">
        <h3>Recent Logs</h3>
        <div id="logsContainer">Loading logs...</div>
    </div>

    <script>
        let webhookActive = false;

        function updateWebhookStatus(data) {
            const statusEl = document.getElementById('webhookStatus');
            const indicatorEl = document.getElementById('statusIndicator');
            const toggleBtn = document.getElementById('toggleBtn');

            webhookActive = data.active;
            statusEl.textContent = webhookActive ? 'Active' : 'Inactive';
            indicatorEl.className = 'status-indicator ' + (webhookActive ? 'status-active' : 'status-inactive');
            toggleBtn.textContent = webhookActive ? '🔴 Disable Webhook' : '🟢 Enable Webhook';
            toggleBtn.className = 'btn ' + (webhookActive ? 'btn-danger' : 'btn-success');

            document.getElementById('webhookUrl').textContent = data.url || '-';
            document.getElementById('pendingUpdates').textContent = data.pending_update_count || '0';
            document.getElementById('lastError').textContent = data.last_error_message || 'None';
            document.getElementById('maxConnections').textContent = data.max_connections || '-';
        }

        function loadWebhookStatus() {
            fetch('/macros/s/${ScriptApp.getScriptId()}/exec', {
                method: 'POST',
                body: new URLSearchParams({ action: 'get_webhook_status' })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateWebhookStatus(data.webhook);
                } else {
                    console.error('Status error:', data.error);
                }
            })
            .catch(error => console.error('Network error:', error));
        }

        // Toggle webhook
        document.getElementById('toggleBtn').addEventListener('click', function() {
            const action = webhookActive ? 'disable' : 'enable';
            this.textContent = 'Processing...';
            this.disabled = true;

            fetch('/macros/s/${ScriptApp.getScriptId()}/exec', {
                method: 'POST',
                body: new URLSearchParams({
                    action: 'toggle_webhook',
                    webhook_action: action
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    loadWebhookStatus();
                } else {
                    alert('Error: ' + data.error);
                }
                this.disabled = false;
            })
            .catch(error => {
                alert('Network error');
                this.disabled = false;
            });
        });

        // Refresh status
        document.getElementById('refreshBtn').addEventListener('click', loadWebhookStatus);

        // Load initial status
        loadWebhookStatus();
    </script>
</body>
</html>`;
}

/**
 * Handle webhook toggle
 */
function handleToggleWebhook_(params) {
  const action = params.webhook_action;
  const token = PropertiesService.getScriptProperties().getProperty(TELEGRAM_BOT_TOKEN_KEY);

  if (!token) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Bot token not configured' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const scriptId = ScriptApp.getScriptId();
    const webhookUrl = `https://script.google.com/macros/s/${scriptId}/exec`;

    if (action === 'enable') {
      // Set webhook
      const setResponse = UrlFetchApp.fetch(
        `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
      );
      const setData = JSON.parse(setResponse.getContentText());

      if (setData.ok) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            message: 'Webhook enabled successfully'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: setData.description || 'Failed to set webhook'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    } else if (action === 'disable') {
      // Delete webhook
      const deleteResponse = UrlFetchApp.fetch(
        `https://api.telegram.org/bot${token}/deleteWebhook`
      );
      const deleteData = JSON.parse(deleteResponse.getContentText());

      if (deleteData.ok) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: true,
            message: 'Webhook disabled successfully'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            error: deleteData.description || 'Failed to delete webhook'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle webhook status request
 */
function handleGetWebhookStatus_() {
  const token = PropertiesService.getScriptProperties().getProperty(TELEGRAM_BOT_TOKEN_KEY);

  if (!token) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Bot token not configured',
        webhook: { active: false }
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    const response = UrlFetchApp.fetch(
      `https://api.telegram.org/bot${token}/getWebhookInfo`
    );
    const data = JSON.parse(response.getContentText());

    if (data.ok) {
      const webhook = data.result;
      const isActive = webhook.url && webhook.url.length > 0;

      return ContentService
        .createTextOutput(JSON.stringify({
          success: true,
          webhook: {
            active: isActive,
            url: webhook.url,
            pending_update_count: webhook.pending_update_count,
            last_error_message: webhook.last_error_message,
            max_connections: webhook.max_connections
          }
        }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          error: data.description,
          webhook: { active: false }
        }))
        .setMimeType(ContentService.MimeType.JSON);
      }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString(),
        webhook: { active: false }
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle dashboard data request
 * Provides system statistics for admin dashboard
 */
function handleGetDashboardData_() {
  try {
    // Get system information
    const scriptProperties = PropertiesService.getScriptProperties();
    const token = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY);
    const webhookActive = false; // Default, will be updated by webhook status

    // Get basic system stats
    const totalReminders = 0; // TODO: Implement actual reminder counting
    const systemUptime = 'Unknown'; // TODO: Add uptime tracking

    // Get webhook status if token is available
    let webhookInfo = { active: false };
    if (token) {
      try {
        const response = UrlFetchApp.fetch(
          `https://api.telegram.org/bot${token}/getWebhookInfo`
        );
        const data = JSON.parse(response.getContentText());
        if (data.ok) {
          const webhook = data.result;
          webhookInfo = {
            active: webhook.url && webhook.url.length > 0,
            pendingUpdates: webhook.pending_update_count || 0,
            lastError: webhook.last_error_message || null
          };
        }
      } catch (webhookError) {
        console.error('Webhook status check failed:', webhookError);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        data: {
          systemStatus: 'Online',
          webhookActive: webhookInfo.active,
          totalReminders: totalReminders,
          systemUptime: systemUptime,
          pendingUpdates: webhookInfo.pendingUpdates,
          lastWebhookError: webhookInfo.lastError
        }
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: 'Failed to get dashboard data: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ===================================================================================
//  STUB FUNCTIONS FOR FUTURE ADMIN FEATURES
// ===================================================================================

/**
 * Generate logs page (placeholder for future implementation)
 */
function getLogsPage_() {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>System Logs</title>
    <style>body{font-family:Arial,sans-serif;margin:20px}h2{color:#333}</style>
</head>
<body>
    <h2>📋 System Logs</h2>
    <p>Log viewing functionality will be implemented here.</p>
    <p><a href="?action=dashboard">← Back to Dashboard</a></p>
</body>
</html>`;
}

/**
 * Generate settings page (placeholder for future implementation)
 */
function getSettingsPage_() {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>System Settings</title>
    <style>body{font-family:Arial,sans-serif;margin:20px}h2{color:#333}</style>
</head>
<body>
    <h2>⚙️ System Settings</h2>
    <p>Settings management will be implemented here.</p>
    <p><a href="?action=dashboard">← Back to Dashboard</a></p>
</body>
</html>`;
}

/**
 * Handle clear logs request (placeholder)
 */
function handleClearLogs_() {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Logs cleared (placeholder)'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle settings update request (placeholder)
 */
function handleUpdateSettings_(params) {
  return ContentService
    .createTextOutput(JSON.stringify({
      success: true,
      message: 'Settings updated (placeholder)'
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ===================================================================================
//  LEGACY WEBHOOK HANDLER (keeping for compatibility)
// ===================================================================================

/**
 * Legacy webhook handler for Telegram bot integration
 * This function processes incoming Telegram webhook messages
 * @param {Object} e - GAS event object
 * @param {Object} postData - POST data from Telegram
 * @returns {Object} CORS-compliant response
 */
function handleTelegramWebhook_(e, postData) {
  try {
    console.log("🔄 TELEGRAM WEBHOOK RECEIVED AT:", new Date().toISOString());
    console.log("📊 Webhook data received:", !!e, !!postData);
    console.log("🔍 DEBUG: handleTelegramWebhook_ e object:", JSON.stringify(e, null, 2));
    console.log("🔍 DEBUG: handleTelegramWebhook_ postData:", JSON.stringify(postData, null, 2));

    if (!e) {
      console.error("❌ handleTelegramWebhook_: e parameter is undefined");
      return createCorsResponse_({ status: "ERROR", error: "Invalid webhook request - e parameter missing" });
    }
    const scriptProperties = PropertiesService.getScriptProperties();
    const secretExpected = scriptProperties.getProperty(TELEGRAM_WEBHOOK_SECRET_KEY) || "";
    const token = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY) || "";
    console.log("🔑 Token available:", !!token);
    if (!token) {
      console.error("❌ TELEGRAM_BOT_TOKEN missing");
      return createCorsResponse_({ status: "ERROR", error: "Bot token missing" });
    }

    // Verify secret header if configured
    const secretHeader = (e && e.headers && (e.headers["X-Telegram-Bot-Api-Secret-Token"] || e.headers["x-telegram-bot-api-secret-token"])) || "";
    if (secretExpected && secretHeader !== secretExpected) {
      console.error("❌ Invalid telegram secret token");
      try { appendWebhookLog_("SECRET_MISMATCH", `chat:${chatId}`); } catch(__) {}
      return createCorsResponse_({ status: "FORBIDDEN" });
    }

    const update = postData || {};
    console.log("📨 Full update received:", JSON.stringify(update, null, 2));
    const message = update.message || update.edited_message || {};
    const chat = message.chat || {};
    const chatId = String(chat.id || "");
    const caption = String(message.caption || "").trim();
    const text = String(message.text || "").trim();
    console.log("🆔 Update ID:", update.update_id, "Message ID:", message.message_id);
    console.log("💬 Message details - chatId:", chatId, "caption:", caption, "text:", text);
    console.log("📸 Photo exists:", !!message.photo);

    // 🔒 PHOTO LEVEL DEDUPLICATION - Estää samojen kuvien käsittelyn
    console.log("🔍 DEBUG: Starting image deduplication check");

    let fileUniqueIdForDedup = "";
    const photo = message.photo ? message.photo[message.photo.length - 1] : null;
    const document = message.document;

    console.log("🔍 DEBUG: Photo object:", JSON.stringify(photo, null, 2));
    console.log("🔍 DEBUG: Document object:", JSON.stringify(document, null, 2));

    if (photo && photo.file_unique_id) {
      fileUniqueIdForDedup = photo.file_unique_id;
      console.log("🆔 DEBUG: Using photo file_unique_id:", fileUniqueIdForDedup);
    } else if (document && String(document.mime_type || "").startsWith("image/") && document.file_unique_id) {
      fileUniqueIdForDedup = document.file_unique_id;
      console.log("🆔 DEBUG: Using document file_unique_id:", fileUniqueIdForDedup);
    } else {
      console.log("⚠️ DEBUG: No file_unique_id found for deduplication");
    }

    if (fileUniqueIdForDedup) {
      const photoKey = `processed_photo_${fileUniqueIdForDedup}`;
      console.log("🔑 DEBUG: Generated photo key:", photoKey);

      try {
        const props = PropertiesService.getScriptProperties();
        console.log("🔧 DEBUG: PropertiesService initialized");

        const alreadyProcessed = props.getProperty(photoKey);
        console.log("🔍 DEBUG: Properties lookup result for", photoKey, ":", alreadyProcessed);

        if (alreadyProcessed) {
          console.log(`📸 DUPLICATE IMAGE DETECTED: ${fileUniqueIdForDedup} - SKIPPING ENTIRELY`);
          try { appendWebhookLog_('IMAGE_DUPLICATE_SKIP', fileUniqueIdForDedup); } catch(__) {}
          return createCorsResponse_({ status: 'OK' });
        }

        console.log("✅ New image - setting processed flag");
        props.setProperty(photoKey, new Date().toISOString());
        console.log(`💾 Image deduplication flag set for: ${photoKey}`);

        // Verify the property was set
        const verifySet = props.getProperty(photoKey);
        console.log("🔍 DEBUG: Verification - property set correctly:", verifySet);

      } catch (imageDedupError) {
        console.error("❌ Image deduplication error:", imageDedupError.toString());
        console.error("❌ Error stack:", imageDedupError.stack);
        // Jatka normaalisti jos deduplication epäonnistuu
        console.log("⚠️ Continuing without deduplication due to error");
      }
    } else {
      console.log("⚠️ Skipping deduplication - no file_unique_id available");
    }

    // Idempotence guard based on update/message id to avoid duplicate processing
    try {
      const props = PropertiesService.getScriptProperties();
      const uniqueKey = `webhook_${String(update.update_id || '')}_${String(message.message_id || '')}`;
      const processedKey = `processed_${uniqueKey}`;
      console.log("🔑 Webhook key generated:", processedKey);

      const alreadyProcessed = props.getProperty(processedKey);
      console.log("🔍 Props lookup result:", alreadyProcessed);

      if (alreadyProcessed) {
        console.log("🚫 DUPLICATE WEBHOOK CALL - skipping processing");
        try { appendWebhookLog_('IDEMPOTENT_SKIP', uniqueKey); } catch (__) {}
        return createCorsResponse_({ status: 'OK' });
      }

      console.log("✅ New webhook call - setting props");
      props.setProperty(processedKey, new Date().toISOString());
      console.log("💾 Props set for webhook key:", processedKey);
    } catch (propsError) {
      console.error("❌ Props error in webhook guard:", propsError.toString());
    }

    // Whitelist
    const allowedStr = scriptProperties.getProperty(ALLOWED_TELEGRAM_CHAT_IDS_KEY) || "";
    const allowed = allowedStr.split(',').map(x => String(x).trim()).filter(Boolean);
    const isAllowed = (allowed.length === 0) || allowed.includes(chatId);
    if (!isAllowed) {
      console.warn(`⚠️ Telegram chat not allowed: ${chatId}`);
      // Yritä kohtelias vastaus, jotta lähettäjä löytää oman chat id:n
      try { sendTelegramMessage_(token, chatId, `Hei! Tunnisteesi (chat id) on ${chatId}. Pyydä ylläpitoa lisäämään se sallittuihin lähettäjiin.`); } catch (__) {}
      try { appendWebhookLog_("CHAT_NOT_ALLOWED", `chat:${chatId}`); } catch(__) {}
      return createCorsResponse_({ status: "FORBIDDEN" });
    }

    // Resolve clientID from caption/text tag #client:xxx (default mom)
    let clientID = "mom";
    const tagMatch = (caption || text).match(/#client:([a-zA-Z0-9_-]+)/);
    if (tagMatch && tagMatch[1]) clientID = tagMatch[1];

    // Jos teksti-/komentiviesti
    if (text && (text.startsWith('/start') || text.startsWith('/id'))) {
      try {
        sendTelegramMessage_(token, chatId, `Terve! Chat ID: ${chatId}. Voit lisätä captioniin myös #client:mom jos lähetät kuvan.`);
      } catch (__) {}
      return createCorsResponse_({ status: "OK" });
    }

    // Handle photo or document(image/*)
    let fileId = "";
    let fileUniqueId = "";
    const photos = message.photo || [];
    if (photos.length > 0) {
      // Pick largest photo
      const best = photos.reduce((a, b) => ((a.file_size || 0) > (b.file_size || 0) ? a : b), photos[0]);
      fileId = best.file_id;
      fileUniqueId = String(best.file_unique_id || "");
    } else if (message.document && String(message.document.mime_type || "").startsWith("image/")) {
      fileId = message.document.file_id;
      fileUniqueId = String(message.document.file_unique_id || "");
    }

    if (!fileId) {
      console.log("❌ No image content (photo or image document) in telegram message; ignoring");
      console.log("📷 Available message properties:", Object.keys(message));
      try { appendWebhookLog_("NO_IMAGE_CONTENT", `chat:${chatId}`); } catch(__) {}
      return createCorsResponse_({ status: "OK" });
    }

    console.log("✅ Found image fileId:", fileId);

    // 🔍 VAHVISTETTU DUPLIKAATTI TARKISTUS ENNEN LADONTAA
    // Tarkista sekä fileUniqueId että fileId perusteella
    let duplicateSheet, duplicatePhotoSheet;
    try {
      const duplicateSheetId = scriptProperties.getProperty(SHEET_ID_KEY);
      if (!duplicateSheetId) {
        throw new Error("SHEET_ID_KEY not configured for duplicate check");
      }
      duplicateSheet = SpreadsheetApp.openById(duplicateSheetId);
      duplicatePhotoSheet = duplicateSheet.getSheetByName(SHEET_NAMES.KUVAT) || duplicateSheet.insertSheet(SHEET_NAMES.KUVAT);
    } catch (duplicateError) {
      console.error("❌ Duplicate check sheet access error:", duplicateError.toString());
      // Jatka ilman duplikaatti tarkistusta jos sheet ei ole saatavilla
      console.log("⚠️ Continuing without duplicate check due to sheet error");
    }

    if (duplicatePhotoSheet && duplicatePhotoSheet.getLastRow() > 1) {
      const existingData = duplicatePhotoSheet.getRange(2, 1, duplicatePhotoSheet.getLastRow() - 1, 4).getValues();

      // Tarkista fileUniqueId (column D)
      if (fileUniqueId) {
        console.log("🔍 Checking fileUniqueId:", fileUniqueId);
        const isDuplicateUid = existingData.some(row =>
          String(row[3] || "").includes(fileUniqueId) ||
          String(row[3] || "").includes("uid:" + fileUniqueId)
        );
        console.log("🔍 FileUniqueId duplicate check result:", isDuplicateUid);
        if (isDuplicateUid) {
          console.log("🛑 DUPLICATE FILE UID detected - skipping entirely:", fileUniqueId);
          sendTelegramMessage_(token, chatId, "Kuva on jo tallennettu aiemmin, ei lisätty uudelleen.");
          return createCorsResponse_({ status: "OK" });
        }
      } else {
        console.log("⚠️ No fileUniqueId available for duplicate check");
      }

      // Tarkista myös fileId jos saatavilla (varmuuden vuoksi)
      console.log("🔍 Checking fileId:", fileId);
      const isDuplicateFileId = existingData.some(row =>
        String(row[0] || "").includes(`fileId:${fileId}`)
      );
      console.log("🔍 FileId duplicate check result:", isDuplicateFileId);
              if (isDuplicateFileId) {
          console.log("🛑 DUPLICATE FILE ID detected - skipping entirely:", fileId);
          try {
            // Käytä PropertiesService varmuuden vuoksi
            const props = PropertiesService.getScriptProperties();
            const duplicateMessageKey = `msg_${chatId}_${fileId}_duplicate`;
            const lastMessageTime = props.getProperty(duplicateMessageKey);

            console.log(`🔍 Checking fileId duplicate message props for key: ${duplicateMessageKey}`);
            console.log(`🔍 Props value: ${lastMessageTime}`);

            const now = new Date().getTime();
            const oneHourAgo = now - (60 * 60 * 1000); // 1 tunti

            if (!lastMessageTime || parseInt(lastMessageTime) < oneHourAgo) {
              console.log("📤 Sending fileId duplicate message (first time or expired)");
              sendTelegramMessage_(token, chatId, "Kuva on jo tallennettu aiemmin, ei lisätty uudelleen.");
              props.setProperty(duplicateMessageKey, now.toString());
              console.log(`💾 FileId props set for key: ${duplicateMessageKey}`);
            } else {
              console.log("🤫 FileId duplicate message sent recently - skipping (props hit)");
            }
          } catch (propsError) {
            console.error("❌ Props error in fileId duplicate message:", propsError.toString());
            console.log("🤫 Skipping fileId duplicate message due to props error");
          }
          return createCorsResponse_({ status: "OK" });
        }

      console.log("✅ No duplicates found - proceeding with photo processing");
    }

    // getFile
    const getFileUrl = `${TELEGRAM_API_BASE}${token}/getFile?file_id=${encodeURIComponent(fileId)}`;
    const fileResp = UrlFetchApp.fetch(getFileUrl, { method: 'get', muteHttpExceptions: true });
    const fileJson = JSON.parse(fileResp.getContentText());
    if (!fileJson.ok) {
      console.error("getFile failed:", fileResp.getContentText());
      try { appendWebhookLog_("GETFILE_FAILED", fileResp.getContentText()); } catch(__) {}
      return createCorsResponse_({ status: "ERROR", error: "getFile failed" });
    }
    // Ensure we have file_unique_id
    try { if (!fileUniqueId && fileJson && fileJson.result && fileJson.result.file_unique_id) { fileUniqueId = String(fileJson.result.file_unique_id); } } catch (__) {}
    const filePath = fileJson.result.file_path;
    // Secure: download from Telegram, upload to Drive, store Drive link
    const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
    const photoBlob = UrlFetchApp.fetch(downloadUrl).getBlob();

    // Resolve Drive target folder
    let folder = null;
    const configuredFolderId = scriptProperties.getProperty(TELEGRAM_PHOTOS_FOLDER_ID_KEY) || "";
    if (configuredFolderId) {
      try { folder = DriveApp.getFolderById(configuredFolderId); } catch (__) { folder = null; }
    }
    if (!folder) {
      folder = DriveApp.createFolder('ReminderPhotos');
      try { scriptProperties.setProperty(TELEGRAM_PHOTOS_FOLDER_ID_KEY, folder.getId()); } catch (__) {}
    }

    const suggestedName = (String(filePath).split('/').pop()) || (`photo_${new Date().getTime()}.jpg`);
    // Reuse existing file by dedupeKey (FileUID/hash) if present in folder
    let driveFile = null;
    try {
      if (dedupeKey) {
        const it = folder.getFiles();
        while (it.hasNext()) {
          const f = it.next();
          try {
            if (typeof f.getDescription === 'function' && String(f.getDescription() || '') === String(dedupeKey)) {
              driveFile = f;
              break;
            }
          } catch (__) {}
        }
      }
    } catch (__) {}
    if (!driveFile) {
      driveFile = folder.createFile(photoBlob.setName(suggestedName));
      try { if (typeof driveFile.setDescription === 'function' && dedupeKey) { driveFile.setDescription(String(dedupeKey)); } } catch (__) {}
    }
    driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const driveUrl = `https://drive.google.com/thumbnail?id=${driveFile.getId()}`;

    // Append to Kuvat sheet (dedupe by URL)
    let sheet, photoSheet;
    try {
      const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
      if (!sheetId) {
        throw new Error("SHEET_ID_KEY not configured");
      }
      sheet = SpreadsheetApp.openById(sheetId);
      photoSheet = sheet.getSheetByName(SHEET_NAMES.KUVAT) || sheet.insertSheet(SHEET_NAMES.KUVAT);
    } catch (sheetError) {
      console.error("❌ Sheet access error:", sheetError.toString());
      return createCorsResponse_({ status: "ERROR", error: "Sheet configuration error: " + sheetError.toString() });
    }
    if (photoSheet.getLastRow() === 0) {
      photoSheet.getRange(1,1,1,4).setValues([["ClientID","URL","Caption","FileUID"]]);
      photoSheet.getRange(1,1,1,4).setFontWeight("bold");
    } else {
      // Ensure FileUID header exists in column D
      try {
        const header = photoSheet.getRange(1,1,1,Math.max(4, photoSheet.getLastColumn())).getValues()[0];
        if (!header[3]) {
          photoSheet.getRange(1,4).setValue("FileUID");
        }
      } catch (__) {}
    }
    // ❌ VANHA DUPLIKAATTI TARKISTUS POISTETTU - KÄYTETÄÄN VAIN UUTTA AIKAISEMPIA TARKISTUSTA
    // Lisää myös fileId ClientID sarakkeeseen duplikaatti tarkistusta varten
    const enhancedClientId = clientID + (fileId ? `|fileId:${fileId}` : '');
    const row = [enhancedClientId, driveUrl, caption.replace(/#client:[^\s]+/,'').trim(), dedupeKey];
    photoSheet.appendRow(row);
    try { appendWebhookLog_("PHOTO_ROW_APPENDED", `client:${clientID}`); } catch(__) {}

    // Sanitize recent rows: convert any lingering Telegram file URLs to Drive links
    try {
      const maxScan = Math.min(50, photoSheet.getLastRow() - 1);
      if (maxScan > 0) {
        const startRow = photoSheet.getLastRow() - maxScan + 1; // inclusive
        const range = photoSheet.getRange(startRow, 1, maxScan, Math.max(4, photoSheet.getLastColumn()));
        const vals = range.getValues();
        const updates = [];
        for (var r = 0; r < vals.length; r++) {
          var urlCell = String(vals[r][1] || "");
          if (/^https?:\/\/api\.telegram\.org\/file\/bot/.test(urlCell)) {
            try {
              var blob = UrlFetchApp.fetch(urlCell).getBlob();
              var name = 'photo_' + new Date().getTime() + '_' + r + '.jpg';
              var df = folder.createFile(blob.setName(name));
              try { if (typeof df.setDescription === 'function' && dedupeKey) { df.setDescription(String(dedupeKey)); } } catch (__) {}
              df.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
              var newUrl = 'https://drive.google.com/thumbnail?id=' + df.getId();
              vals[r][1] = newUrl;
              if (vals[r].length >= 4) { vals[r][3] = dedupeKey || vals[r][3]; }
              updates.push(true);
            } catch (__) { /* ignore row */ }
          }
        }
        if (updates.length) {
          range.setValues(vals);
          try { appendWebhookLog_('SANITIZED_TELEGRAM_URLS', String(updates.length)); } catch (__) {}
        }
      }
    } catch (sanitizeErr) { console.warn('Sanitize error:', sanitizeErr.toString()); }

    // Cleanup Sheet: remove lingering telegram file URLs to avoid sheet growth
    try {
      const dataRange = photoSheet.getDataRange();
      const values = dataRange.getValues();
      const rowsToDelete = [];
      for (var i = values.length - 1; i >= 1; i--) { // skip header
        var urlCell = String(values[i][1] || "");
        if (/^https?:\/\/api\.telegram\.org\/file\/bot/i.test(urlCell)) {
          if (urlCell !== driveUrl) {
            rowsToDelete.push(i + 1); // 1-based index
          }
        }
      }
      if (rowsToDelete.length > 0) {
        rowsToDelete.forEach(function(r){ photoSheet.deleteRow(r); });
        try { appendWebhookLog_("TELEGRAM_URL_ROWS_REMOVED", String(rowsToDelete.length)); } catch (__) {}
      }
    } catch (cleanupErr) { console.warn('Cleanup error:', cleanupErr.toString()); }

    // Cleanup Drive: remove older duplicates of same file (by FileUID/hash) in the folder
    try {
      if (dedupeKey) {
        const files = folder.getFiles();
        const keepId = driveFile.getId();
        const toRemove = [];
        while (files.hasNext()) {
          const f = files.next();
          if (f.getId() === keepId) { continue; }
          try {
            if (typeof f.getDescription === 'function' && String(f.getDescription() || '') === String(dedupeKey)) {
              toRemove.push(f);
            }
          } catch (__) {}
        }
        toRemove.forEach(function(f){ try { f.setTrashed(true); } catch (__) {} });
        if (toRemove.length) { try { appendWebhookLog_("DRIVE_DUPLICATES_TRASHED", String(toRemove.length)); } catch (__) {} }
      }
    } catch (driveCleanupErr) { console.warn('Drive cleanup error:', driveCleanupErr.toString()); }

    console.log(`✅ Telegram photo saved for ${clientID}`);
    console.log(`🔗 Drive URL: ${driveUrl}`);

    // Tarkista vielä kerran ettei tämä ole duplikaatti (varmuuden vuoksi)
    let finalIsDuplicate = false;
    try {
      const finalDuplicateCheck = photoSheet.getRange(2, 1, photoSheet.getLastRow() - 1, 4).getValues();
      finalIsDuplicate = finalDuplicateCheck.some(row =>
        String(row[3] || "").includes(dedupeKey) ||
        String(row[0] || "").includes(`fileId:${fileId}`)
      );
    } catch (finalCheckError) {
      console.error("❌ Final duplicate check error:", finalCheckError.toString());
    }

    if (finalIsDuplicate) {
      console.log("🚨 FINAL DUPLICATE CHECK FAILED - photo was saved but is duplicate!");
      sendTelegramMessage_(token, chatId, "Huomio: Kuva on jo olemassa mutta tallennettiin uudelleen.");
    } else {
      const message = `Kiitos! Kuva vastaanotettu asiakkaalle "${clientID}".\n\n📸 Kuva tallennettu: ${driveUrl}`;
      console.log(`📤 Sending success message: ${message}`);
      sendTelegramMessage_(token, chatId, message);
    }
    console.log("✅ Webhook processing completed successfully");
    return createCorsResponse_({ status: "OK" });
  } catch (err) {
    console.error("❌ Telegram webhook error:", err.toString());
    console.error("❌ Error stack:", err.stack);
    return createCorsResponse_({ status: "ERROR", error: err.toString() });
  }
}

/** Helper: create webhook URL for docs */
function getTelegramSetWebhookUrl_() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const token = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY) || "";
  const secret = scriptProperties.getProperty(TELEGRAM_WEBHOOK_SECRET_KEY) || "";
  const execUrl = ScriptApp.getService().getUrl();
  return `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(execUrl)}&secret_token=${encodeURIComponent(secret)}&drop_pending_updates=true`;
}

/** Admin: call to set Telegram webhook to current deployment */
function adminSetWebhook() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const token = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY) || "";
  const secret = scriptProperties.getProperty(TELEGRAM_WEBHOOK_SECRET_KEY) || "";
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN missing');
  const execUrl = ScriptApp.getService().getUrl();
  const url = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(execUrl)}&secret_token=${encodeURIComponent(secret)}&drop_pending_updates=true`;
  const resp = UrlFetchApp.fetch(url, { method: 'post', muteHttpExceptions: true });
  Logger.log(resp.getContentText());
  return resp.getContentText();
}

/** Admin: delete Telegram webhook and drop pending updates */
function adminDeleteWebhook() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const token = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY) || "";
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN missing');
  const url = `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`;
  const resp = UrlFetchApp.fetch(url, { method: 'post', muteHttpExceptions: true });
  Logger.log(resp.getContentText());
  return resp.getContentText();
}

/** Admin: get Telegram webhook info */
function adminGetWebhookInfo() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const token = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY) || "";
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN missing');
  const url = `https://api.telegram.org/bot${token}/getWebhookInfo`;
  const resp = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });
  Logger.log(resp.getContentText());
  return resp.getContentText();
}

/** Admin: set photos folder id property */
function adminSetPhotosFolderProperty(folderId) {
  if (!folderId) throw new Error('folderId required');
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty(TELEGRAM_PHOTOS_FOLDER_ID_KEY, String(folderId));
  return { ok: true, folderId };
}

// =============================
// Script Properties Admin Utils
// =============================
function adminPropsSet(key, value) {
  if (!key) throw new Error('key required');
  const sp = PropertiesService.getScriptProperties();
  sp.setProperty(String(key), String(value || ''));
  return { ok: true, key: String(key) };
}

function adminPropsGet(key) {
  if (!key) throw new Error('key required');
  const sp = PropertiesService.getScriptProperties();
  return { key: String(key), value: sp.getProperty(String(key)) };
}

function adminPropsList() {
  const sp = PropertiesService.getScriptProperties();
  return sp.getProperties();
}

function adminPropsDelete(key) {
  if (!key) throw new Error('key required');
  const sp = PropertiesService.getScriptProperties();
  sp.deleteProperty(String(key));
  return { ok: true, key: String(key) };
}

function adminPropsExport() {
  const sp = PropertiesService.getScriptProperties();
  const props = sp.getProperties();
  return JSON.stringify(props, null, 2);
}

function adminPropsImport(jsonString, overwrite) {
  if (!jsonString) throw new Error('jsonString required');
  const sp = PropertiesService.getScriptProperties();
  const obj = JSON.parse(jsonString);
  const current = sp.getProperties();
  Object.keys(obj).forEach(function(k){
    if (overwrite || !(k in current)) {
      sp.setProperty(k, String(obj[k]));
    }
  });
  return { ok: true, imported: Object.keys(obj).length };
}

// Convenience setters for common keys
function adminSetSheetId(sheetId) { return adminPropsSet(SHEET_ID_KEY, sheetId); }
function adminSetTelegramToken(token) { return adminPropsSet(TELEGRAM_BOT_TOKEN_KEY, token); }
function adminSetTelegramSecret(secret) { return adminPropsSet(TELEGRAM_WEBHOOK_SECRET_KEY, secret); }
function adminSetAllowedChats(csv) { return adminPropsSet(ALLOWED_TELEGRAM_CHAT_IDS_KEY, csv); }

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
    // Init authorization without API key: call once with ?init=1
    if (e && e.parameter && e.parameter.init === '1') {
      try { initAuth(); } catch (initErr) { console.error('initAuth error:', initErr.toString()); }
      return createCorsResponse_({ status: 'OK', init: 'done', timestamp: new Date().toISOString() });
    }
    
    // Health check: fast ping without auth
    if (e && e.parameter && e.parameter.action === 'ping') {
      return createCorsResponse_({ status: 'OK', now: new Date().toISOString() });
    }

    // Version-info ilman authia
    if (e && e.parameter && e.parameter.action === 'version') {
      return createCorsResponse_({
        status: 'OK',
        version: APP_VERSION,
        timestamp: new Date().toISOString()
      });
    }

    // Luo WebhookLogs ja lisää testirivi
    if (e && e.parameter && e.parameter.action === 'logtest') {
      try { appendWebhookLog_('TEST', 'manual'); } catch (err) { console.error('logtest error:', err.toString()); }
      return createCorsResponse_({ status: 'OK', action: 'logtest' });
    }

    // Health-details (ei vaadi avainta): tarkistaa asetukset ja sheet-yhteyden
    if (e && e.parameter && e.parameter.action === 'health') {
      const result = getHealthStatus_();
      return createCorsResponse_(result);
    }

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
    
    // Fast mode: light data without photo/external calls
    if (e && e.parameter && e.parameter.fast === '1') {
      return handleDataFetchAction_(Object.assign({}, e, { parameter: Object.assign({}, e.parameter, { fast: '1' }) }));
    }
    
    // Default: return tablet data (full)
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
 * Palauttaa yksityiskohtaisen terveysraportin GAS-asetuksista ja Sheet-yhteydestä
 */
function getHealthStatus_() {
  const started = new Date();
  const props = PropertiesService.getScriptProperties();
  const report = {
    status: 'OK',
    version: APP_VERSION,
    startedAt: started.toISOString(),
    checks: []
  };
  
  function addCheck(name, ok, detail) {
    report.checks.push({ name, ok, detail: detail || '' });
    if (!ok) report.status = 'ERROR';
  }
  
  // 1) Properties olemassa
  const sheetId = props.getProperty(SHEET_ID_KEY);
  addCheck('SHEET_ID_present', !!sheetId, sheetId ? 'configured' : 'missing');
  addCheck('VALID_API_KEYS_present', !!props.getProperty('VALID_API_KEYS'), props.getProperty('VALID_API_KEYS') ? 'configured' : 'missing');
  addCheck('TELEGRAM_BOT_TOKEN_present', !!props.getProperty(TELEGRAM_BOT_TOKEN_KEY), props.getProperty(TELEGRAM_BOT_TOKEN_KEY) ? 'configured' : 'missing');
  
  // 2) Sheet avaus ja välilehdet
  try {
    if (sheetId) {
      const ss = SpreadsheetApp.openById(sheetId);
      addCheck('Spreadsheet_open', !!ss, 'opened');
      const tabs = [SHEET_NAMES.CONFIG, SHEET_NAMES.KUVAT];
      tabs.forEach(tab => {
        const exists = !!ss.getSheetByName(tab);
        addCheck(`Tab_${tab}`, exists, exists ? 'exists' : 'missing');
      });
    }
  } catch (err) {
    addCheck('Spreadsheet_open', false, err.toString());
  }
  
  report.finishedAt = new Date().toISOString();
  report.elapsedMs = new Date() - started;
  return report;
}

/**
 * Append a simple webhook log row for debugging
 */
function appendWebhookLog_(type, detail) {
  const props = PropertiesService.getScriptProperties();
  const ss = SpreadsheetApp.openById(props.getProperty(SHEET_ID_KEY));
  const name = 'WebhookLogs';
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) sh.appendRow(['Timestamp','Type','Detail']);
  sh.appendRow([new Date(), type, detail || '']);
}

/**
 * Global initAuth for first-time Drive/Sheets authorization and basic smoke test
 */
function initAuth() {
  const props = PropertiesService.getScriptProperties();
  const name = props.getProperty('PHOTOS_SHEET_NAME') || 'Kuvat';
  const ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.appendRow(["Timestamp","From","Caption","DriveFileId","PublicUrl","ClientID","Active"]);
  }
  sh.appendRow([new Date(), 'INIT', 'Auth OK', '', '', 'mom', true]);

  const folder = DriveApp.getFolderById(props.getProperty('PHOTOS_FOLDER_ID'));
  const f = folder.createFile(Utilities.newBlob('ok','text/plain','auth-ok.txt'));
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
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
    const debugRequested = !!(e && e.parameter && (e.parameter.debug === '1' || e.parameter.debug === 'true'));
    
    let dailyPhotoUrl = "";
    let dailyPhotoCaption = "Kuvat eivät ole vielä käytössä";
    let dailyPhotoDebug = {};
    
    if (settings.usePhotos && !(e && e.parameter && e.parameter.fast === '1')) {
      try {
        const dailyPhoto = getDailyPhoto_(sheet, clientID);
        dailyPhotoUrl = dailyPhoto.url;
        dailyPhotoCaption = dailyPhoto.caption;
        dailyPhotoDebug = dailyPhoto.debug || {};
      } catch (photoError) {
        console.warn("Photo service unavailable:", photoError.toString());
        dailyPhotoCaption = "Kuvat eivät ole käytettävissä tällä hetkellä";
      }
    }
    
    // Parse greeting | activity tags from latestReminder (backwards compatible)
    const parsedMsg = parseGreetingAndActivity_(latestReminder);

    // Build evergreen activity suggestion (always visible)
    const activitySuggestion = getActivitySuggestion_(sheet, clientID, timeOfDay, weather);
    const mealSuggestion = getMealSuggestions_(sheet, clientID, timeOfDay, now);
    
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
      greeting: activitySuggestion.greeting || parsedMsg.greeting || latestReminder || "",
      activityText: activitySuggestion.activityText || parsedMsg.activityText || "",
      activityTags: activitySuggestion.activityTags || parsedMsg.activityTags || [],
      activityTimeOfDay: activitySuggestion.activityTimeOfDay || parsedMsg.activityTimeOfDay || "",
      dailyTasks: dailyTasks,
      weeklyPlan: getWeeklyPlan_(sheet, clientID),
      currentTimeOfDay: timeOfDay,
      // Meals: oletusarvot aina mukana vastauksessa
      nextMealType: "",
      nextMealTime: "",
      mealOptions: [],
      dailyPhotoDebug: debugRequested ? dailyPhotoDebug : undefined
    };

    // Meals
    if (mealSuggestion) {
      response.nextMealType = mealSuggestion.nextMealType || "";
      response.nextMealTime = mealSuggestion.nextMealTime || "";
      response.mealOptions = mealSuggestion.mealOptions || [];
    }
    
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
      // Näytä kaikki kyseisen vuorokaudenajan lääkkeet (deduplikointi tehty getMedicineReminders_ sisällä)
      medicineReminders.forEach(rem => {
        const desc = rem.replace("💊 ", "");
        const isAcked = isTaskAckedToday_(sheet, "LÄÄKKEET", timeOfDay, desc, today);
        console.log(`📋 Adding LÄÄKKEET task from sheet: "${desc}" with timeOfDay: "${finalTimeOfDay}"`);
      tasks.push({
        type: "LÄÄKKEET", 
          description: desc,
        timeOfDay: finalTimeOfDay,
          requiresAck: true,
        isAckedToday: isAcked,
        acknowledgmentTimestamp: isAcked ? getTaskAckTimestamp_(sheet, "LÄÄKKEET", timeOfDay, today) : null
      });
      });
    } else {
      // Ei sheet-merkintää tälle vuorokaudenaikalle → EI näytetä lääkkeitä.
      console.log(`ℹ️ No medicine reminder for ${clientID} at ${finalTimeOfDay} – skipping default medicine task.`);
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
  // Yritä päätellä usePhotos automaattisesti Kuvat-välilehden perusteella
  let inferredUsePhotos = false;
  try {
    const photosSheet = sheet.getSheetByName(SHEET_NAMES.KUVAT) || sheet.getSheetByName("Kuvat") || sheet.getSheetByName("Photos");
    if (photosSheet) {
      const values = photosSheet.getDataRange().getValues();
      for (let i = 1; i < values.length; i++) {
        for (let c = 1; c < Math.min(values[i].length, 6); c++) {
          const cell = String(values[i][c] || '').trim();
          if (/^https?:\/\//i.test(cell)) { inferredUsePhotos = true; break; }
        }
        if (inferredUsePhotos) break;
      }
    }
  } catch {}

  const defaultSettings = {
    useTelegram: !!PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN'),
    usePhotos: inferredUsePhotos
  };
  
  try {
    const configSheet = sheet.getSheetByName(SHEET_NAMES.CONFIG) || sheet.getSheetByName("Konfiguraatio") || sheet.getSheetByName("Config");
    if (!configSheet) {
      return defaultSettings;
    }
    
    const data = configSheet.getDataRange().getValues();
    const headers = (data && data.length > 0) ? (data[0] || []) : [];
    const norm = (v) => String(v || '').trim().toLowerCase().replace(/\s+/g, '');
    const toBool = (v) => (v === true) || ['true','yes','1','x'].includes(String(v).trim().toLowerCase());
    const findCol = (names) => {
      for (let idx = 0; idx < headers.length; idx++) {
        const h = norm(headers[idx]);
        if (names.some(n => h === n || h.includes(n))) return idx;
      }
      return -1;
    };
    const photosIdxByHeader = findCol(['usephotos','photos','kuvat','kaytakuvia','käytäkuvia']);
    const telegramIdxByHeader = findCol(['usetelegram','telegram','viestit']);
    
    for (let i = 1; i < data.length; i++) {
      const configClientID = String(data[i][0]).trim().toLowerCase();
      console.log(`🔍 Checking config row ${i}: "${configClientID}" vs "${clientID.toLowerCase()}"`);
      
      if (configClientID === clientID.toLowerCase()) {
        // Lue usePhotos (otsikon perusteella tai tunnetut indeksit: W(22), J(9), D(3))
        const candidatesPhotosIdx = [photosIdxByHeader, 22, 9, 3].filter(x => x >= 0);
        let usePhotosResult = defaultSettings.usePhotos;
        for (const ci of candidatesPhotosIdx) {
          if (ci < data[i].length) {
            const v = data[i][ci];
            if (v !== undefined && v !== '') { usePhotosResult = toBool(v); break; }
          }
        }

        // Lue useTelegram (otsikon perusteella tai tunnetut: K(10), E(4))
        const candidatesTelegramIdx = [telegramIdxByHeader, 10, 4].filter(x => x >= 0);
        let useTelegramResult = defaultSettings.useTelegram;
        for (const ci of candidatesTelegramIdx) {
          if (ci < data[i].length) {
            const v = data[i][ci];
            if (v !== undefined && v !== '') { useTelegramResult = toBool(v); break; }
          }
        }

        return {
          useTelegram: useTelegramResult || defaultSettings.useTelegram,
          usePhotos: usePhotosResult || defaultSettings.usePhotos
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
 * Parse "Greeting | Activity #tags" from a message (backwards compatible)
 */
function parseGreetingAndActivity_(message) {
  try {
    const result = { greeting: '', activityText: '', activityTags: [], activityTimeOfDay: '' };
    const msg = String(message || '').trim();
    if (!msg) return result;
    const parts = msg.split('|');
    if (parts.length >= 2) {
      result.greeting = parts[0].trim();
      const right = parts.slice(1).join('|').trim();
      // Extract tags starting with #
      const tagMatches = right.match(/#[a-zA-ZåäöÅÄÖ]+/g) || [];
      result.activityTags = tagMatches.map(t => t.replace('#','').toLowerCase());
      // time of day tags
      if (result.activityTags.includes('aamu')) result.activityTimeOfDay = 'AAMU';
      else if (result.activityTags.includes('päivä') || result.activityTags.includes('paiva')) result.activityTimeOfDay = 'PÄIVÄ';
      else if (result.activityTags.includes('ilta')) result.activityTimeOfDay = 'ILTA';
      else if (result.activityTags.includes('yö') || result.activityTags.includes('yo')) result.activityTimeOfDay = 'YÖ';
      // Remove tags from activity text
      result.activityText = right.replace(/#[^\s]+/g, '').trim();
    } else {
      result.greeting = msg;
    }
    return result;
  } catch (__) { return { greeting: String(message||''), activityText: '', activityTags: [], activityTimeOfDay: '' }; }
}

/**
 * Evergreen activity selector from Viestit sheet
 * - Syntax: "Greeting | Activity #päivä/#aamu/#ilta/#yö #inside/#outside/#social"
 * - Filters out food/medicine phrases
 */
function getActivitySuggestion_(sheet, clientID, timeOfDay, weather) {
  try {
    const result = { greeting: '', activityText: '', activityTags: [], activityTimeOfDay: '' };
    const messagesSheet = sheet.getSheetByName(SHEET_NAMES.VIESTIT);
    if (!messagesSheet) return result;
    const data = messagesSheet.getDataRange().getValues();
    if (!data || data.length <= 1) return result;

    // Kieltolista – suodata RUOKA/LÄÄKE maininnat pois
    const deny = [/\blääke/i, /\blääkkeet/i, /\bruoka/i, /\bsyö/i, /aamupala/i, /lounas/i, /päivällinen/i, /iltapala/i, /tabletti/i, /pilleri/i, /kapseli/i];
    const to = (v) => String(v || '').trim();
    const nowTod = String(timeOfDay || '').toUpperCase(); // AAMU/PÄIVÄ/ILTA/YÖ
    const goodOutdoor = !!(weather && weather.isGoodForOutdoor === true);

    const rows = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      // Tuki: jos A-sarake EI ole päivämäärä, käytä A:ta viestinä; muuten käytä B:tä
      const cellA = row[0];
      const isDateA = (cellA && Object.prototype.toString.call(cellA) === '[object Date]' && !isNaN(cellA));
      const msg = !isDateA && to(cellA) ? to(cellA) : to(row[1]);
      if (!msg) continue;
      if (deny.some(rx => rx.test(msg))) continue; // pudota ruoka/lääke viestit
      rows.push(msg);
    }
    if (rows.length === 0) return result;

    // Jaa aikaryhmiin ja kategorioihin
    const parsed = rows.map(r => parseGreetingAndActivity_(r));
    const matchTod = (p) => {
      if (!p.activityTimeOfDay) return true; // jos ei määritetty, käy kaikkiin aikoihin
      return p.activityTimeOfDay.toUpperCase() === nowTod;
    };
    const hasTag = (p, tag) => (p.activityTags || []).includes(tag);

    const candidatesOutside = parsed.filter(p => matchTod(p) && hasTag(p, 'outside'));
    const candidatesInside  = parsed.filter(p => matchTod(p) && hasTag(p, 'inside'));
    const candidatesSocial  = parsed.filter(p => matchTod(p) && hasTag(p, 'social'));
    const candidatesAny     = parsed.filter(p => matchTod(p));

    let bucket = [];
    if (goodOutdoor && candidatesOutside.length) bucket = candidatesOutside;
    else if (candidatesInside.length) bucket = candidatesInside;
    else if (candidatesSocial.length) bucket = candidatesSocial;
    else bucket = candidatesAny;
    if (bucket.length === 0) return result;

    // Stabiili rotaatio (päivittäin) – siemen clientID+päivä
    const todayKey = new Date().toISOString().slice(0,10);
    const s = `${clientID}|${todayKey}|${bucket.length}`;
    let h = 0; for (let k = 0; k < s.length; k++) { h = ((h << 5) - h) + s.charCodeAt(k); h |= 0; }
    const pick = Math.abs(h) % bucket.length;
    const chosen = bucket[pick];

    return {
      greeting: chosen.greeting || '',
      activityText: chosen.activityText || '',
      activityTags: chosen.activityTags || [],
      activityTimeOfDay: chosen.activityTimeOfDay || ''
    };
  } catch (__) {
    return { greeting: '', activityText: '', activityTags: [], activityTimeOfDay: '' };
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
      const mealClock = String(data[i][4] || '').trim(); // 08:00, 12:00, 18:00 (uusi malli)
      const suggestion = String(data[i][3] || '').trim(); // Ehdotuslista " | " (ei näytetä taskissa)
      
      console.log(`📋 Rivi ${i}: ClientID="${reminderClientID}", Aika="${mealTime}", Ateria="${mealType}", Kello="${mealClock}", Ehdotus="${suggestion}"`);
      
      console.log(`📋 Tarkistetaan: ${reminderClientID} vs ${clientID.toLowerCase()}, ${mealTime} vs ${timeOfDay}`);
      
      if (reminderClientID === clientID.toLowerCase() && 
          mealTime.toUpperCase() === timeOfDay.toUpperCase()) {
        
        // Rakenna taskiin vain selkeä muistutus: Ateria + kellonaika (ei koko ehdotuslistaa)
        let reminder = getFoodEmoji_(mealType) + " " + mealType;
        if (mealClock) reminder += ` ${mealClock}`;
        
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
    // Lue ajastetut tärkeät viestit 'Tapaamiset' -välilehdeltä
    const messagesSheet = sheet.getSheetByName(SHEET_NAMES.TAPAAMISET);
    if (!messagesSheet) {
      console.log("No 'Tapaamiset' sheet found");
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

        // HIDE past events and events earlier today (after end time)
        const now = new Date();
        if (daysUntilEvent < 0) {
          continue; // eilen/aiemmin → ei näytetä
        }
        if (daysUntilEvent === 0 && now > fullEventDate) {
          continue; // tänään mutta aika jo ohi → ei näytetä
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
    // Älä näytä menneitä tapahtumia
    return "";
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
  
  // API key validation DISABLED - proxy handles authentication
  // Since we use Azure Functions proxy as trusted gateway,
  // we trust any API key that comes through the proxy
  console.log("🔐 API key validation: ✅ BYPASSED (proxy trusted)");
  return true;
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
    
    // ENSISIJAISESTI: Lue aina Google Sheets 'Kuvat' jos siellä on rivejä (luotettavin ja nopein)
    const photoSheet = sheet.getSheetByName(SHEET_NAMES.KUVAT) 
                       || sheet.getSheetByName("Kuvat") 
                       || sheet.getSheetByName("Photos");
    if (!photoSheet) return { url: "", caption: "Ei kuvia saatavilla", debug: { reason: "no_photo_sheet" } };
    
    const allRows = photoSheet.getDataRange().getValues();
    const clientLower = String(clientID || "").trim().toLowerCase();
    const rowHasUrl = (row) => {
      if (!row) return false;
      for (let ci = 1; ci < row.length; ci++) {
        const cell = String(row[ci] || '').trim();
        if (/^https?:\/\//i.test(cell)) return true;
      }
      return false;
    };
    
    // Kokoa ehdokkaat (vain rivit, joilla on URL)
    const clientCandidates = [];
    const wildcardCandidates = [];
    const anyCandidates = [];
    for (let i = 1; i < allRows.length; i++) {
      if (!rowHasUrl(allRows[i])) continue;
      const rowClient = String(allRows[i][0] || '').trim().toLowerCase();
      if (rowClient === clientLower) clientCandidates.push(i);
      else if (!rowClient || rowClient === '*' || rowClient === 'all' || rowClient === 'kaikki') wildcardCandidates.push(i);
      else anyCandidates.push(i);
    }

    // Valitse ensisijainen ehdokaslista
    let candidates = clientCandidates.length ? clientCandidates : (wildcardCandidates.length ? wildcardCandidates : anyCandidates);
    let selectedRowIndex = -1;
    if (candidates.length > 0) {
      // Valitse rivi joko viimeisin tai stabiilisti satunnainen rotationSettingsin mukaan
      const pickStableIndex = (count) => {
        // Määritä siemen: päivä/viikko/kuukausi
        const now = new Date();
        let periodKey = '';
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        if ((rotationSettings && String(rotationSettings.rotationInterval).toLowerCase() === 'weekly')) {
          const onejan = new Date(now.getFullYear(),0,1);
          const week = Math.ceil((((now - onejan) / 86400000) + onejan.getDay()+1)/7);
          periodKey = `${yyyy}-W${week}`;
        } else if (rotationSettings && String(rotationSettings.rotationInterval).toLowerCase() === 'monthly') {
          periodKey = `${yyyy}-${mm}`;
        } else {
          periodKey = `${yyyy}-${mm}-${dd}`; // daily
        }
        const s = `${clientID}|${periodKey}|${count}`;
        let h = 0;
        for (let k = 0; k < s.length; k++) { h = ((h << 5) - h) + s.charCodeAt(k); h |= 0; }
        const idx = Math.abs(h) % count;
        return idx;
      };

      if (rotationSettings && rotationSettings.randomize) {
        const idx = pickStableIndex(candidates.length);
        selectedRowIndex = candidates[idx];
      } else {
        // Viimeisin (suurin indeksi)
        selectedRowIndex = candidates[candidates.length - 1];
      }
    }
    if (selectedRowIndex >= 0) {
      const rowRaw = allRows[selectedRowIndex] || [];
      let urlDirect = '';
      for (let ci = 1; ci < rowRaw.length; ci++) {
        const cell = String(rowRaw[ci] || '').trim();
        if (/^https?:\/\//i.test(cell)) { urlDirect = cell; break; }
      }
      let captionDirect = String(rowRaw[2] || '').trim();
      if (!captionDirect || /^https?:\/\//i.test(captionDirect)) {
        captionDirect = String(rowRaw[3] || '').trim();
      }
      if (urlDirect) {
        urlDirect = ensureHighResDriveThumb_(urlDirect, 2000);
        const sep = urlDirect.includes('?') ? '&' : '?';
        urlDirect = `${urlDirect}${sep}v=${Date.now()}`;
        return {
          url: urlDirect,
          caption: captionDirect || '',
          rotationInfo: `${rotationSettings.rotationInterval} rotation, latest photo row ${selectedRowIndex}/${allRows.length - 1}`,
          debug: { source: 'sheet-direct-raw', selectedRowIndex, urlFound: true }
        };
      }

      // Varalla: kokeile formula/richText -poimintaa
      const colCount = photoSheet.getLastColumn();
      const range = photoSheet.getRange(selectedRowIndex + 1, 1, 1, colCount);
      const valuesRow = range.getValues()[0] || [];
      const formulasRow = range.getFormulas()[0] || [];
      const richRow = (range.getRichTextValues && range.getRichTextValues()[0]) ? range.getRichTextValues()[0] : [];

      let url = '';
      for (let ci = 1; ci < colCount; ci++) {
        const raw = valuesRow[ci];
        const formula = formulasRow[ci] || '';
        const rich = richRow[ci] || null;
        const extracted = extractUrlFromCellFallback_(raw, formula, rich);
        if (extracted) { url = extracted; break; }
      }
      url = ensureHighResDriveThumb_(url, 2000);
      if (url) {
        const sep = url.includes('?') ? '&' : '?';
        url = `${url}${sep}v=${Date.now()}`;
        let caption = String(valuesRow[2] || '').trim();
        if (!caption || /^https?:\/\//i.test(caption)) {
          caption = String(valuesRow[3] || '').trim();
        }
        return {
          url,
          caption: caption || '',
          rotationInfo: `${rotationSettings.rotationInterval} rotation, latest photo row ${selectedRowIndex}/${allRows.length - 1}`,
          debug: { source: 'sheet-formula-rich', selectedRowIndex, urlFound: true }
        };
      }
      // Jos sheet-riviltä ei löytynyt, jatka muihin metodeihin
    }
    
    // TOISSIJAisesti: albumi/drive vain jos asetettu
    if (albumId && albumId !== "YOUR_GOOGLE_PHOTOS_ALBUM_ID_HERE") {
      if (albumId.includes('photos.google.com') || albumId.includes('photos.app.goo.gl')) {
        console.log("Attempting Google Photos integration...");
        const googlePhoto = getGooglePhotosAlbumImage_(albumId, clientID, rotationSettings);
        if (googlePhoto.url) {
          return googlePhoto;
        }
        console.log("Google Photos failed, trying Google Drive method...");
      }
      const drivePhoto = getGooglePhotosImage_(albumId, clientID, rotationSettings);
      if (drivePhoto.url) {
        console.log(`Using Google Drive for ${clientID}: ${drivePhoto.caption}`);
        return drivePhoto;
      }
    }
    
    // Jos mikään ei tuottanut URL:ia
    return { url: "", caption: "", debug: { reason: "no_url_found_after_all_methods", lastColumn: (photoSheet && photoSheet.getLastColumn ? photoSheet.getLastColumn() : undefined) } };

    // Paranna Google Drive -thumbnailin tarkkuutta, jos leveys puuttuu
    url = ensureHighResDriveThumb_(url, 2000);
    // Cache-busting jotta uusi kuva näkyy heti
    if (url) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}v=${Date.now()}`;
    }

    // Caption: C tai D; ohita jos näyttää URL:lta
    let caption = String(selected[2] || "").trim();
    if (!caption || /^https?:\/\//i.test(caption)) {
      caption = String(selected[3] || "").trim();
    }
    // Caption tulee ensisijaisesti C-sarakkeesta (index 2). Ei oletustekstiä.

    // (poistettu: vanha paluu – uusi logiikka yllä)
    
  } catch (error) {
    console.log('Error getting photo:', error.toString());
    return {url: "", caption: "Kuvia ei voitu hakea", debug: { reason: "exception", error: error.toString() } };
  }
}

/**
 * Extract URL from a cell value, formula or rich text
 */
function extractUrlFromCellFallback_(raw, formula, rich) {
  try {
    const str = String(raw || '').trim();
    if (/^https?:\/\//i.test(str)) return str;
    const f = String(formula || '').trim();
    // Detect HYPERLINK("url", "text")
    const hyp = f.match(/HYPERLINK\(\s*"([^"]+)"/i);
    if (hyp && hyp[1]) return hyp[1];
    // RichText: try getLinkUrl if available
    if (rich && typeof rich.getLinkUrl === 'function') {
      const link = rich.getLinkUrl();
      if (link) return link;
    }
  } catch (__) {}
  return '';
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
 * Varmistaa että Google Drive thumbnail -URL sisältää riittävän leveysvihjeen (&sz=wNNN)
 */
function ensureHighResDriveThumb_(url, minWidth) {
  try {
    if (!url) return url;
    if (!/^https?:\/\/drive\.google\.com\/thumbnail\?id=/i.test(url)) return url;
    if (/([?&])sz=w\d+/i.test(url)) return url; // jo annettu
    const width = Math.max(800, Number(minWidth) || 1200);
    return url + (url.includes("?") ? "&" : "?") + "sz=w" + width;
  } catch { return url; }
}

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
//  WEEKLY PLAN (FOOD, MEDICINES, EVENTS)
// ===================================================================================

function getWeeklyPlan_(sheet, clientID) {
  try {
    const today = new Date();
    const days = [];

    // Read upcoming appointments once
    const appointments = getUpcomingAppointments_(sheet, clientID) || [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      const iso = Utilities.formatDate(d, HELSINKI_TIMEZONE, 'yyyy-MM-dd');
      const label = Utilities.formatDate(d, HELSINKI_TIMEZONE, 'EEE dd.MM');

      // Food from Ruoka-ajat
      const meals = (getFoodReminders_(sheet, clientID, getTimeOfDay_(d), d.getHours()) || [])
        .map(x => x.replace(/^🍽️\s*/, ''));

      // Medicines from Lääkkeet
      const meds = (getMedicineReminders_(sheet, clientID, getTimeOfDay_(d), d.getHours()) || [])
        .map(x => x.replace(/^💊\s*/, ''));

      // Events for that exact date
      const events = appointments.filter(a => {
        try {
          const ad = parseFlexibleDate_(a.date || a.Date);
          return ad && Utilities.formatDate(ad, HELSINKI_TIMEZONE, 'yyyy-MM-dd') === iso;
        } catch { return false; }
      }).map(a => `${a.time || a.Time || ''} ${a.type || a.Type || ''}: ${a.message || a.Message || ''}`);

      days.push({ date: iso, label, meals, medicines: meds, events });
    }

    return { days };
  } catch (e) {
    console.warn('getWeeklyPlan_ error:', e.toString());
    return { days: [] };
  }
}

function parseFlexibleDate_(s) {
  if (!s) return null;
  try {
    const parts = String(s).split(/[.\-\/]/).map(p => p.trim());
    if (parts.length === 3 && parts[0].length <= 2) {
      // dd.MM.yyyy
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
    return null;
  } catch { return null; }
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

  // (removed nested initAuth)
  
}
