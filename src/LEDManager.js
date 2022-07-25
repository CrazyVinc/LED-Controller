// const { createExtension } = require('@forrestjs/core');

const {config, arduinoConfig} = require('./ConfigManager');
const {ArduinoJSON} = require('./ArduinoParser');

const LEDs = arduinoConfig.get("LEDs");
LEDs["thirdparty"] = [];

const newType = (type, path, Command, state = {}) => {
    if(LEDs[type] !== undefined) return;
    // if(ArduinoJSON["plugins"][] === undefined) ArduinoJSON[type] = {};
    ArduinoJSON["plugins"][type] = Command;
    LEDs[type] = [];
    LEDs["thirdparty"][type] = {path: path, state: state};
}

const addLED = (type, LEDObj) => {
    if(LEDs[type] === undefined) return;
    // if(ArduinoJSON["plugins"][] === undefined) ArduinoJSON[type] = {};
    LEDs[type].push(LEDObj);
}

// var t = 
// console.log(t);

// console.log(LEDs);
// console.log(ArduinoJSON);


// setTimeout(() => {
// 	config.set("NewControl", false);
// 	config.save();
// }, 5000)



module.exports = {
    LEDs,
    newType, addLED
}