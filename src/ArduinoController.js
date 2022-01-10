require("console-stamp")(console, "[HH:MM:ss.l]");
var fs = require("fs");

const { ws } = require("./SocketIO");

const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");
const Ready = require("@serialport/parser-ready");

const Queue = require("./Queue");
const { config } = require("./ConfigManager.js");

const ArduinoPort = new SerialPort(config.get().SerialPort, {
  baudRate: 9600,
  parity: "none",
  autoOpen: true,
});

ArduinoPort.setDefaultEncoding("utf-8");

ArduinoPort.on("open", () => {
  TimeOut = setTimeout(() => {
    let LastDataJSON = fs.readFileSync("LastData.json");
    LastDataJSON = JSON.parse(LastDataJSON);
    Object.keys(LastDataJSON).forEach(function(key) {
      var LED = LastDataJSON[key];
      console.log(0, LED);
      ArduinoWrite(key+' '+LED, true);
    });
  }, 2500);
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
  LastDataJSON = JSON.parse(LastDataJSON);
}

function LastData(data) {
    LED = data.split(" ", 1)[0];
    data = data.substr(LED.length+1);
    if (data == "power on") {
        LastDataJSON[LED] = "power on";
        console.log(1);
    } else if (data == "power off") {
        LastDataJSON[LED] = "power off";
        console.log(2);
    } else if(data.startsWith("RGB")) {
        console.log(3);
        LastDataJSON[LED] = data;
    } else {
        return;
    }
    fs.writeFile("LastData.json", JSON.stringify(LastDataJSON), function (err) {
        if (err) console.warn(err);
    });
}

function ArduinoWrite(data, init, type) {
  if (data === undefined) return;
  if (init === undefined) init = false; // Old code support!
  if (type === undefined) type = "general"; // Old code support!
  var tmp = 75;
  Queue[type].add(() => {
    return new Promise(function (resolve, reject) {
      ws().emit("QueueCount", Queue[type].waitingCount);
      console.log(type);
      if (!ArduinoPort.isOpen) {
        tmp = 7500;
        ArduinoPort.open();
        console.log("Waiting 7,5 sec for reconnecting!");
        ws().emit("response", "Reconnecting!");
      }
      setTimeout(() => {
        if (init == false) {
            LastData(data);
        }
        ArduinoPort.write(data, (err) => {
          if (err) {
            console.log(err, 03);
          }
          ws().emit("response", data);
          resolve();
          console.log("IR written:", data);
          if (tmp !== 75) console.log("Resume!");
        });
      }, tmp);
    });
  });
}

async function Shortcuts(Shortcut) {
  Shortcut = Shortcut.toLowerCase();
  if (Shortcut == "lowest") {
    await ArduinoWrite("bright down");
    await ArduinoWrite("bright down");
    await ArduinoWrite("bright down");
    await ArduinoWrite("bright down");
    await ArduinoWrite("bright down");
    await ArduinoWrite("bright down");
    await ArduinoWrite("bright down");
    await ArduinoWrite("bright down");
  } else if (Shortcut == "brightest") {
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
  if (level <= 3) {
    count = 1;
    await Shortcuts("lowest");

    console.log("Level: ", level);
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
  Brightness,
  Write: ArduinoWrite,
  Shortcuts,
};
