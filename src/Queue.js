const PromiseQueue = require("easy-promise-queue").default;

var { ws } = require("./SocketIO");
const { config, arduinoConfig } = require("./ConfigManager.js");

let Queue = {};
let IRRGB = new PromiseQueue({ concurrency: 1 });
let RGB = new PromiseQueue({ concurrency: 1 });
let Single = new PromiseQueue({ concurrency: 1 });
let general = new PromiseQueue({ concurrency: 1 });

var LEDs = arduinoConfig.get("LEDs");
Object.keys(LEDs).forEach(function (type) {
    Queue[type] = {};
    LEDs[type].forEach((LED) => {
        Queue[type][LED] = new PromiseQueue({ concurrency: 1 });
    });
});

const QueueToggle = {
	pause: false,
	set(state) {
        if(state) {
            Object.keys(LEDs).forEach(function (type) {
                LEDs[type].forEach((LED) => {
                    Queue[type][LED].pause();
                });
            });
        } else {
            Object.keys(LEDs).forEach(function (type) {
                LEDs[type].forEach((LED) => {
                    Queue[type][LED].resume();
                });
            });
        }
        this.pause = state;
	},
};

module.exports = {
    Queue,
    IR: IRRGB,
    QueueToggle: QueueToggle,
    IRRGB,
    RGB,
    Single,
    general,
};