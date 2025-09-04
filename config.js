/**
 * Configuration constants for ReminderApp
 * Contains all sheet names, task types, time constants, and other configuration values
 */

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

// Property keys for Script Properties
const SHEET_ID_KEY = "SHEET_ID";
const TELEGRAM_BOT_TOKEN_KEY = "TELEGRAM_BOT_TOKEN";
const TELEGRAM_WEBHOOK_SECRET_KEY = "TELEGRAM_WEBHOOK_SECRET";
const ALLOWED_TELEGRAM_CHAT_IDS_KEY = "ALLOWED_TELEGRAM_CHAT_IDS";

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SHEET_NAMES,
    TASK_TYPES,
    TIME_OF_DAY,
    SAA_KATEGORIAT,
    PUUHAA_KATEGORIAT,
    EMOJIS,
    SHEET_ID_KEY,
    TELEGRAM_BOT_TOKEN_KEY,
    TELEGRAM_WEBHOOK_SECRET_KEY,
    ALLOWED_TELEGRAM_CHAT_IDS_KEY
  };
}
