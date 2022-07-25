/* Generate a Random String with a specifc length */
function RandomString(length = 13) {
    var result = "";
    var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }
    return result;
}


/* Delete keys with a specific Value */
function DeleteFromValue(obj, Value) {
    for (let k in obj) {
      if (typeof obj[k] === "object") {
        DeleteFromValue(obj[k], Value);
      } else {
        // base case, stop recurring
        if(obj[k] == Value) {
            delete obj[k];
        }
      }
    }
    try {
        return JSON.parse(obj);
    } catch (err) {
        return obj;
    }
}
/*
function DeleteSensitive(obj) {
    for (let k in obj) {
      if (typeof obj[k] === "object") {
        DeleteSensitive(obj[k]);
      } else {
        // base case, stop recurring
        if(obj[k] == "[Sensitive]") {
            delete obj[k];
        }
      }
    }
    try {
        return JSON.parse(obj);
    } catch (err) {
        return obj;
    }
}

*/
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}

async function promiseWhen(condition, timeout) {
    return new Promise(function (resolve, reject) {
        if (!timeout) {
            timeout = 5000;
        }
        var timeout = setTimeout(function () {
            reject();
        }, timeout);
        function loop() {
            if (condition()) {
                clearTimeout(timeout);
                resolve();
            }
            setTimeout(loop, 0);
        }
        setTimeout(loop, 0);
    });
}

function hexToRGB(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16) | 0;
    var g = parseInt(hex.slice(3, 5), 16) | 0;
    var b = parseInt(hex.slice(5, 7), 16) | 0;

    if (alpha) {
        return [r,g,b, alpha];
    } else {
        return [r,g,b];
    }
}
function componentFromStr(numStr, percent) {
    var num = Math.max(0, parseInt(numStr, 10));
    return percent ?
        Math.floor(255 * Math.min(100, num) / 100) : Math.min(255, num);
}

function rgbToHex(rgb) {
    var rgbRegex = /^\s*(-?\d+)(%?)\s*,\s*(-?\d+)(%?)\s*,\s*(-?\d+)(%?)\s*$/;
    var result, r, g, b, hex = "";
    if ( (result = rgbRegex.exec(rgb)) ) {
        r = componentFromStr(result[1], result[2]);
        g = componentFromStr(result[3], result[4]);
        b = componentFromStr(result[5], result[6]);

        hex = (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    return hex;
}


function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


async function MySQL2ToSequelize(result) {
    var MySQL2Obj = [];

    for (let i = 0; i < result.length; i++) {
        const row = result[i];
        MySQL2Obj.push(row.dataValues);
    }
    return MySQL2Obj;
}


const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray;


const RemoteCntrlColors = [
    "red",
    "green",
    "blue",
    "white",
    "scarlet",
    "Light Green",
    "periwinkle",
    "orange",
    "mint",
    "purple",
    "tangerine",
    "sky",
    "rose",
    "Yellow",
    "aqua",
    "pink",
];


module.exports = {
    asyncForEach,
    hexRgb: hexToRGB,
    promiseWhen,
    RandomString,
    // DeleteSensitive,
    RemoteCntrlColors,
    capitalizeFirstLetter,
    MySQL2ToSequelize,
    rgbToHex,
    overwriteMerge,
    DeleteFromValue,
};
