const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const Ready = require('@serialport/parser-ready')


const ArduinoPort = new SerialPort('COM3', {
    baudRate : 9600,
    autoOpen: true
});


const parser = ArduinoPort.pipe(new Readline({ delimiter: '\n' }))
parser.setMaxListeners(5);
// // ArduinoPort.pipe(parser);

// parser.on('ready', () => console.log('the ready byte sequence has been received'))
// parser.on('data', console.log);
ArduinoPort.on('open', () => console.log('yay the port is open!'))
ArduinoPort.on('error', () => console.log('boo we had an error!'))


function ArduinoWrite(data) {
    return new Promise(function(resolve, reject) { 
        ArduinoPort.write(data, function () {
            console.log('message written: ' + data);
            parser.once('data', (data) => {
                console.log('Response: ' + data);
                resolve(data);
            });
        });
    });
}

async function Shortcuts(Shortcut) {
    Shortcut = Shortcut.toLowerCase();
    if(Shortcut == "lowest") {
        await ArduinoWrite("bright down\n");
        await ArduinoWrite("bright down\n");
        await ArduinoWrite("bright down\n");
        await ArduinoWrite("bright down\n");
        await ArduinoWrite("bright down\n");
        await ArduinoWrite("bright down\n");
    } else {
        console.log("No Shortcut found!");
    }
}

module.exports = {
    ArduinoPort,
    parser,
    Write: ArduinoWrite,
    Shortcuts,
}