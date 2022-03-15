require('console-stamp')(console, '[HH:MM:ss.l]');

const config = require('./src/ConfigManager');

const AutoUpdater = require('./src/AutoUpdater');
const HTTP = require('./src/HTTP');

process.on("message", function (message) {
  console.log(`Message from main.js: ${message}`);
});