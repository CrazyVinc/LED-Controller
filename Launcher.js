const { spawn, fork } = require("child_process");
const fs = require('fs');
let AutoUpdaterJSON = JSON.parse(fs.readFileSync('./AutoUpdater.json', 'utf8'));

console.log("Starting Led Controller.");

let AutoUpdater;
let child;
let AutoUpdater2;
let child2;
function update(updater) {
    AutoUpdater = spawn(updater);
    AutoUpdater.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    
    AutoUpdater.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    
    AutoUpdater.on('close', (code) => {
      console.log(`Auto Updater exited with code ${code}`);
      Controller();
    });
}

function Controller() {
    child = fork("./index.js");
    // child.send("hoi");
    child.on("message", function (msg) {
        msg = JSON.parse(msg) || {msg: msg};
        if(msg.msg == "update available!") {
            child.kill();
            console.log("Updating..")
            AutoUpdater = update(msg.exec);
        } else {
            console.log(`Message from LED Controller: ${msg}`);
        }
    });

    child.on("close", function (code) {
        console.log("Led Controller exited with code " + code);
    });
}

function UpdateCheck() {
    child2 = fork("./src/AutoUpdater.js");
    child2.on("message", function (msg) {
        msg = JSON.parse(msg) || {msg: msg};
        if(msg.msg == "update available!") {
            console.log("Updating..")
            AutoUpdater2 = update(msg.exec);
        } else {
            console.log(`Message from LED Controller: ${msg}`);
        }
    });

    child2.on("close", function (code) {
        console.log("Led Controller exited with code " + code);
    });
}

if(AutoUpdaterJSON.install) {
    UpdateCheck();
} else {
    Controller();
}