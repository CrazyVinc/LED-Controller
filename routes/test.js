var express = require("express");
const gradient = require('gradient-color');

const Arduino = require("../src/ArduinoController");

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
    req.query.colors.split(","),
    req.query.count || 10
  );
  var search = /([0-9]+), ([0-9]+), ([0-9]+)/;

  colors.forEach((color) => {
    color = color.match(search);
    Arduino.Write("rgb " + color[0]);
  });
  res.send(colors);
});

app.get("/2", async (req, res) => {
  for (let i = 0; i < 500; i++) {
    Arduino.Write("power on");
    Arduino.Write("power off");
  }
  res.send("");
});

module.exports = app;
