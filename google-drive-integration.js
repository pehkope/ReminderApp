/**
 * Google Drive integraatio ReminderApp:iin
 * Hallinnoi asiakaskohtaisia kuvia ja tiedostoja
 */

// ===================================================================================
//  GOOGLE DRIVE FUNCTIONS
// ===================================================================================

/**
 * Luo asiakaskohtainen Drive-kansiorakenne
 */
function createClientDriveStructure(clientId, displayName) {
  try {
    // Luo pääkansio asiakkaalle
    const mainFolder = DriveApp.createFolder(`ReminderApp_${displayName}_${clientId}_2024`);
    
    // Luo alakansiot
    const photosFolder = DriveApp.createFolder('Photos');
    const weeklyPhotosFolder = DriveApp.createFolder('weekly_photos');
    const profileFolder = DriveApp.createFolder('profile');
    const videosFolder = DriveApp.createFolder('videos');
    const dataFolder = DriveApp.createFolder('Data');
    const configFolder = DriveApp.createFolder('Config');
    
    // Siirrä alakansiot pääkansioon
    photosFolder.moveTo(mainFolder);
    weeklyPhotosFolder.moveTo(photosFolder);
    profileFolder.moveTo(photosFolder);
    videosFolder.moveTo(photosFolder);
    dataFolder.moveTo(mainFolder);
    configFolder.moveTo(mainFolder);
    
    // Palauta kansio-ID:t
    return {
      mainFolderId: mainFolder.getId(),
      photosFolderId: photosFolder.getId(),
      weeklyPhotosFolderId: weeklyPhotosFolder.getId(),
      profileFolderId: profileFolder.getId(),
      videosFolderId: videosFolder.getId(),
      dataFolderId: dataFolder.getId(),
      configFolderId: configFolder.getId(),
      driveUrl: mainFolder.getUrl()
    };
    
  } catch (error) {
    console.error('Error creating Drive structure:', error);
    throw error;
  }
}

/**
 * Aseta kansion käyttöoikeudet perheenjäsenille
 */
function setDriveFolderPermissions(folderId, familyEmails) {
  try {
    const folder = DriveApp.getFolderById(folderId);
    
    // Poista nykyiset käyttöoikeudet
    const editors = folder.getEditors();
    editors.forEach(editor => {
      if (editor.getEmail() !== Session.getActiveUser().getEmail()) {
        folder.removeEditor(editor);
      }
    });
    
    // Lisää perheenjäsenet editoriksi
    familyEmails.forEach(email => {
      folder.addEditor(email);
    });
    
    // Varmista että kansio on yksityinen
    folder.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
    
    console.log(`✅ Drive permissions set for folder: ${folder.getName()}`);
    
  } catch (error) {
    console.error('Error setting Drive permissions:', error);
    throw error;
  }
}

/**
 * Hae viimeisimmät kuvat asiakkaalle
 */
function getLatestPhotos(clientId, photoType = 'weekly', limit = 5) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const folderId = scriptProperties.getProperty(`${clientId}_${photoType}_folder_id`);
    
    if (!folderId) {
      console.log(`No ${photoType} folder configured for client: ${clientId}`);
      return [];
    }
    
    const folder = DriveApp.getFolderById(folderId);
    const files = folder.getFiles();
    const photos = [];
    
    while (files.hasNext() && photos.length < limit) {
      const file = files.next();
      
      // Tarkista että on kuvatiedosto
      if (file.getBlob().getContentType().startsWith('image/')) {
        photos.push({
          name: file.getName(),
          url: getPublicImageUrl(file.getId()),
          date: file.getDateCreated(),
          description: getPhotoDescription(file.getName())
        });
      }
    }
    
    // Järjestä uusimmat ensin
    return photos.sort((a, b) => b.date - a.date);
    
  } catch (error) {
    console.error('Error getting latest photos:', error);
    return [];
  }
}

