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


async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

async function promiseWhen(condition, timeout) {
  return new Promise(function (resolve, reject) {
    if(!timeout){
      timeout = 5000;
    }
    var timeout = setTimeout(function(){
      reject();
    }, timeout);
    function loop(){
      if(condition()){
        clearTimeout(timeout);
        resolve();
      }
      setTimeout(loop,0);
    }
    setTimeout(loop,0);
  });
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

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
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

function makeRecursiveObj(objRef, arry, initValue){
  var obj = objRef, idx = 0;    
  while(idx < arry.length -1){
      if(!obj[arry[idx]]) obj[arry[idx]] = {};
      obj = obj[arry[idx]];
      idx++;
  }
  if(!obj[arry[idx]]) obj[arry[idx]] = initValue;
}

const RemoteCntrlColors = ["red", "green", "blue", "white", "scarlet", "Light Green", "periwinkle", "orange", "mint", "purple", "tangerine", "sky", "rose", "Yellow", "aqua", "pink"];
module.exports = {
    asyncForEach: asyncForEach,
    hexRgb: hexToRGB,
    promiseWhen,
    RandomString: RandomString(),
    RandomString2: RandomString,
    RemoteCntrlColors,
    capitalizeFirstLetter,
    MySQL2ToSequelize,
    rgbToHex,
    makeRecursiveObj,
    overwriteMerge,
    DeleteFromValue,
}