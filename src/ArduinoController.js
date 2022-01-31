require("console-stamp")(console, "[HH:MM:ss.l]");
var fs = require("fs");

const { ws } = require("./SocketIO");

const SerialPort = require("serialport");
const Readline = require("@serialport/parser-readline");
const Ready = require("@serialport/parser-ready");

const Queue = require("./Queue");
const { config } = require("./ConfigManager.js");
const { asyncForEach } = require("./utils");

const ArduinoPort = new SerialPort(config.get().SerialPort, {
  baudRate: 9600,
  parity: "none",
  autoOpen: true,
});

ArduinoPort.setDefaultEncoding("utf-8");

ArduinoPort.on("open", () => {
  TimeOut = setTimeout(() => {
    let LastDataJSON = fs.readFileSync("LastData.json");
    try {
      LastDataJSON = JSON.parse(LastDataJSON);
    } catch (e) {
      LastDataJSON = {}
    }
    Object.keys(LastDataJSON).forEach(function (key) {
      var LED = LastDataJSON[key];
      console.log(0, LED);
      ArduinoWrite(key + " " + LED, true);
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
  try {
    LastDataJSON = JSON.parse(LastDataJSON);
  } catch (e) {
    LastDataJSON = {}
  }
}

function LastData(data) {
  LED = data.split(" ", 1)[0];
  data = data.substr(LED.length + 1);
  if (data == "power on") {
    LastDataJSON[LED] = "power on";
  } else if (data == "power off") {
    LastDataJSON[LED] = "power off";
  } else if (data.startsWith("RGB")) {
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
  var tmp = 500;
  if (type == "RGB" || type == "Single") {
    tmp = 50;
  }

  Queue[type].add(() => {
    return new Promise(function (resolve, reject) {
      ws().emit("QueueCount", Queue[type].waitingCount);
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
          if (err) console.warn(err, 03);
          ws().emit("response", data);
          console.log("IR written:", data);
          resolve();
        });
      }, tmp);
    });
  });
}

async function Shortcuts(Shortcut) {
  Shortcut = Shortcut.toLowerCase();
  if (Shortcut == "lowest") {
    await ArduinoWrite("bed bright down");
    await ArduinoWrite("bed bright down");
    await ArduinoWrite("bed bright down");
    await ArduinoWrite("bed bright down");
    await ArduinoWrite("bed bright down");
    await ArduinoWrite("bed bright down");
    await ArduinoWrite("bed bright down");
    await ArduinoWrite("bed bright down");
  } else if (Shortcut == "brightest") {
    await ArduinoWrite("bed bright up");
    await ArduinoWrite("bed bright up");
    await ArduinoWrite("bed bright up");
    await ArduinoWrite("bed bright up");
    await ArduinoWrite("bed bright up");
    await ArduinoWrite("bed bright up");
    await ArduinoWrite("bed bright up");
    await ArduinoWrite("bed bright up");
  } else {
    console.log("No Shortcut found!");
  }
}

async function brightness(level) {
  var count;
  if (level <= 3) {
    count = 1;
    await Shortcuts("lowest");

    console.log("Level: ", level);
    while (count <= level) {
      count++;
      await ArduinoWrite("bed bright up");
    }
  } else {
    count = 5;
    await Shortcuts("brightest");
    console.log("Level: ", level);
    while (level <= count) {
      count = count - 1;
      await ArduinoWrite("bed bright down");
    }
  }
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
  brightness,
  Write: ArduinoWrite,
  WriteAdvanced: ArduinoWriteAdvanced,
  Shortcuts,
};
