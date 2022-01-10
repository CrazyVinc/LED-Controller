var cp = require("child_process");
var os = require("os");
const http = require('https');
const fs = require('fs');

const axios = require("axios").default;
const prompt = require('prompt');

prompt.start();

let AutoUpdaterCron;
let config;
if(require.main !== module) {
    config = require('./ConfigManager').config;
    AutoUpdaterCron = require('./CronJobs').AutoUpdaterCron;
}

let AutoUpdater = JSON.parse(fs.readFileSync('./AutoUpdater.json', 'utf8'));
let Remotehash;
let Localhash = AutoUpdater.hash;

async function init2() {
    if(require.main !== module) {
        if(!config.get().AutoUpdater) {
            console.log("AutoUpdate is disabled in the config");
            console.log("Canceling cronjob!");
            AutoUpdaterCron.stop();
            return;
        }
    }
    console.log("Getting Remote Hash...");
    const res = await axios.post(AutoUpdater.URL, {
        hash: AutoUpdater.hash
      }).catch(function(err){
         return {error: true, ...err}; 
      });
    if (res.error) {
        console.error("Error getting checksum. do you have internet?");
        console.error("Giving up...");
        console.error(res);
        return;
    }
    Remotehash = res.data.hash;
    console.log("Server: " + Remotehash);
    console.log("Local:  " + Localhash);

    if(Remotehash == Localhash) {
        console.log("Uptodate!");
        return;
    } else if(Remotehash == null) {
        console.log("The update server is at this moment not stable to provide you a update.");
        return;
    } else {
        console.log("Update found!");
        console.log("Downloading update...");
        download(AutoUpdater.URL, "temp/update.zip", null);
    }
}

function platform2() {
    var platform = os.platform();
    if(platform == "win32") {
        return "windows";
    } else if(platform == "haiku") {
        return "NoSupport";
    } else if(platform == "android") {
        return "NoSupport";
    } else {
        return platform;
    }
}
function arch2() {
    var arch = os.arch();
    if(arch == "x64") {
        return "amd64";
    } else if(arch == "x32") {
        return "386";
    } else {
        return arch;
    }
}

function runUpdater() {
    console.log("Looking for compiled updater")
    var platform = platform2();
    var arch = arch2();
    if(platform == "NoSupport" || arch == "NoSupport") {
        console.log("Canceling update.");
        console.log("No AutoUpdater found for this platform!");
        return;
    }
    if(platform == "windows") arch = arch+".exe"; // 32 Bit requires administration rights
    var updater = "Updater/Updater-"+platform+"-"+arch;
    if(fs.existsSync(updater)) {
        console.log("Compiled updater found! Starting updater.")
        process.send(JSON.stringify({
            msg: "update available!",
            exec: updater
        }));
    } else {
        console.log("???", updater);
    }
}

var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);
      runUpdater();
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest);
    if (cb) cb(err.message);
  });
};


async function init() {
if(require.main === module || !fs.existsSync('./config.json')) {
    console.log("Setup:")
    const Setup = await prompt.get(['SerialPort', 'WebPort']);
    console.log("Database Setup:")
    const DBSetup = await prompt.get(['hostname', 'user', 'password', 'database']);
        rawdata = JSON.stringify({
            "SerialPort": Setup.SerialPort,
            "AutoUpdater": true,
            "port": Setup.WebPort,
            "DB": {
            "hostname": DBSetup.hostname,
            "user" : DBSetup.user,
            "password" : DBSetup.password,
            "database" : DBSetup.database
            },
            "Events": {
            "SunSet": {
                "enabled": true,
                "Color": "white",
                "Brightness": 6,
                "criteria": {
                "type": "Web API",
                "API": {
                    "URL": "https://api.sunrise-sunset.org/json?lat=52.065150&lng=4.532130&formatted=0",
                    "type": "JSON"
                },
                "if": "results.sunset >= {$TimeNow}",
                "Recheck": {
                    "type": "hour",
                    "count": "1"
                }
                }
            }
            },
            "Other": {
                "Auth": true
            }
        });
        fs.writeFile('./config.json', rawdata, err => {
            if (err) {
                console.error(err);
            }
        })
        init2();
} else {
    init2();
}
}
init();
exports.update = init;