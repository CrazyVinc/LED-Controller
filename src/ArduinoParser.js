const fs = require('fs');
var path = require('path');

var ArduinoJSON = JSON.parse(fs.readFileSync('./Settings/Firmware/Arduino.json'));
ArduinoJSON["plugins"] = {};
var GetOptionREGEX =/\$\{([A-Z]?[a-z]*)/g
var GetPlaceholderREGEX =/(\$\{[A-z]*)(\[\d\])?\}/g
var IsArrayREGEX =/(\[\d\])/g

function index(obj,i) {return obj[i]}

/* Generate the commands for the Firmware */
function getCommand(command, options) {
    console.log(command, 47378, options, 487)
    var command = command.split('.').reduce(index, ArduinoJSON.commands);

    var ValidOptions = command.match(GetPlaceholderREGEX);
    var hasColor = false;

    ValidOptions.forEach(opt => {
        var option = opt.match(GetOptionREGEX)[0].substring(2);
        IsArray = opt.match(IsArrayREGEX);
        
        if(!hasColor && option == "color") hasColor = true;
        
        if(IsArray !== null) {
            IsArray = IsArray[0].substring(1, IsArray[0].length-1);
            command = command.replace(opt, options[option][IsArray])
        } else {
            command = command.replace(opt, options[option])
        }
    });
    if(hasColor) {
        return command;
    } else {
        // console.warn("There is no color variable inside the arduino config! ")
        return command;
    }
}

// /* Get the options that are in a command */
// function getOptionsfromCommand(command, generatedCommand) {
//     var command = command.split('.').reduce(index, ArduinoJSON.commands);
//     var ValidOptions = command.match(GetPlaceholderREGEX);
//     var test = [];

//     console.log(command, 458, generatedCommand, 478)
//     ValidOptions.forEach(opt => {
//         var option = opt.match(GetOptionREGEX)[0].substring(2);
//         IsArray = opt.match(IsArrayREGEX);
//         console.log(opt, 48349);

//         if(IsArray !== null) {
//             IsArray = IsArray[0].substring(1, IsArray[0].length-1);
//             test.push(opt);
//             // command = command.replace(opt, options[option][IsArray])
//         } else {
//             // command = command.replace(opt, options[option])
//             test.push(opt);
//         }
//     });
//     return test;
// }

// // console.log(
//     getOptionsfromCommand("LEDs.RGB", "set rgb 11,10,9|0,0,0")
// // , 45838);
module.exports = {
    getCommand,
    ArduinoJSON
}