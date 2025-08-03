/**
 * Enhanced Important Message System
 * - Shows message 2 days before event
 * - Hides automatically day after event
 * - Supports multiple messages with priorities
 */

// ===================================================================================
//  ENHANCED IMPORTANT MESSAGE FUNCTIONS
// ===================================================================================

/**
 * Get smart important message based on date logic
 */
function getImportantMessage_(sheet) {
  try {
    const messagesSheet = sheet.getSheetByName("Viestit");
    if (!messagesSheet) {
      console.log("No 'Viestit' sheet found");
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
      const showDaysAfter = row[4] || 0;         // Column E: Days after to show (default 0, hides day after)
      
      if (!eventDate || !message) {
        continue; // Skip invalid rows
      }
      
      // Calculate date range when message should be visible
      const startShowDate = new Date(eventDate);
      startShowDate.setDate(eventDate.getDate() - showDaysBefore);
      
      const endShowDate = new Date(eventDate);
      endShowDate.setDate(eventDate.getDate() + showDaysAfter);
      
      // Check if today is within the show range
      if (today >= startShowDate && today <= endShowDate) {
        const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
        
        activeMessages.push({
          message: message,
          eventDate: eventDate,
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
    
    // Normalize to start of day
    eventDate.setHours(0, 0, 0, 0);
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
  const { message, daysUntilEvent, isToday, isPast } = messageObj;
  
  if (isToday) {
    return `🔔 TÄNÄÄN: ${message}`;
  } else if (isPast) {
    return `📋 ${message} (oli ${Math.abs(daysUntilEvent)} päivää sitten)`;
  } else if (daysUntilEvent === 1) {
    return `⚠️ HUOMENNA: ${message}`;
  } else {
    return `📅 ${daysUntilEvent} PÄIVÄN PÄÄSTÄ: ${message}`;
  }
}

/**
 * Debug function to test important messages
 */
function debugImportantMessages_(sheet) {
  try {
    console.log("=== IMPORTANT MESSAGES DEBUG ===");
    
    const messagesSheet = sheet.getSheetByName("Viestit");
    if (!messagesSheet) {
      console.log("❌ No 'Viestit' sheet found");
      return;
    }
    
    const data = messagesSheet.getDataRange().getValues();
    console.log(`📊 Found ${data.length - 1} messages in sheet`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`📅 Today: ${today.toLocaleDateString()}`);
    
    // Test each message
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const eventDate = parseEventDate_(row[0]);
      const message = String(row[1]).trim();
      const showDaysBefore = row[3] || 2;
      const showDaysAfter = row[4] || 0;
      
      if (eventDate && message) {
        const daysUntilEvent = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
        const shouldShow = daysUntilEvent >= -showDaysAfter && daysUntilEvent <= showDaysBefore;
        
        console.log(`Row ${i}: "${message}"`);
        console.log(`  📅 Event: ${eventDate.toLocaleDateString()}`);
        console.log(`  ⏱️ Days until: ${daysUntilEvent}`);
        console.log(`  👁️ Show range: ${showDaysBefore} days before to ${showDaysAfter} days after`);
        console.log(`  ✅ Should show: ${shouldShow}`);
        console.log("");
      }
    }
    
    const currentMessage = getImportantMessage_(sheet);
    console.log(`🎯 Current active message: "${currentMessage}"`);
    
  } catch (error) {
    console.error("Debug error:", error);
  }
}

/**
 * Create example Viestit sheet structure for new clients
 */
function createExampleViestitSheet_(sheet) {
  try {
    // Check if Viestit sheet already exists
    let viestiteSheet = sheet.getSheetByName("Viestit");
    
    if (!viestiteSheet) {
      viestiteSheet = sheet.insertSheet("Viestit");
    }
    
    // Clear existing content
    viestiteSheet.clear();
    
    // Create headers
    const headers = [
      ["Päivämäärä", "Viesti", "Prioriteetti", "Päiviä ennen", "Päiviä jälkeen", "Huomiot"]
    ];
    
    // Example data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    
    const examples = [
      [tomorrow, "Lääkäri aika kello 14:00", 1, 1, 0, "Näkyy huomenna"],
      [nextWeek, "Perhe tulee käymään", 2, 2, 0, "Näkyy 2 päivää ennen"],
      [nextMonth, "Hiusten leikkaus", 3, 3, 1, "Näkyy 3 päivää ennen, 1 päivä jälkeen"]
    ];
    
    // Write data
    const allData = headers.concat(examples);
    const range = viestiteSheet.getRange(1, 1, allData.length, allData[0].length);
    range.setValues(allData);
    
    // Format headers
    const headerRange = viestiteSheet.getRange(1, 1, 1, headers[0].length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#E8F0FE");
    
    // Auto-resize columns
    viestiteSheet.autoResizeColumns(1, headers[0].length);
    
    console.log("✅ Example Viestit sheet created");
    
  } catch (error) {
    console.error("Error creating Viestit sheet:", error);
  }
}