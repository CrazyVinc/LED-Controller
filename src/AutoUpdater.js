var cp = require("child_process");
const http = require('https');
const fs = require('fs');
const axios = require("axios").default;
var hashFiles = require('hash-files');


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
    const res = await axios.post(AutoUpdater.URL, {
        hash: AutoUpdater.hash
      }).catch(function(err){
         return {error: true, ...err}; 
      });
    if (res.error) {
        console.error("Error getting checksum. do you have internet?");
        console.error("Giving up...");
        return;
    }
    Remotehash = res.data.hash;
    console.log("Hash on the server: " + res.data.hash);

    if (!AutoUpdater.AutoUpdater) {
        console.log("AutoUpdate is disabled in the AutoUpdater.json");
        return;
    } else {
        console.log("Update found!");
        console.log("Downloading update...");
        download(AutoUpdater.URL, "temp/update.zip", null);
    }
}

function clearFolders() {
    cp.exec("START run.cmd");
    process.exit(0);
}

function verify() {
    // console.log("Checking SHA-1 sum...");
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