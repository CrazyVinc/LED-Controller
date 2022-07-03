const { spawn, fork } = require("child_process");
const fs = require('fs');

const LauncherVersion = 1.0;

var child = {};
const Args = process.argv.slice(2);



if(!fs.existsSync("./installer.json") || Args[0] == "setup") {
    RunInstaller();
} else {
    checkInstalled();
}


function checkInstalled() {
    child["isInstalled"] = spawn('npm', ['ls', '--json']);
    
    child["isInstalled"].on('close', (code) => {
        if(code === 0) {
            Controller();
        } else {
            console.log(`npm has not found al required modules. Starting installer`);
            RunInstaller();
        }
    });
}

function runExtractor(path, arg = []) {
    child["extractor"] = spawn(path, arg);
    child["extractor"].stdout.on('data', (data) => {
      console.log(`Extractor: ${data}`);
    });
    
    child["extractor"].stderr.on('data', (data) => {
        console.error(`Extractor: ${data}`);
    });
    
    child["extractor"].on('close', (code) => {
      console.log(`Auto Updater exited with code ${code}`);
      Controller();
    });
}


function Controller() {
    var killed = false;
    child["controller"] = fork("./index.js", Args);
    child["controller"].send({version: LauncherVersion});

    child["controller"].on("message", function (msg) {
        msg = JSON.parse(msg) || {msg: msg};
        if(msg.msg == "execute extractor!" && msg.exec && msg.args) {
            runExtractor(msg.exec, msg.args);
            killed = true;
            child["controller"].kill();
        } else {
            console.log(`LED Controller: ${msg}`);
        }
    });
    
    child["controller"].on("close", function (code) {
        console.log("LED Controller exited with code " + code);
        if(!killed) Controller();
    });
}

function RunInstaller() {
    var extractorstarted = false;
    child["setup"] = fork("./src/setup.js", Args);
    child["setup"].on("message", function (msg) {
        msg = JSON.parse(msg) || {msg: msg};
        if(msg.msg == "execute extractor!" && msg.exec && msg.args) {
            extractorstarted = true;
            console.log("Extractor started!");
            runExtractor(msg.exec, msg.args);
            child["setup"].kill();
        } else {
            console.log(`Installer: ${msg}`);
        }
    });

    child["setup"].on("close", function (code) {
        // if(extractorstarted) Controller();
        console.log("Installer with code " + code);
    });
}