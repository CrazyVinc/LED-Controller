require('console-stamp')(console, '[HH:MM:ss.l]');
var fs = require('fs');
// var expressWs = require('express-ws');

// var api = require('../routes/api');
var moment = require('moment');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const Ready = require('@serialport/parser-ready');
const PromiseQueue = require("easy-promise-queue").default;
let pq = new PromiseQueue({concurrency: 1});


const ArduinoPort = new SerialPort('COM4', {
    baudRate : 9600,
    autoOpen: true,
});

const parser = ArduinoPort.pipe(new Readline({ delimiter: '\n' }))
parser.setMaxListeners(5);
// // ArduinoPort.pipe(parser);

// parser.on('ready', () => console.log('the ready byte sequence has been received'))
// parser.on('data', console.log);
ArduinoPort.on('open', () => console.log('yay the port is open!'))
ArduinoPort.on('error', () => console.log('boo we had an error!'))
ArduinoPort.on('close', () => console.log('boo we had an close!'))

function ArduinoWrite(data) {
    var tmp = 0;
    pq.add(() => {
        return new Promise(function(resolve, reject) {
            if(!ArduinoPort.isOpen) {
                tmp = 2500;
                ArduinoPort.open();
                console.log("Waiting 2 sec for reconnecting!");
            }
            setTimeout(() => {
                ArduinoPort.write(data, function() {
                    console.log('IR written: ' + data);
                    parser.once('data', (data) => {
                        // console.log(global.expressWs.getWss().clients);
                        console.log('IR Response: ' + data);
                        if(data.startsWith("Command Error: ")) {
                            fs.appendFile('errors.txt', "["+moment().toLocaleString() + "] " +data+'\n', function (err) {
                                if (err) throw err;
                                console.log('Error code saved!');
                            });
                        }
                        resolve(data);
                    });
                    setTimeout(() => {
                        resolve("5 second Timed out!")
                    }, 5000)
                });
                if(tmp !== 0) console.log("Resume!");
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
        
        console.log(level, 5748)
        while (count <= level) {
            count++;
            await ArduinoWrite("bright up");
            console.log(count);
        }
    } else {
        count = 5;
        await Shortcuts("brightest");
        console.log("Level: ", level);
        while (level <= count) {
            count = count - 1;
            await ArduinoWrite("bright down");
            console.log("Count: ", count);
        }
    }
}

module.exports = {
    ArduinoPort,
    parser,
    Brightness,
    Write: ArduinoWrite,
    Shortcuts,
}