/**
 * Luo julkinen URL kuvalle (käyttäen Google Drive viewer)
 */
function getPublicImageUrl(fileId) {
  // Google Drive public viewer URL
  return `https://drive.google.com/uc?id=${fileId}&export=view`;
}

/**
 * Parsea kuvan kuvaus tiedostonimestä
 */
function getPhotoDescription(fileName) {
  // Esim: "2024-01-15_family_dinner.jpg" -> "Family Dinner"
  const parts = fileName.split('_');
  if (parts.length >= 2) {
    const description = parts.slice(1).join(' ').replace(/\.[^/.]+$/, "");
    return description.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }
  return fileName.replace(/\.[^/.]+$/, "");
}

/**
 * Tallenna kuva Drive:en
 */
function uploadPhotoToDrive(clientId, photoType, fileBlob, fileName, description = '') {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const folderId = scriptProperties.getProperty(`${clientId}_${photoType}_folder_id`);
    
    if (!folderId) {
      throw new Error(`No ${photoType} folder configured for client: ${clientId}`);
    }
    
    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(fileBlob.setName(fileName));
    
    // Lisää metadata
    if (description) {
      file.setDescription(description);
    }
    
    console.log(`✅ Photo uploaded: ${fileName} for client: ${clientId}`);
    
    return {
      fileId: file.getId(),
      url: getPublicImageUrl(file.getId()),
      name: fileName,
      uploadDate: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error uploading photo:', error);
    throw error;
  }
}

/**
 * Päivitä Google Sheets Script Properties Drive kansio-ID:iden kanssa
 */
function updateScriptPropertiesWithDrive(clientId, driveStructure) {
  try {
    const properties = PropertiesService.getScriptProperties();
    
    // Tallenna kansio-ID:t
    properties.setProperties({
      [`${clientId}_main_folder_id`]: driveStructure.mainFolderId,
      [`${clientId}_photos_folder_id`]: driveStructure.photosFolderId,
      [`${clientId}_weekly_folder_id`]: driveStructure.weeklyPhotosFolderId,
      [`${clientId}_profile_folder_id`]: driveStructure.profileFolderId,
      [`${clientId}_videos_folder_id`]: driveStructure.videosFolderId,
      [`${clientId}_drive_url`]: driveStructure.driveUrl
    });
    
    console.log(`✅ Script properties updated with Drive structure for: ${clientId}`);
    
  } catch (error) {
    console.error('Error updating script properties:', error);
    throw error;
  }
}

// ===================================================================================
//  CLIENT SETUP WITH DRIVE INTEGRATION
// ===================================================================================

/**
 * Luo täydellinen asiakas-setup Drive + Sheets
 */
function createCompleteClientSetup(clientInfo) {
  const {clientId, displayName, familyEmails} = clientInfo;
  
  try {
    // 1. Luo Google Sheet
    const sheet = SpreadsheetApp.create(`ReminderApp_${displayName}_${clientId}`);
    setupSheetStructure(sheet, clientId);
    setSheetPermissions(sheet, familyEmails);
    
    // 2. Luo Drive-kansiot
    const driveStructure = createClientDriveStructure(clientId, displayName);
    setDriveFolderPermissions(driveStructure.mainFolderId, familyEmails);
    
    // 3. Päivitä Script Properties
    updateScriptPropertiesWithDrive(clientId, driveStructure);
    
    // 4. Linkitä Sheet Drive-kansioon
    const dataFolder = DriveApp.getFolderById(driveStructure.dataFolderId);
    DriveApp.getFileById(sheet.getId()).moveTo(dataFolder);
    
    console.log(`✅ Complete client setup created for: ${displayName} (${clientId})`);
    
    return {
      clientId: clientId,
      sheetId: sheet.getId(),
      sheetUrl: sheet.getUrl(),
      driveStructure: driveStructure,
      setupComplete: true
    };
    
  } catch (error) {
    console.error('Error in complete client setup:', error);
    throw error;
  }
}