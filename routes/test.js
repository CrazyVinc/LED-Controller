var express = require("express");
const gradient = require('gradient-color');

const Arduino = require("../src/ArduinoController");
const {config} = require("../src/ConfigManager");

var app = express.Router();

app.get("/1", async (req, res) => {
  if (req.query.stop !== undefined) {
    res.send("stop");
    return;
  }
  if (req.query.rgb !== undefined) {
    Arduino.Write("rgb " + req.query.rgb);
    res.send("rgb");
    return;
  }
  console.log(req.query.colors);
  const colors = gradient.default(
    req.query.colors.split(",") || "black,red,black,green,black,blue,black", req.query.count || 10
  );
  var search = /([0-9]+), ([0-9]+), ([0-9]+)/;

  colors.forEach((color) => {
    color = color.match(search);
    Arduino.Write("rgb " + color[0]);
  });
  res.send(colors);
});

app.get("/2", async (req, res) => {
  Object.keys(config.get("LEDs")).forEach(function (key) {
    config.get()["LEDs"][key].forEach(key2 => {
      for (let i = 0; i < 500; i++) {
        if(key == "RGB") {
          Arduino.Write(key2+" rgb 0,0,0", false, key, key2);
          Arduino.Write(key2+" rgb 25,25,25", false, key, key2);
        } else {
          Arduino.Write(key2+" power off", false, key, key2);
          Arduino.Write(key2+" power on", false, key, key2);
        }
      }
    });
});
  res.send("Test");
});

module.exports = app;
