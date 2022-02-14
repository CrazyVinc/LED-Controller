var moment = require("moment");

var CronJob = require("cron");
var CronVerify = require("cron-validate");

const UUID = require("uuidv4");

const Arduino = require("../src/ArduinoController");
const { connection } = require("../src/Database");
const CronJobs = require("../src/CronJobs");
const Queue = require("../src/Queue");
const {asyncForEach} = require("../src/utils");

const { config } = require("./ConfigManager.js");

const { ws } = require("../src/SocketIO");

ws().on('connection', async (socket) => {
    socket.on("action", async (msg) => {
        if (msg == "__ping__") return;
        msg = JSON.parse(msg);
        if (msg.shortcut) {
            if (msg.shortcut.startsWith("Brightness")) {
                await Arduino.brightness(msg.shortcut.split("|")[1]);
            }
        } else {
            await Arduino.Write(msg.action, false, msg.LED);
        }
    });

    asyncForEach(Object.keys(config.get()["LEDs"]), async (key) => {
        asyncForEach(config.get()["LEDs"][key], async (key2) => {
            if(key == "RGB") {
                socket.emit("init.RGB."+key2, Arduino.LastDataJSON[key2].substr(4) || null);
            } else {
                socket.emit("init."+key+"."+key2, Arduino.LastDataJSON[key2] || null);
            }
            socket.emit(key+"."+key2, key2+" "+Arduino.LastDataJSON[key2] || null);
            socket.on("init", async (msg) => {
                // socket.emit('init', JSON.stringify({type: '*', LED: '*', set: {%- Name %>: "0,0,0"}}))
                msg = JSON.parse(msg);
                var res = "init.";
                let Val;
                if (msg.type == "*" || msg.type == undefined) {
                    res = res+key+".";
                } else {
                    res = res+msg.type+".";
                }
                if(msg.LED == "*" || msg.LED == undefined) {
                    res = res+key2;
                } else {
                    res = res+msg.LED;
                }
                Val = msg.set || Arduino.LastDataJSON[key2].substr(4);
                socket.emit(res, Val);
            });

            socket.on(key+"."+key2, async (msg) => {
                msg = JSON.parse(msg);
                if (msg.shortcut) {
                    if (msg.action.startsWith("Brightness")) {
                        await Arduino.brightness(msg.action.split("|")[1], msg.Name);
                    }
                } else {
                    await Arduino.Write(msg.Name +" "+ msg.action, false, msg.LED, msg.Name);
                }
            });
        });
    });
    socket.on("Queue", (msg) => {
        console.log(msg, 93);
        if (msg == "reset") {
            Queue.IRRGB._queue = [];
            Queue.RGB._queue = [];
            Queue.Single._queue = [];
            Object.keys(Queue.Queue).forEach(function (LedType) {
                asyncForEach(config.get()["LEDs"][LedType], async (LEDName) => {
                    Queue.Queue[LedType][LEDName]._queue = [];
                });
            });
        }
    });
});
