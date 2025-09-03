/**
 * Telegram integration module for ReminderApp
 * Handles Telegram webhook processing, message sending, and bot integration
 */

// Include config constants
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/config.js').getContentText()); // For GAS module loading

/**
 * Legacy webhook handler for Telegram bot integration
 * This function processes incoming Telegram webhook messages
 * @param {Object} e - GAS event object
 * @param {Object} postData - POST data from Telegram
 */
function handleTelegramWebhook_(e, postData) {
  try {
    console.log("🔄 WEBHOOK RECEIVED");

    if (!postData) {
      console.error("❌ No webhook data");
      return createCorsResponse_({ status: "ERROR", error: "No data" });
    }

    const scriptProperties = PropertiesService.getScriptProperties();
    const token = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY) || "";
    if (!token) {
      console.error("❌ Bot token missing");
      return createCorsResponse_({ status: "ERROR", error: "Token missing" });
    }

    const update = postData || {};
    const message = update.message || update.edited_message || {};
    const chat = message.chat || {};
    const chatId = String(chat.id || "");
    const caption = String(message.caption || "").trim();
    const text = String(message.text || "").trim();
    console.log("📨 Processing message ID:", message.message_id, "from chat:", chatId);

    // Photo deduplication
    const photo = message.photo ? message.photo[message.photo.length - 1] : null;
    const document = message.document;
    const fileUniqueId = photo?.file_unique_id || (document?.mime_type?.startsWith("image/") ? document.file_unique_id : null);

    if (fileUniqueId) {
      const photoKey = `processed_photo_${fileUniqueId}`;
      const props = PropertiesService.getScriptProperties();

      if (props.getProperty(photoKey)) {
        console.log(`📸 DUPLICATE IMAGE: ${fileUniqueId} - SKIPPING`);
        return createCorsResponse_({ status: 'OK' });
      }

      props.setProperty(photoKey, new Date().toISOString());
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

    // Jos teksti-/komentoviesti
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
      return createCorsResponse_({ status: "OK" });
    }

    // Process the image
    try {
      const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
      if (!sheetId) {
        console.error("❌ Sheet ID missing");
        return createCorsResponse_({ status: "ERROR", error: "Sheet ID missing" });
      }

      const spreadsheet = SpreadsheetApp.openById(sheetId);
      const photoSheet = getOrCreateSheet_(spreadsheet, SHEET_NAMES.KUVAT);

      console.log(`📸 Processing image for client: ${clientID}`);
      console.log(`🆔 File ID: ${fileId}`);

      // Get file path from Telegram
      const fileResponse = UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
      const fileData = JSON.parse(fileResponse.getContentText());

      if (!fileData.ok || !fileData.result) {
        console.error("❌ Failed to get file info from Telegram");
        return createCorsResponse_({ status: "ERROR", error: "Failed to get file info" });
      }

      const filePath = fileData.result.file_path;
      const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;

      console.log(`📥 Downloading from: ${downloadUrl}`);

      // Download the image
      const imageResponse = UrlFetchApp.fetch(downloadUrl);
      const imageBlob = imageResponse.getBlob();

      console.log(`📏 Image size: ${imageBlob.getBytes().length} bytes`);

      // Upload to Google Drive
      const driveFile = DriveApp.createFile(imageBlob);
      const driveUrl = `https://drive.google.com/uc?id=${driveFile.getId()}`;

      console.log(`☁️ Uploaded to Drive: ${driveUrl}`);

      // Store in sheet
      const timestamp = new Date();
      const rowData = [
        clientID,
        caption || "",
        driveUrl,
        timestamp,
        fileUniqueId,
        "telegram"
      ];

      photoSheet.appendRow(rowData);

      console.log(`✅ Image stored for ${clientID}`);

      // Send confirmation
      try {
        sendTelegramMessage_(token, chatId, `Kuva vastaanotettu ja tallennettu! 📸`);
      } catch (__) {}

    } catch (error) {
      console.error(`❌ Error processing Telegram image: ${error.toString()}`);
      return createCorsResponse_({ status: "ERROR", error: error.toString() });
    }

    return createCorsResponse_({ status: "OK" });

  } catch (error) {
    console.error(`❌ Error in Telegram webhook: ${error.toString()}`);
    return createCorsResponse_({ status: "ERROR", error: error.toString() });
  }
}

/**
 * Send message via Telegram bot
 * @param {string} token - Bot token
 * @param {string} chatId - Target chat ID
 * @param {string} message - Message to send
 * @param {Object} sheet - Optional spreadsheet reference
 * @param {string} clientID - Optional client ID
 * @param {boolean} usePhotos - Optional flag for photo usage
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

/**
 * Toggle Telegram webhook
 * @param {Object} params - Parameters for webhook setup
 */
function handleToggleWebhook_(params) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const token = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY);

    if (!token) {
      return { success: false, error: "Bot token not configured" };
    }

    const action = params.action; // 'set' or 'delete'
    const baseUrl = ScriptApp.getService().getUrl();

    if (action === 'set') {
      const webhookUrl = `${baseUrl}`;
      const setWebhookUrl = `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

      const response = UrlFetchApp.fetch(setWebhookUrl);
      const result = JSON.parse(response.getContentText());

      if (result.ok) {
        return { success: true, message: "Webhook set successfully" };
      } else {
        return { success: false, error: result.description };
      }
    } else if (action === 'delete') {
      const deleteWebhookUrl = `https://api.telegram.org/bot${token}/deleteWebhook`;

      const response = UrlFetchApp.fetch(deleteWebhookUrl);
      const result = JSON.parse(response.getContentText());

      if (result.ok) {
        return { success: true, message: "Webhook deleted successfully" };
      } else {
        return { success: false, error: result.description };
      }
    }

    return { success: false, error: "Invalid action" };
  } catch (error) {
    console.error("Error in webhook toggle:", error.toString());
    return { success: false, error: error.toString() };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleTelegramWebhook_,
    sendTelegramMessage_,
    handleToggleWebhook_
  };
}
