var cp = require("child_process");
var os = require("os");
const http = require('https');
const fs = require('fs');
const axios = require("axios").default;
var hashFiles = require('hash-files');

const { config } = require('./ConfigManager');

let AutoUpdater = JSON.parse(fs.readFileSync('./AutoUpdater.json', 'utf8'));
let version = "";
let Remotehash;
let Localhash = AutoUpdater.hash;
function hash5(h) {
    Localhash = h;
    init();
}

async function init() {
    console.log("Getting Local Hash...");
    
    console.log(-583, Localhash);
    const res = await axios.get(AutoUpdater.URL, {
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
    console.log("Hash on the server: " + res.data.hash);

    if (!config.options.AutoUpdater) {
        console.log("AutoUpdate is disabled in the AutoUpdater.json");
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

function clearFolders() {
    var platform = platform2();
    var arch = arch2();
    if(platform == "NoSupport" || arch == "NoSupport") {
        console.log("Canceling update.");
        console.log("No AutoUpdater found for this platform!");
        return;
    }
    if(platform == "windows") arch = "386.exe";
    var updater = "./Updater/Updater-"+platform+"-"+arch;
    if(fs.existsSync(updater)) {
        cp.exec(updater);
        process.exit(0);
    } else {
        console.log("???", updater);
    }
}

function verify() {
    console.log("Checking SHA-1 sum...");
    // console.log("Expecting SHA-1: " + Remotehash);
    // console.log("      Got SHA-1: " + Localhash);
    // if (Remotehash !== Localhash) {
    //     console.log("SHA-1 Verify success! Unzipping...");
        clearFolders();
    // } else {
    //     console.error("ERROR: SHA-1 Verify failed.");
    //     process.exit(1);
    // }
}
/*

function unzipjob() {
    fs.createReadStream('./deployment.zip').pipe(unzip.Extract({ path: '.' }));
    fs.unlinkSync("./deployment.zip");
    console.log("Finishing in a bit, still extracting...");
}
*/
var download = function(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close(cb);
      verify();
    });
  }).on('error', function(err) { // Handle errors
    fs.unlink(dest);
    if (cb) cb(err.message);
  });
};


exports = {
    Updater: init()
    // Updater: hashFiles({
    //     "files": [
    //         "./src/**",
    //         "./views/**",
    //         "./routes/**",
    //         "./assets/**",
    //         "./package.json",
    //     ]
    // }, async(error, hash) => {
    //     hash5(hash);
    // })
}