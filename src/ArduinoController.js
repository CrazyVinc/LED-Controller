require('console-stamp')(console, '[HH:MM:ss.l]');
var fs = require('fs');
var {Buffer} = require('buffer');

const {ws} = require('./SocketIO');
var moment = require('moment');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const Ready = require('@serialport/parser-ready');

const { pq } = require("./Queue");
const {config} = require('./ConfigManager.js');


const ArduinoPort = new SerialPort(config.get().SerialPort, {
    baudRate : 9600,
    parity:   'none',
    autoOpen:  true,
});

// const parser = ArduinoPort.pipe(new Readline({ delimiter: '\n' }));
ArduinoPort.setDefaultEncoding('utf-8');
// parser.setMaxListeners(5);
// ArduinoPort.setMaxListeners(1);
// parser.on('readable', (e) => {
//     console.log("Data: ", parser.read().toString());
// })
ArduinoPort.on('open', () => console.log('yay the port is open!'))
ArduinoPort.on('error', (e) => console.log('boo we had an error!', e))
ArduinoPort.on('close', (e) => {
    setTimeout(() => {
        ArduinoPort.open();
    }, 5000);
    console.log('Port Closed!', e)
})

let LastDataJSON;
if(!fs.existsSync('LastData.json')) {
    LastDataJSON = {
        LED1: {
            cmd: ""
        },
        LED2: {
            cmd: ""
        }
    };

    fs.writeFile('LastData.json', JSON.stringify(LastDataJSON), function (err) {
        if (err) throw err;
        console.log('Replaced!');
    });
} else {
    LastDataJSON = fs.readFileSync('LastData.json');
    LastDataJSON = JSON.parse(LastDataJSON);
}

function LastData(data) {
    if(data == "power on") {
        LastDataJSON.LED1["cmd"] = "power on";
    } else if(data == "power off") {
        LastDataJSON.LED1["cmd"] = "power off";
    } else if((data+"").startsWith("rgb ")) {
        LastDataJSON.LED2["cmd"] = data;
    } else {
        return;
    }
    fs.writeFile('LastData.json', JSON.stringify(LastDataJSON), function (err) {
        if (err) console.warn(err);
      });
}

function ArduinoWrite(data, init) {
    if(data === undefined) return;
    if(init === undefined) init = false; // Old code support!
    var tmp = 75;
    pq.add(() => {
        return new Promise(function(resolve, reject) {
            ws().emit("QueueCount", pq.waitingCount);
            if(!ArduinoPort.isOpen) {
                tmp = 7500;
                // if(!ArduinoPort.isOpen) {
                ArduinoPort.open();
                // }
                console.log("Waiting 7,5 sec for reconnecting!");
                ws().emit("response", "Reconnecting!");
            }
            setTimeout(() => {
                if(!init){
                    LastData(data);
                }
                ArduinoPort.write(data, (err) => {
                    if(err) {
                        console.log(err, 03);
                    }
                    // var parsr = parser.once('readable', () => {
                    //     res=parser.read() || "Nothing!";
                    //     console.log('IR Response: ' + res);
                    //     // if(res.startsWith("Command Error: ")) {
                    //     //     fs.appendFile('errors.txt', "["+moment().toLocaleString() + "] " +res+'\n', function (err) {
                    //     //         if (err) throw err;
                    //     //         console.log('Error code saved!');
                    //     //     });
                    //     // }
                        ws().emit("response", data);
                        // clearTimeout(timeout);
                        resolve();
                    // });
                    console.log('IR written:', data);
                    // timeout = setTimeout(() => {
                        // ArduinoPort.close();
                        // parsr.emit('readable', "WARNING: Timed out!");
                    // }, 10000);
                    if(tmp !== 75) console.log("Resume!");
                });
            }, tmp);
        });
    });
}

async function Shortcuts(Shortcut) {
    Shortcut = Shortcut.toLowerCase();
    if(Shortcut == "lowest") {
        await ArduinoWrite("bright down");
        await ArduinoWrite("bright down");
        await ArduinoWrite("bright down");
        await ArduinoWrite("bright down");
        await ArduinoWrite("bright down");
        await ArduinoWrite("bright down");
        await ArduinoWrite("bright down");
        await ArduinoWrite("bright down");
    } else if(Shortcut == "brightest") {
        await ArduinoWrite("bright up");
        await ArduinoWrite("bright up");
        await ArduinoWrite("bright up");
        await ArduinoWrite("bright up");
        await ArduinoWrite("bright up");
        await ArduinoWrite("bright up");
        await ArduinoWrite("bright up");
        await ArduinoWrite("bright up");
    } else {
        console.log("No Shortcut found!");
    }
}
async function Brightness(level) {
    var count;
    if(level <= 3) {
        count = 1;
        await Shortcuts("lowest");
        
        console.log("Level: ", level)
        while (count <= level) {
            count++;
            await ArduinoWrite("bright up");
        }
    } else {
        count = 5;
        await Shortcuts("brightest");
        console.log("Level: ", level);
        while (level <= count) {
            count = count - 1;
            await ArduinoWrite("bright down");
        }
    }
}

module.exports = {
    ArduinoPort,
    // parser,
    Brightness,
    Write: ArduinoWrite,
    Shortcuts,
}
