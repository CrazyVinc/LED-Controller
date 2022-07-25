var fs = require("fs");
const EventEmitter = require("events");

const { SerialPort } = require("serialport");

const { MockBinding } = require('@serialport/binding-mock')
const Readline = require("@serialport/parser-readline");
const Ready = require("@serialport/parser-ready");

var Avrgirl = require('avrgirl-arduino');

// const { createExtension } = require('@forrestjs/core');

const Queue = require("./Queue");
const { ws } = require("./SocketIO");
const { config, arduinoConfig } = require("./ConfigManager.js");
const { ArduinoJSON } = require("./ArduinoParser.js");
const { asyncForEach, promiseWhen } = require("./utils");

console.log(arduinoConfig.get().SerialPort);

let binding = {};
if(arduinoConfig.get().ExternClients) {
  MockBinding.createPort(arduinoConfig.get().SerialPort, { echo: true, record: true })
  binding = {binding: MockBinding};
}

const ArduinoPort = new SerialPort({
  ...binding,
  path: arduinoConfig.get().SerialPort,
  baudRate: 9600,
  parity: "none",
  autoOpen: true,
});
ArduinoPort.setDefaultEncoding("utf-8");


var LastArduinoRes;
ArduinoPort.on('readable', function () {
  Queue.QueueToggle.set(false);
  LastArduinoRes = Buffer.from(ArduinoPort.read()).toString();
  LastArduinoRes = LastArduinoRes.substring(0, LastArduinoRes.length-2);
  
  // createExtension.parallel('arduino/receiveData', LastArduinoRes);
  const IsVersionRegex = /Version:((([0-9])+(\.){0,1})+)/;
  var IsVersionData = LastArduinoRes.match(IsVersionRegex);
  if(IsVersionData) {
    if(IsVersionData[1] == ArduinoJSON.Firmware.Version) {
      
    }
  }
})

ArduinoPort.on("open", () => {
  TimeOut = setTimeout(() => {
    let LastDataJSON = fs.readFileSync("LastData.json");
    try {
      LastDataJSON = JSON.parse(LastDataJSON);
    } catch (e) {
      LastDataJSON = {}
    }
    
    Object.keys(LastDataJSON).forEach(function (Name) {
      if(LastDataJSON[Name]["Command"] === undefined) return;
      var Command = LastDataJSON[Name]["Command"];
      ArduinoWrite(Command, true);
    });
    // createExtension.parallel('arduino/open', {ArduinoWrite});
    if(config.get().Arduino.PrebuildFirmware) ArduinoWrite("version", true);
  }, 5000);
  console.log("yay the port is open!");
});

ArduinoPort.on("error", (e) => console.log("boo we had an error!", e));
ArduinoPort.on("close", (e) => {
  setTimeout(() => {
    ArduinoPort.open();
  }, 5000);
  console.log("Port Closed!", e);
});

let LastDataJSON;
if (!fs.existsSync("LastData.json")) {
  LastDataJSON = {};

  fs.writeFile("LastData.json", JSON.stringify(LastDataJSON), function (err) {
    if (err) throw err;
    console.log("Replaced!");
  });
} else {
  LastDataJSON = fs.readFileSync("LastData.json");
  try {
    LastDataJSON = JSON.parse(LastDataJSON);
  } catch (e) {
    LastDataJSON = {}
  }
}


function UpdateArduino() {
  var avrgirl = new Avrgirl({
    board: 'uno',
    port: config.get().SerialPort
  });

  avrgirl.flash('Blink.cpp.hex', function (error) {
    if (error) {
      console.error(error);
    } else {
      console.info('done.');
    }
  });
}

function LastData(data, Name, options = {}) {
  if(LastDataJSON[Name] === undefined) LastDataJSON[Name] = {};
  LastDataJSON[Name]["Command"] = data;
  LastDataJSON[Name]["options"] = options;
  fs.writeFile("LastData.json", JSON.stringify(LastDataJSON), function (err) {
    if (err) console.warn(err);
  });
}

function ArduinoWrite(data, init = true, type = "general", LedName = "global", options = {}, isCMD = false) {
  if (data === undefined) return;
  var tmp = 500;
  if (type == "RGB" || type == "Single") {
    tmp = 80;
  }

  Queue[type].add(() => {
    return new Promise(async (resolve, reject) => {
      if (!ArduinoPort.isOpen && !arduinoConfig.get().ExternClients) {
        tmp = 7500;
        ArduinoPort.open();
        console.log("Waiting 7,5 sec for reconnecting!");
        ws().emit("response", "Reconnecting!");
      }
      if(!Queue.QueueToggle.pause) {
        await promiseWhen(function(){
            return Queue.QueueToggle.pause == false;
          }).then(() => {
            Queue.QueueToggle.set(true);
          });
        }
        var queut = 0;
        
        queut = Queue["RGB"].waitingCount + Queue["Single"].waitingCount + Queue["IRRGB"].waitingCount;
        ws().emit("QueueCount", queut);
        ws().emit(type+"."+LedName+"Queue", Queue[type].waitingCount);
        setTimeout(() => {
          // createExtension.parallel('arduino/write', LastArduinoRes);
          ArduinoPort.write(data + "\n", (err) => {
            if (err) console.warn(err, 03);
            if (!init) {
              LastData(data, LedName, options);
              ws().emit(type+"."+LedName, options.options.color.join(','));
            }
            console.log("IR written:", data);
            ws().emit("response", data);
            ws().of('/child').emit('write', data);
            ws().of('/child/'+LedName).emit('write', data);
            resolve();
          });
        }, tmp);
    });
  });
}

async function ArduinoWriteAdvanced(cmd) {
  if (new RegExp("(d*)").test(cmd)) {
    if (!cmd.includes("\\n")) cmd = cmd + "\\n";
    asyncForEach(cmd.split("\\n"), async (row2) => {
      if (new RegExp("sleep(d*)").test(row2)) {
        setTimeout(() => { }, row2.match(/\d*/g).join(""));
      } else if (new RegExp("bright(d*)").test(row2)) {
        await brightness(row2.match(/\d*/g).join(""));
      } else {
        await ArduinoWrite(row2);
      }
    });
  } else {
    await ArduinoWrite(cmd);
  }
}

module.exports = {
  ArduinoPort,
  Write: ArduinoWrite,
  WriteAdvanced: ArduinoWriteAdvanced,
  LastDataJSON  
};