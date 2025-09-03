/**
 * Reminders module for ReminderApp
 * Handles all types of reminders: medicine, food, time-based, and acknowledgments
 */

// Include config constants
eval(UrlFetchApp.fetch('https://raw.githubusercontent.com/your-repo/config.js').getContentText()); // For GAS module loading

/**
 * Get daily tasks for a client at specific time of day
 * @param {Object} sheet - Spreadsheet reference
 * @param {string} clientID - Client identifier
 * @param {string} timeOfDay - Time of day (AAMU/PAIVA/ILTA/YO)
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
            timeOfDay: timeOfDay,
            requiresAck: true,
            isAckedToday: isAcked,
            acknowledgmentTimestamp: isAcked ? getTaskAckTimestamp_(sheet, taskType, timeOfDay, today) : null
          });
        }
      }
    }

    console.log(`✅ Found ${tasks.length} tasks for ${clientID}`);
    return tasks;

  } catch (error) {
    console.error(`❌ Error getting daily tasks: ${error.toString()}`);
    return [];
  }
}

/**
 * Get medicine reminders from sheet
 * @param {Object} sheet - Spreadsheet reference
 * @param {string} clientID - Client identifier
 * @param {string} timeOfDay - Time of day
 * @param {number} currentHour - Current hour
 */
function getMedicineReminders_(sheet, clientID, timeOfDay, currentHour) {
  try {
    const medicineSheet = sheet.getSheetByName(SHEET_NAMES.LÄÄKKEET);
    if (!medicineSheet) return [];

    const data = medicineSheet.getDataRange().getValues();
    if (!data || data.length <= 1) return [];

    const reminders = [];
    const seen = new Set(); // Deduplication

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowClient = String(row[0]).trim().toLowerCase();
      const rowTimeOfDay = String(row[1]).trim().toUpperCase();
      const medicine = String(row[2]).trim();
      const dosage = String(row[3]).trim();
      const frequency = String(row[4]).trim();

      if (!medicine) continue;
      if (rowClient && rowClient !== clientID.toLowerCase() && rowClient !== '*') continue;
      if (rowTimeOfDay && rowTimeOfDay !== timeOfDay.toUpperCase()) continue;

      const desc = dosage ? `${medicine} (${dosage})` : medicine;
      if (!seen.has(desc)) {
        seen.add(desc);
        reminders.push(`💊 ${desc}`);
      }
    }

    return reminders;
  } catch (error) {
    console.error("Error getting medicine reminders:", error.toString());
    return [];
  }
}

/**
 * Get food reminders from sheet
 * @param {Object} sheet - Spreadsheet reference
 * @param {string} clientID - Client identifier
 * @param {string} timeOfDay - Time of day
 * @param {number} currentHour - Current hour
 */
function getFoodReminders_(sheet, clientID, timeOfDay, currentHour) {
  try {
    const foodSheet = sheet.getSheetByName(SHEET_NAMES.RUOKA_AJAT);
    if (!foodSheet) return [];

    const data = foodSheet.getDataRange().getValues();
    if (!data || data.length <= 1) return [];

    const reminders = [];
    const seen = new Set();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowClient = String(row[0]).trim().toLowerCase();
      const rowTimeOfDay = String(row[1]).trim().toUpperCase();
      const meal = String(row[2]).trim();
      const suggestion = String(row[3]).trim();
      const timeStr = String(row[4]).trim();

      if (!suggestion) continue;
      if (rowClient && rowClient !== clientID.toLowerCase() && rowClient !== '*') continue;
      if (rowTimeOfDay && rowTimeOfDay !== timeOfDay.toUpperCase()) continue;

      // Time window check
      if (timeStr) {
        const rangeMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
        if (rangeMatch) {
          const sh = parseInt(rangeMatch[1]) || 0, sm = parseInt(rangeMatch[2]) || 0;
          const eh = parseInt(rangeMatch[3]) || 0, em = parseInt(rangeMatch[4]) || 0;
          const start = new Date();
          start.setHours(sh, sm, 0, 0);
          const end = new Date();
          end.setHours(eh, em, 0, 0);
          const now = new Date();
          if (!(now >= start && now <= end)) continue;
        }
      }

      const options = suggestion.split('|').map(s => String(s).trim()).filter(s => s);
      if (options.length === 0) continue;

      options.forEach(option => {
        const desc = meal ? `${meal}: ${option}` : option;
        if (!seen.has(desc)) {
          seen.add(desc);
          reminders.push(`🍽️ ${desc}`);
        }
      });
    }

    return reminders;
  } catch (error) {
    console.error("Error getting food reminders:", error.toString());
    return [];
  }
}

