require('console-stamp')(console, '[HH:MM:ss.l]');

const AutoUpdater = require('./src/AutoUpdater');

const HTTP = require('./src/HTTP');

require('./src/LEDManager');
const config = require('./src/ConfigManager');
const CommandParser = require('./src/ArduinoParser');

process.on("message", function (message) {
  console.log(`Message from main.js: ${message}`);
});