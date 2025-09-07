/**
 * Azure Functions Entry Point
 * This file exports all function definitions
 */

// Import and re-export all function modules
const { app } = require('@azure/functions');

// Import function definitions (they register themselves via app.http())
require('./azure-functions-reminder.js');

// Export the app instance
module.exports = app;