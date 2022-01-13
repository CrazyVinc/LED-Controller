const PromiseQueue = require("easy-promise-queue").default;

var { ws } = require("./SocketIO");
const { config } = require("./ConfigManager.js");

let Queue = {};
let IR = new PromiseQueue({ concurrency: 1 });
let RGB = new PromiseQueue({ concurrency: 1 });
let Single = new PromiseQueue({ concurrency: 1 });
let general = new PromiseQueue({ concurrency: 1 });

var LEDs = config.get("LEDs");
Object.keys(LEDs).forEach(function (type) {
    Queue[type] = {};
    LEDs[type].forEach((LED) => {
        Queue[type][LED] = new PromiseQueue({ concurrency: 1 });
    });
});

setTimeout(() => {
    ws().on("connection", (socket) => {
        socket.on("Queue", (msg) => {
            console.log(msg, 93);
            if (msg == "reset") {
                IR._queue = [];
                RGB._queue = [];
                Single._queue = [];
                Object.keys(Queue).forEach(function (type) {
                    LEDs[type].forEach((Name) => {
                        Queue[type][Name]._queue = [];
                    });
                });
            }
        });
    });
}, 0);

module.exports = {
    Queue,
    IR,
    RGB,
    Single,
    general,
};