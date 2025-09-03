/**
 * Photos module for ReminderApp
 * Handles photo management, Google Photos integration, and image processing
 */

// Include config constants
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/config.js').getContentText()); // For GAS module loading

// Photo configuration
const GOOGLE_PHOTOS_ALBUM_ID_KEY = "Google_Photos_Album_ID";
const HELSINKI_TIMEZONE = "Europe/Helsinki";

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

/**
 * Get daily photo for client
 * @param {Object} sheet - Spreadsheet reference
 * @param {string} clientID - Client identifier
 */
function getDailyPhoto_(sheet, clientID) {
  try {
    console.log(`Getting daily photo for ${clientID}`);

    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);

    if (!sheetId) {
      console.error("❌ SHEET_ID not configured");
      return { url: "", caption: getDailyPhotoCaption_() };
    }

    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const photoSheet = getOrCreateSheet_(spreadsheet, SHEET_NAMES.KUVAT);

    // Get photo rotation settings
    const rotationSettings = getPhotoRotationSettings_(sheet, clientID);

    // Get next VALID photo based on rotation (skips removed images)
    const photoData = getNextValidPhotoFromSheet_(photoSheet, clientID, rotationSettings);

    if (photoData) {
      console.log(`✅ Found valid photo for ${clientID}: ${photoData.url}`);
      return {
        url: photoData.url,
        caption: photoData.caption || getDailyPhotoCaption_(),
        timestamp: photoData.timestamp
      };
    }

    console.log(`ℹ️ No photos found for ${clientID}, returning default`);
    return { url: "", caption: getDailyPhotoCaption_() };

  } catch (error) {
    console.error("Error getting daily photo:", error.toString());
    return { url: "", caption: getDailyPhotoCaption_() };
  }
}

/**
 * Get next photo from sheet based on rotation settings
 * @param {Object} photoSheet - Photo sheet reference
 * @param {string} clientID - Client identifier
 * @param {Object} rotationSettings - Rotation settings
 */
function getNextPhotoFromSheet_(photoSheet, clientID, rotationSettings) {
  try {
    const data = photoSheet.getDataRange().getValues();
    if (!data || data.length <= 1) return null;

    // Filter photos for this client
    const clientPhotos = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowClientId = String(row[0]).trim().toLowerCase();
      const url = String(row[2]).trim();
      const caption = String(row[1]).trim();
      const timestamp = row[3];

      if (rowClientId === clientID.toLowerCase() && url) {
        clientPhotos.push({
          url: url,
          caption: caption,
          timestamp: timestamp,
          rowIndex: i
        });
      }
    }

    if (clientPhotos.length === 0) return null;

    // Calculate which photo to show based on rotation settings
    const photoIndex = calculatePhotoIndex_(clientPhotos.length, rotationSettings);
    const selectedPhoto = clientPhotos[photoIndex];

    console.log(`🎯 Selected photo ${photoIndex + 1}/${clientPhotos.length} for ${clientID}`);
    return selectedPhoto;

  } catch (error) {
    console.error("Error getting next photo from sheet:", error.toString());
    return null;
  }
}

/**
 * Get photo rotation settings for client
 * @param {Object} sheet - Spreadsheet reference
 * @param {string} clientID - Client identifier
 */
function getPhotoRotationSettings_(sheet, clientID) {
  try {
    const configSheet = sheet.getSheetByName(SHEET_NAMES.CONFIG);
    if (!configSheet) {
      return { interval: "DAILY", seed: clientID };
    }

    const data = configSheet.getDataRange().getValues();
    if (!data || data.length <= 1) {
      return { interval: "DAILY", seed: clientID };
    }

    // Look for client-specific settings
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowClientId = String(row[0]).trim().toLowerCase();
      if (rowClientId === clientID.toLowerCase()) {
        return {
          interval: String(row[1]).trim() || "DAILY",
          seed: String(row[2]).trim() || clientID
        };
      }
    }

    return { interval: "DAILY", seed: clientID };

  } catch (error) {
    console.error("Error getting photo rotation settings:", error.toString());
    return { interval: "DAILY", seed: clientID };
  }
}

/**
 * Calculate photo index based on rotation settings
 * @param {number} photoCount - Total number of photos
 * @param {Object} rotationSettings - Rotation settings
 */
