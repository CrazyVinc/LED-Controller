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


require('./src/Database');
const config = require('./src/ConfigManager');

const AutoUpdater = require('./src/AutoUpdater');
const HTTP = require('./src/HTTP');

process.on("message", function (message) {
  console.log(`Message from main.js:`, message);
});