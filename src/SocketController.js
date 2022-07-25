var moment = require("moment");

var CronJob = require("cron");
var CronVerify = require("cron-validate");

const bcrypt = require("bcryptjs");
const UUID = require("uuidv4");

const Arduino = require("./ArduinoController");
const {models} = require("./Database");
const Queue = require("./Queue");
const { asyncForEach, RandomString } = require("../src/utils");

const { config, arduinoConfig } = require("./ConfigManager.js");
const Plugins = require("./plugins");

const { LEDs } = require("./LEDManager");
const { ws } = require("./SocketIO");
const { getCommand } = require("./ArduinoParser");

ws().on("connection", async (socket) => {
    console.log(1)
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

    asyncForEach(Object.keys(LEDs), async (key) => {
        if (key == "thirdparty") return;
        asyncForEach(LEDs[key], async (key2) => {
            key2 = key2?.Name || key2;
            if(Arduino.LastDataJSON[key2] === undefined) return;
            if(Array.isArray(Arduino.LastDataJSON[key2].options.options.color)) {
                Arduino.LastDataJSON[key2].options.options.color = Arduino.LastDataJSON[key2].options.options.color.join(',');
            }
            var LastData = Arduino.LastDataJSON[key2].options.options.color;

            if (LastData !== undefined) {
                if (key == "RGB") {
                    console.log(874, LastData);
                    // socket.emit(key+"."+key2, key2+" "+"0,0,0");
                    socket.emit("init.RGB." + key2, LastData);
                } else {
                    // socket.emit(key+"."+key2, key2+" "+LastData || "power off");
                    socket.emit("init." + key + "." + key2, "power off");
                }
            }
            socket.on("init", async (msg) => {
                try {
                    msg = JSON.parse(msg);
                } catch (error) {
                    msg = {};
                }

                var res = "init.";
                let Val;
                if (msg.type == undefined || msg.type == "*") {
                    res = res + key + ".";
                } else {
                    res = res + msg.type + ".";
                }
                if (msg.LED == undefined || msg.LED == "*") {
                    res = res + key2;
                } else {
                    res = res + msg.LED;
                }
                Val = msg.set || Arduino.LastDataJSON[key2].options.options.color.join(',');
                console.log(Val, key2);
                socket.emit(res, Val);
            });

            socket.on(key + "." + key2, async (msg) => {
                msg = JSON.parse(msg);
                if (msg.shortcut) {
                    if (msg.action.startsWith("Brightness")) {
                        await Arduino.brightness(
                            msg.action.split("|")[1],
                            msg.Name
                        );
                    }
                } else {
                    await Arduino.Write(msg.action, false, msg.LED, msg.Name);
                }
            });
        });
    });

    socket.on("WriteArduino", async (msg) => {
        msg = JSON.parse(msg);
        if (msg.shortcut !== undefined && msg.shortcut) {
            if (msg.action.startsWith("Brightness")) {
                await Arduino.brightness(msg.action.split("|")[1], msg.Name);
            }
        } else {
            // console.log(msg, 484);
            var action = getCommand(msg.command, msg.placeholders);

            await Arduino.Write(action, false, msg.LED, msg.Name, {
                command: msg.command,
                options: msg.placeholders,
            });
        }
    });

    socket.on("Queue", (msg) => {
        console.log(msg, 93);
        if (msg == "reset") {
            Queue.IRRGB._queue = [];
            Queue.RGB._queue = [];
            Queue.Single._queue = [];
            Object.keys(Queue.Queue).forEach(function (LedType) {
                asyncForEach(arduinoConfig.get()["LEDs"][LedType], async (LEDName) => {
                    Queue.Queue[LedType][LEDName]._queue = [];
                });
            });
        }
    });
    
    socket.on("users", async(msg, callback = (() => {return ""})) => {
        console.log(msg)
        if(msg == "new") return callback(RandomString(16));
        try {
            if(msg?.ID == undefined) {
                console.log(0)
                var salt = bcrypt.genSaltSync(12);
                var password = bcrypt.hashSync(msg.password, salt);
                await models.accounts_model.create({
                    email: msg.email,
                    username: msg.username,
                    token: RandomString(16),
                    password: password,
                    status: true,
                    meta: {}
                });
            } else if(msg?.remove) {
                var user = await models.accounts_model.findOne({ where: { id: msg.ID }});
                user = user.dataValues;

                var meta = JSON.parse(user.meta);
                console.log(63, meta?.admin);

                if(meta?.admin == (undefined || false)) return socket.to(socket.id).emit("response", `Cannot delete admin user ${user.username}`);
                console.log(3);
                await models.accounts_model.update({active: false}, {
                    where: {
                        id: msg.ID
                    }
                });
            } else {
                var data = {
                    email: msg.email,
                    username: msg.username,
                    token: RandomString(16),
                    status: true,
                    meta: {}
                }
                if(msg.password !== "null" && msg.password !== undefined) {
                    var salt = bcrypt.genSaltSync(12);
                    var password = bcrypt.hashSync(msg.password, salt);
                    data = {...data, password: password};
                }
                console.log(data);
                await models.accounts_model.update(data, {
                    where: {
                        id: msg.ID 
                    }
                });
            }
        } catch (err) {
            console.log(err);
        }
          
      });
});

