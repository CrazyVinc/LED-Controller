require('console-stamp')(console, '[HH:MM:ss.l]');

function RandomString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

function hexToRGB(hex, alpha) {
  var r = parseInt(hex.slice(1, 3), 16) | 0;
  var g = parseInt(hex.slice(3, 5), 16) | 0;
  var b = parseInt(hex.slice(5, 7), 16) | 0;

  if (alpha) {
      return "rgba(" + r + ", " + g + ", " + b + ", " + alpha + ")";
  } else {
      return "rgb(" + r + ", " + g + ", " + b + ")";
  }
}
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const RemoteCntrlColors = ["red", "green", "blue", "white", "scarlet", "Light Green", "periwinkle", "orange", "mint", "purple", "tangerine", "sky", "rose", "Yellow", "aqua", "pink"];
module.exports = {
    asyncForEach: asyncForEach,
    hexRgb: hexToRGB,
    RandomString: RandomString(),
    RandomString2: RandomString,
    RemoteCntrlColors,
    capitalizeFirstLetter,
}