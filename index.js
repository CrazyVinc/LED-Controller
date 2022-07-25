var fs = require('fs');

require('console-stamp')(console, '[HH:MM:ss.l]');

if (!fs.existsSync("data/tmp")){
  fs.mkdirSync("data/tmp", { recursive: true });
}
if (!fs.existsSync("data/cache")){
  fs.mkdirSync("data/cache", { recursive: true });
}

if (!fs.existsSync("data/Settings")) {
  fs.mkdirSync("data/Settings", { recursive: true });
}



require('./src/AutoUpdater');
require('./src/ConfigManager');
require('./src/LEDManager');
require('./src/ArduinoParser');
require('./src/Database');
require('./src/HTTP');

process.on("message", function (message) {
  console.log(`Message from main.js:`, message);
});