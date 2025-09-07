/**
 * Azure Functions Entry Point
 * This file exports all function definitions
 */

// Import all function modules
require('./azure-functions-reminder.js');

// Entry point is ready - functions are registered via app.http() calls in imported modules
console.log('Azure Functions runtime initialized');