var express = require('express');
var session = require('express-session');
let ejs = require('ejs');
var bodyParser = require('body-parser');
var moment = require('moment');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const Ready = require('@serialport/parser-ready')

var CronJob = require('cron');
var CronVerify = require('cron-validate');

const UUID = require('uuidv4');

const Arduino = require("../src/ArduinoController");
const {connection} = require("../src/Database");
const CronJobs = require("../src/CronJobs");
const { verify, randomUUID } = require('crypto');

var config = require('../src/ConfigManager');

var app = express.Router();

app.get('/DateTime', function(req, res) {
    res.render('new/DateTime');
});

app.get('/range', function(req, res) {
    res.render('new/range');
});

app.get('/CronJob', function(req, res) {
    res.render('new/CronJob');
});

app.post('/event', async (req, res) => {
    console.log(-231, req.body);
    if(req.body.DayOfMonth.toString().includes(",")) {
        req.body.DayOfMonth = "["+req.body.DayOfMonth+"]";
    }
    if(req.body.DayOfWeek.toString().includes(",")) {
        req.body.DayOfWeek = "["+req.body.DayOfWeek+"]";
    }
    connection.execute(
        "INSERT INTO `ledcontroller`.`ledtimes` (`Name`, `CronTime`, `enabled`, `Color`, `TMPColor`, `Brightness`, `type`, `LedStrip`, `Arduino`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                req.body.Naam,
                req.body.Sec+" "+req.body.Min+" "+req.body.Hours+" "+req.body.DayOfMonth+" "+req.body.Months+" "+req.body.DayOfWeek,
                true,
                "white",
                "sky",
                6,
                req.body.RunType,
                "*",
                "rgb 255,255,255"
            ],
        function(err, results, fields) {
          console.log(results); // results contains rows returned by server
          console.log(fields); // fields contains extra meta data about results, if available
      
          // If you execute same statement again, it will be picked from a LRU cache
          // which will save query preparation time and give better performance
        }
      );
    res.send(req.body);
  });
  
module.exports = app;