function calculatePhotoIndex_(photoCount, rotationSettings) {
  try {
    const today = new Date();
    const seed = rotationSettings.seed || "default";
    const interval = rotationSettings.interval || "DAILY";

    let seedValue;
    if (interval === "DAILY") {
      seedValue = `${seed}_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
    } else if (interval === "WEEKLY") {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      seedValue = `${seed}_${weekStart.getFullYear()}_${weekStart.getMonth()}_${weekStart.getDate()}`;
    } else {
      seedValue = seed;
    }

    return deterministicRandom_(seedValue, photoCount);

  } catch (error) {
    console.error("Error calculating photo index:", error.toString());
    return 0;
  }
}

/**
 * Check if image URL is still valid (not removed from Drive)
 * @param {string} url - Image URL to check
 * @returns {boolean} True if image exists, false otherwise
 */
function isImageUrlValid_(url) {
  try {
    if (!url || !url.trim()) return false;

    // Skip validation for non-Google Drive URLs (external images)
    if (!url.includes('drive.google.com') && !url.includes('docs.google.com')) {
      console.log(`🔗 External URL, skipping validation: ${url}`);
      return true;
    }

    // Extract file ID from Google Drive URL
    let fileId = null;

    if (url.includes('/file/d/')) {
      // Format: https://drive.google.com/file/d/FILE_ID/view
      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match) fileId = match[1];
    } else if (url.includes('/open?id=')) {
      // Format: https://drive.google.com/open?id=FILE_ID
      const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match) fileId = match[1];
    } else if (url.includes('/uc?id=')) {
      // Format: https://drive.google.com/uc?id=FILE_ID
      const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (match) fileId = match[1];
    }

    if (!fileId) {
      console.log(`❌ Could not extract file ID from URL: ${url}`);
      return false;
    }

    // Try to get file metadata (this will throw if file doesn't exist)
    const file = DriveApp.getFileById(fileId);

    // Additional check: ensure it's actually an image
    const mimeType = file.getMimeType();
    const isImage = mimeType && mimeType.startsWith('image/');

    if (!isImage) {
      console.log(`❌ File is not an image: ${mimeType} for URL: ${url}`);
      return false;
    }

    console.log(`✅ Image exists: ${url}`);
    return true;

  } catch (error) {
    console.log(`❌ Image validation failed for ${url}: ${error.toString()}`);
    return false;
  }
}

/**
 * Get next valid photo from sheet, skipping removed images
 * @param {Object} photoSheet - Photo sheet reference
 * @param {string} clientID - Client identifier
 * @param {Object} rotationSettings - Rotation settings
 */
function getNextValidPhotoFromSheet_(photoSheet, clientID, rotationSettings) {
  try {
    const data = photoSheet.getDataRange().getValues();
    if (!data || data.length <= 1) return null;

    // Filter photos for this client
    const clientPhotos = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowClientId = String(row[0]).trim().toLowerCase();
      const url = String(row[2]).trim();
      const caption = String(row[1]).trim();
      const timestamp = row[3];

      if (rowClientId === clientID.toLowerCase() && url) {
        clientPhotos.push({
          url: url,
          caption: caption,
          timestamp: timestamp,
          rowIndex: i
        });
      }
    }

    if (clientPhotos.length === 0) return null;

    // Try to find a valid photo starting from the calculated index
    const startIndex = calculatePhotoIndex_(clientPhotos.length, rotationSettings);

    // First, try the calculated photo
    if (isImageUrlValid_(clientPhotos[startIndex].url)) {
      console.log(`🎯 Selected valid photo ${startIndex + 1}/${clientPhotos.length} for ${clientID}`);
      return clientPhotos[startIndex];
    }

    // If not valid, try the next photos in sequence
    console.log(`⚠️ Selected photo not valid, trying next photos...`);
    for (let i = 1; i < clientPhotos.length; i++) {
      const checkIndex = (startIndex + i) % clientPhotos.length;
      if (isImageUrlValid_(clientPhotos[checkIndex].url)) {
        console.log(`🎯 Found alternative valid photo ${checkIndex + 1}/${clientPhotos.length} for ${clientID}`);
        return clientPhotos[checkIndex];
      }
    }

    // If no valid photos found, return null
    console.log(`❌ No valid photos found for ${clientID}`);
    return null;

  } catch (error) {
    console.error("Error getting next valid photo from sheet:", error.toString());
    return null;
  }
}

/**
 * Clean up invalid photo URLs from the sheet
 * @param {Object} sheet - Spreadsheet reference
 * @param {string} clientID - Client identifier (optional, if not provided cleans all)
 */
function cleanupInvalidPhotos_(sheet, clientID) {
  try {
    console.log(`🧹 Starting photo cleanup for ${clientID || 'all clients'}`);

    const photoSheet = getOrCreateSheet_(sheet, SHEET_NAMES.KUVAT);
    const data = photoSheet.getDataRange().getValues();
    const invalidRows = [];

    if (!data || data.length <= 1) {
      console.log("ℹ️ No photos to clean up");
      return { cleaned: 0, total: 0 };
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

      // Check if URL is valid
      if (url && !isImageUrlValid_(url)) {
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

    console.log(`✅ Photo cleanup complete: removed ${invalidRows.length} invalid photos`);
    return {
      cleaned: invalidRows.length,
      total: data.length - 1
    };

  } catch (error) {
    console.error("❌ Error during photo cleanup:", error.toString());
    return { error: error.toString(), cleaned: 0, total: 0 };
  }
}

/**
 * Deterministic random number generator
 * @param {string} seed - Seed string
 * @param {number} max - Maximum value
 */
function deterministicRandom_(seed, max) {
  const x = Math.sin(seed.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
}

/**
 * Get photo rotation debug info
 * @param {string} clientID - Client identifier
 * @param {Object} sheet - Spreadsheet reference
 */
function getPhotoRotationDebugInfo_(clientID, sheet) {
  try {
    const photoSheet = getOrCreateSheet_(sheet, SHEET_NAMES.KUVAT);
    const data = photoSheet.getDataRange().getValues();
    const clientPhotos = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowClientId = String(row[0]).trim().toLowerCase();
      if (rowClientId === clientID.toLowerCase()) {
        clientPhotos.push({
          url: String(row[2]).trim(),
          caption: String(row[1]).trim(),
          timestamp: row[3]
        });
      }
    }

    const rotationSettings = getPhotoRotationSettings_(sheet, clientID);
    const photoIndex = calculatePhotoIndex_(clientPhotos.length, rotationSettings);

    return {
      clientID: clientID,
      totalPhotos: clientPhotos.length,
      selectedIndex: photoIndex,
      rotationSettings: rotationSettings,
      selectedPhoto: clientPhotos[photoIndex] || null
    };

  } catch (error) {
    console.error("Error getting photo rotation debug info:", error.toString());
    return { error: error.toString() };
  }
}

/**
 * Extract URL from cell with fallback handling
 * @param {string} raw - Raw cell content
 * @param {string} formula - Cell formula
 * @param {Object} rich - Rich text value
 */
function extractUrlFromCellFallback_(raw, formula, rich) {
  try {
    // If it's a direct URL, return it
    if (raw && (raw.startsWith('http://') || raw.startsWith('https://'))) {
      return raw;
    }

    // If it's a formula, try to extract URL from it
    if (formula && formula.includes('HYPERLINK')) {
      const match = formula.match(/HYPERLINK\("([^"]+)"/);
      if (match) return match[1];
    }

    // If it's rich text, try to get URL from links
    if (rich && rich.getLinks) {
      const links = rich.getLinks();
      if (links.length > 0) {
        return links[0].getUrl();
      }
    }

    return raw || "";
  } catch (error) {
    console.error("Error extracting URL from cell:", error.toString());
    return raw || "";
  }
}

/**
 * Ensure high resolution Drive thumbnail
 * @param {string} url - Drive URL
 * @param {number} minWidth - Minimum width required
 */
function ensureHighResDriveThumb_(url, minWidth) {
  try {
    if (!url || !url.includes('drive.google.com')) return url;

    // Convert to high-res thumbnail
    if (url.includes('/thumbnail?')) {
      return url.replace(/sz=s\d+/, 'sz=s1000');
    } else if (url.includes('/uc?')) {
      return url + '&sz=s1000';
    }

    return url;
  } catch (error) {
    console.error("Error ensuring high res thumbnail:", error.toString());
    return url;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDailyPhotoUrl_,
    getDailyPhotoCaption_,
    getDailyPhoto_,
    getNextPhotoFromSheet_,
    getNextValidPhotoFromSheet_,
    isImageUrlValid_,
    cleanupInvalidPhotos_,
    getPhotoRotationSettings_,
    calculatePhotoIndex_,
    deterministicRandom_,
    getPhotoRotationDebugInfo_,
    extractUrlFromCellFallback_,
    ensureHighResDriveThumb_
  };
}
