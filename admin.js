/**
 * Admin module for ReminderApp
 * Handles administrative functions, webhook management, and system configuration
 */

// Include config constants
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/config.js').getContentText()); // For GAS module loading

// Additional admin constants
const TELEGRAM_PHOTOS_FOLDER_ID_KEY = "Telegram_Photos_Folder_ID";

/**
 * Admin: delete Telegram webhook
 */
function adminDeleteWebhook() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const token = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY) || "";
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN missing');

  const url = `https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`;
  const resp = UrlFetchApp.fetch(url, { method: 'post', muteHttpExceptions: true });

  Logger.log(resp.getContentText());
  return resp.getContentText();
}

/**
 * Admin: get Telegram webhook info
 */
function adminGetWebhookInfo() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const token = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY) || "";
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN missing');

  const url = `https://api.telegram.org/bot${token}/getWebhookInfo`;
  const resp = UrlFetchApp.fetch(url, { method: 'get', muteHttpExceptions: true });

  Logger.log(resp.getContentText());
  return resp.getContentText();
}

/**
 * Admin: set photos folder id property
 */
function adminSetPhotosFolderProperty(folderId) {
  if (!folderId) throw new Error('folderId required');
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty(TELEGRAM_PHOTOS_FOLDER_ID_KEY, String(folderId));
  return { ok: true, folderId };
}

/**
 * Script Properties Admin Utils - Set property
 */
function adminPropsSet(key, value) {
  if (!key) throw new Error('key required');
  const sp = PropertiesService.getScriptProperties();
  sp.setProperty(String(key), String(value || ''));
  return { ok: true, key: String(key) };
}

/**
 * Script Properties Admin Utils - Get property
 */
function adminPropsGet(key) {
  if (!key) throw new Error('key required');
  const sp = PropertiesService.getScriptProperties();
  return { key: String(key), value: sp.getProperty(String(key)) };
}

/**
 * Script Properties Admin Utils - List all properties
 */
function adminPropsList() {
  const sp = PropertiesService.getScriptProperties();
  return sp.getProperties();
}

/**
 * Script Properties Admin Utils - Delete property
 */
function adminPropsDelete(key) {
  if (!key) throw new Error('key required');
  const sp = PropertiesService.getScriptProperties();
  sp.deleteProperty(String(key));
  return { ok: true, key: String(key) };
}

/**
 * Script Properties Admin Utils - Export properties as JSON
 */
function adminPropsExport() {
  const sp = PropertiesService.getScriptProperties();
  const props = sp.getProperties();
  return JSON.stringify(props, null, 2);
}

/**
 * Script Properties Admin Utils - Import properties from JSON
 */
function adminPropsImport(jsonString, overwrite) {
  if (!jsonString) throw new Error('jsonString required');
  const sp = PropertiesService.getScriptProperties();
  const obj = JSON.parse(jsonString);
  const current = sp.getProperties();

  Object.keys(obj).forEach(k => {
    if (overwrite || !(k in current)) {
      sp.setProperty(k, String(obj[k]));
    }
  });

  return { ok: true, imported: Object.keys(obj).length };
}

/**
 * Convenience setters for common keys
 */
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

    // Acknowledge the task
    const success = acknowledgeWeeklyTask_(clientID, type, timeOfDay, description, timestamp);

    if (success) {
      return createCorsResponse_({
        status: "OK",
        message: "Task acknowledged successfully",
        acknowledged: {
          clientID,
          type,
          timeOfDay,
          description,
          timestamp
        }
      });
    } else {
      return createCorsResponse_({
        error: "Failed to acknowledge task",
        status: "ERROR"
      });
    }

  } catch (error) {
    console.error("Error in POST acknowledgment:", error.toString());
    return createCorsResponse_({
      error: "Server error: " + error.toString(),
      status: "ERROR"
    });
  }
}

/**
 * Get client sheet ID
 */
function getClientSheetId_(clientID, scriptProperties = null) {
  try {
    const props = scriptProperties || PropertiesService.getScriptProperties();
    const sheetId = props.getProperty(SHEET_ID_KEY);

    if (!sheetId) {
      console.error(`❌ SHEET_ID not configured for ${clientID}`);
      return null;
    }

    return sheetId;
  } catch (error) {
    console.error(`Error getting client sheet ID for ${clientID}:`, error.toString());
    return null;
  }
}

/**
 * Setup client sheet
 */
function setupClientSheet(clientID, sheetId) {
  try {
    if (!clientID || !sheetId) {
      throw new Error('clientID and sheetId are required');
    }

    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty(SHEET_ID_KEY, sheetId);

    console.log(`✅ Client sheet configured for ${clientID}: ${sheetId}`);
    return { success: true, clientID, sheetId };

  } catch (error) {
    console.error(`Error setting up client sheet for ${clientID}:`, error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Clean up invalid photo URLs for all clients or specific client
 */
function adminCleanPhotos(clientID) {
  try {
    console.log(`🧹 Admin: Starting photo cleanup for ${clientID || 'all clients'}`);

    const props = PropertiesService.getScriptProperties();
    const sheetId = props.getProperty(SHEET_ID_KEY);

    if (!sheetId) {
      return { error: "SHEET_ID not configured" };
    }

    const spreadsheet = SpreadsheetApp.openById(sheetId);

    // We need to include the cleanup function since we can't directly import modules in GAS
    // This is a simplified version for GAS compatibility

    const photoSheet = getOrCreateSheet_(spreadsheet, SHEET_NAMES.KUVAT);
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

/**
 * Simple function to check if image URL is accessible
 */
function isImageAccessible_(url) {
  try {
    if (!url || !url.trim()) return false;

    // For Google Drive URLs, try to access the file
    if (url.includes('drive.google.com')) {
      // Extract file ID and try to get file info
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
 * List all client sheets
 */
function listClientSheets() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const props = scriptProperties.getProperties();

    const clientSheets = {};
    Object.keys(props).forEach(key => {
      if (key.includes('SHEET_ID')) {
        const clientId = key.replace('_SHEET_ID', '').toLowerCase();
        clientSheets[clientId] = props[key];
      }
    });

    return clientSheets;

  } catch (error) {
    console.error("Error listing client sheets:", error.toString());
    return {};
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    adminDeleteWebhook,
    adminGetWebhookInfo,
    adminSetPhotosFolderProperty,
    adminCleanPhotos,
    adminPropsSet,
    adminPropsGet,
    adminPropsList,
    adminPropsDelete,
    adminPropsExport,
    adminPropsImport,
    adminSetSheetId,
    adminSetTelegramToken,
    adminSetTelegramSecret,
    adminSetAllowedChats,
    handlePostAcknowledgement_,
    getClientSheetId_,
    setupClientSheet,
    listClientSheets
  };
}
