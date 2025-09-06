// Bootstrap all function registrations
require('./azure-functions-reminder.js');
try { require('./minimal-test-function.js'); } catch (_) {}
try { require('./simple-test-function.js'); } catch (_) {}
