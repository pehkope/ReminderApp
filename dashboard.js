/**
 * Dashboard module for ReminderApp
 * Handles dashboard data, system monitoring, and health checks
 */

// Include config constants
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/config.js').getContentText()); // For GAS module loading

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

/**
 * Get health status of the system
 */
function getHealthStatus_() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    const telegramToken = scriptProperties.getProperty(TELEGRAM_BOT_TOKEN_KEY);

    let healthStatus = {
      overall: 'healthy',
      checks: {}
    };

    // Check Sheet access
    try {
      if (sheetId) {
        const spreadsheet = SpreadsheetApp.openById(sheetId);
        healthStatus.checks.sheetAccess = {
          status: 'healthy',
          message: 'Sheet access OK',
          details: `Sheet ID: ${sheetId}`
        };
      } else {
        healthStatus.checks.sheetAccess = {
          status: 'unhealthy',
          message: 'Sheet ID not configured'
        };
        healthStatus.overall = 'unhealthy';
      }
    } catch (error) {
      healthStatus.checks.sheetAccess = {
        status: 'unhealthy',
        message: 'Sheet access failed: ' + error.toString()
      };
      healthStatus.overall = 'unhealthy';
    }

    // Check Telegram token
    if (telegramToken) {
      healthStatus.checks.telegramToken = {
        status: 'healthy',
        message: 'Telegram token configured'
      };
    } else {
      healthStatus.checks.telegramToken = {
        status: 'warning',
        message: 'Telegram token not configured'
      };
    }

    // Check webhook status
    if (telegramToken) {
      try {
        const response = UrlFetchApp.fetch(
          `https://api.telegram.org/bot${telegramToken}/getWebhookInfo`
        );
        const data = JSON.parse(response.getContentText());
        if (data.ok) {
          const webhook = data.result;
          healthStatus.checks.webhook = {
            status: webhook.url ? 'healthy' : 'warning',
            message: webhook.url ? 'Webhook active' : 'Webhook not set',
            details: `Pending updates: ${webhook.pending_update_count || 0}`
          };
        }
      } catch (error) {
        healthStatus.checks.webhook = {
          status: 'unhealthy',
          message: 'Webhook check failed: ' + error.toString()
        };
      }
    }

    // System uptime (simplified)
    healthStatus.checks.uptime = {
      status: 'healthy',
      message: 'System running',
      details: new Date().toISOString()
    };

    return healthStatus;

  } catch (error) {
    console.error('Health check failed:', error.toString());
    return {
      overall: 'unhealthy',
      checks: {
        system: {
          status: 'unhealthy',
          message: 'System error: ' + error.toString()
        }
      }
    };
  }
}

/**
 * Get system logs (placeholder for future implementation)
 */
function getLogsPage_() {
  return `
    <html>
    <head>
      <meta charset="utf-8">
      <title>System Logs</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px}
        h2{color:#333}
      </style>
    </head>
    <body>
      <h2>📋 System Logs</h2>
      <p>Log viewing functionality will be implemented here.</p>
      <p><a href="?action=dashboard">← Back to Dashboard</a></p>
    </body>
    </html>
  `;
}

/**
 * Get settings page (placeholder for future implementation)
 */
function getSettingsPage_() {
  return `
    <html>
    <head>
      <meta charset="utf-8">
      <title>System Settings</title>
      <style>
        body{font-family:Arial,sans-serif;margin:20px}
        h2{color:#333}
      </style>
    </head>
    <body>
      <h2>⚙️ System Settings</h2>
      <p>Settings management will be implemented here.</p>
      <p><a href="?action=dashboard">← Back to Dashboard</a></p>
    </body>
    </html>
  `;
}

/**
 * Clear system logs
 */
function handleClearLogs_() {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);

    if (!sheetId) {
      return { success: false, error: "Sheet ID not configured" };
    }

    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const logSheet = getOrCreateSheet_(spreadsheet, 'WebhookLogs');

    // Clear all data except header
    const lastRow = logSheet.getLastRow();
    if (lastRow > 1) {
      logSheet.deleteRows(2, lastRow - 1);
    }

    console.log("✅ System logs cleared");
    return { success: true, message: "Logs cleared successfully" };

  } catch (error) {
    console.error("Error clearing logs:", error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * Handle settings update
 */
function handleUpdateSettings_(params) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();

    if (params.telegramToken) {
      scriptProperties.setProperty(TELEGRAM_BOT_TOKEN_KEY, params.telegramToken);
    }

    if (params.sheetId) {
      scriptProperties.setProperty(SHEET_ID_KEY, params.sheetId);
    }

    if (params.allowedChats) {
      scriptProperties.setProperty(ALLOWED_TELEGRAM_CHAT_IDS_KEY, params.allowedChats);
    }

    console.log("✅ Settings updated");
    return { success: true, message: "Settings updated successfully" };

  } catch (error) {
    console.error("Error updating settings:", error.toString());
    return { success: false, error: error.toString() };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleGetDashboardData_,
    getHealthStatus_,
    getLogsPage_,
    getSettingsPage_,
    handleClearLogs_,
    handleUpdateSettings_
  };
}