/**
 * Check if task is already acknowledged today
 * @param {Object} sheet - Spreadsheet reference
 * @param {string} taskType - Task type
 * @param {string} timeOfDay - Time of day
 * @param {string} description - Task description
 * @param {string} today - Today's date string
 */
function isTaskAckedToday_(sheet, taskType, timeOfDay, description, today) {
  try {
    const ackSheet = getOrCreateSheet_(sheet, SHEET_NAMES.KUITTAUKSET);
    const data = ackSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowDate = String(row[0]);
      const rowTaskType = String(row[1]);
      const rowTimeOfDay = String(row[2]);
      const rowDescription = String(row[3]);

      if (rowDate === today &&
          rowTaskType === taskType &&
          rowTimeOfDay === timeOfDay &&
          rowDescription === description) {
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
 * @param {Object} sheet - Spreadsheet reference
 * @param {string} taskType - Task type
 * @param {string} timeOfDay - Time of day
 * @param {string} today - Today's date string
 */
function getTaskAckTimestamp_(sheet, taskType, timeOfDay, today) {
  try {
    const ackSheet = getOrCreateSheet_(sheet, SHEET_NAMES.KUITTAUKSET);
    const data = ackSheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowDate = String(row[0]);
      const rowTaskType = String(row[1]);
      const rowTimeOfDay = String(row[2]);

      if (rowDate === today && rowTaskType === taskType && rowTimeOfDay === timeOfDay) {
        return String(row[4]); // timestamp
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting acknowledgment timestamp:", error.toString());
    return null;
  }
}

/**
 * Acknowledge weekly task
 * @param {string} clientID - Client identifier
 * @param {string} taskType - Task type
 * @param {string} timeOfDay - Time of day
 * @param {string} description - Task description
 * @param {string} timestamp - Acknowledgment timestamp
 */
function acknowledgeWeeklyTask_(clientID, taskType, timeOfDay, description, timestamp) {
  try {
    const scriptProperties = PropertiesService.getScriptProperties();
    const sheetId = scriptProperties.getProperty(SHEET_ID_KEY);
    if (!sheetId) return false;

    const spreadsheet = SpreadsheetApp.openById(sheetId);
    const ackSheet = getOrCreateSheet_(spreadsheet, SHEET_NAMES.KUITTAUKSET);

    const today = Utilities.formatDate(new Date(), HELSINKI_TIMEZONE, "yyyy-MM-dd");

    // Check if already acknowledged
    if (isTaskAckedToday_(spreadsheet, taskType, timeOfDay, description, today)) {
      console.log(`✅ Task already acknowledged: ${taskType} - ${description}`);
      return true;
    }

    // Add acknowledgment
    ackSheet.appendRow([
      today,
      taskType,
      timeOfDay,
      description,
      timestamp,
      clientID
    ]);

    console.log(`✅ Task acknowledged: ${taskType} - ${description}`);
    return true;

  } catch (error) {
    console.error(`❌ Error acknowledging task: ${error.toString()}`);
    return false;
  }
}

/**
 * Get food emoji based on meal type
 * @param {string} mealType - Type of meal
 */
function getFoodEmoji_(mealType) {
  const emojiMap = {
    'AAMU': '🌅',
    'AAMIAINEN': '🥐',
    'LUNCH': '🥗',
    'PAIVA': '🌞',
    'PAIVALLINEN': '🍽️',
    'ILTA': '🌆',
    'ILLALLINEN': '🍝',
    'YO': '🌙',
    'ILtapala': '🥛'
  };

  const key = String(mealType || '').toUpperCase();
  return emojiMap[key] || '🍽️';
}

/**
 * Get time-based medicine message
 * @param {string} timeOfDay - Time of day
 */
function getTimeBasedMedicineMessage_(timeOfDay) {
  const messages = {
    'AAMU': 'Aamu lääkkeet',
    'PAIVA': 'Päivä lääkkeet',
    'ILTA': 'Ilta lääkkeet',
    'YO': 'Yö lääkkeet'
  };
  return messages[timeOfDay] || 'Lääkkeet';
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getDailyTasks_,
    getMedicineReminders_,
    getFoodReminders_,
    isTaskAckedToday_,
    getTaskAckTimestamp_,
    acknowledgeWeeklyTask_,
    getFoodEmoji_,
    getTimeBasedMedicineMessage_
  };
}
