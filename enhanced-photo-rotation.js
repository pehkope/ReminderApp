/**
 * Enhanced photo rotation system with configurable intervals
 */

// ===================================================================================
//  PHOTO ROTATION ENHANCEMENTS
// ===================================================================================

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
        return {
          rotationInterval: data[i][7] || "daily", // Column H: daily, weekly, monthly
          randomize: data[i][8] === true || String(data[i][8]).toLowerCase() === 'true'
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
 * Enhanced photo selection with configurable rotation
 */
function getDailyPhotoEnhanced_(sheet, clientID) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const albumId = scriptProperties.getProperty(GOOGLE_PHOTOS_ALBUM_ID_KEY);
    
    // Get rotation settings
    const rotationSettings = getPhotoRotationSettings_(sheet, clientID);
    
    // Method 1: Try Google Photos (photos.google.com)
    if (albumId && albumId !== "YOUR_GOOGLE_PHOTOS_ALBUM_ID_HERE") {
      
      // Check if it's a Google Photos URL/ID
      if (albumId.includes('photos.google.com') || albumId.includes('photos.app.goo.gl')) {
        console.log("Attempting Google Photos integration...");
        const googlePhoto = getGooglePhotosAlbumImage_(albumId, clientID, rotationSettings);
        if (googlePhoto.url) {
          return googlePhoto;
        }
        console.log("Google Photos failed, trying Google Drive method...");
      }
      
      // Method 2: Try Google Drive folder (drive.google.com)
      const drivePhoto = getGooglePhotosImage_(albumId, clientID, rotationSettings);
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
    
    // Enhanced photo selection logic
    const photoIndex = calculatePhotoIndex_(photos.length, rotationSettings);
    
    return {
      url: photos[photoIndex][1],
      caption: photos[photoIndex][2] || "Kuva äidille",
      rotationInfo: `${rotationSettings.rotationInterval} rotation, photo ${photoIndex + 1}/${photos.length}`
    };
    
  } catch (error) {
    console.log('Error getting photo:', error.toString());
    return {url: "", caption: "Kuvia ei voitu hakea"};
  }
}

/**
 * Calculate photo index based on rotation settings
 */
function calculatePhotoIndex_(photoCount, rotationSettings) {
  const now = new Date();
  let intervalValue;
  
  switch (rotationSettings.rotationInterval.toLowerCase()) {
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
  if (rotationSettings.randomize) {
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