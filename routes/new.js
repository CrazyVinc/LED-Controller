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
    var data = req.body;
    console.log(-231, req.body);
    if(data.RunType == "Cron") {
        if(data.Sec.includes('*')) data.Sec = '*';
        if(data.Min.includes('*')) data.Min = '*';
        if(data.Hours.includes('*')) data.Hours = '*';
        if(data.DayOfMonth.includes('*')) data.DayOfMonth = '*';
        if(data.Months.includes('*')) data.Months = '*';
        if(data.DayOfWeek.includes('*')) data.DayOfWeek = '*';
        if(data.DayOfMonth.toString().includes(",")) {
            data.DayOfMonth = "["+data.DayOfMonth+"]";
        }
        if(data.DayOfWeek.toString().includes(",")) {
            data.DayOfWeek = "["+data.DayOfWeek+"]";
        }
    }
    
    data.RunOn = data.Calendar || (data.Sec+" "+data.Min+" "+data.Hours+" "+data.DayOfMonth+" "+data.Months+" "+data.DayOfWeek)
    console.log(-3773, data);
    var ArduinoCMDs = [];
    data.Enable = data.Enable.split(',');
    data.Enable.forEach(Enabled => {
        ArduinoCMDs.push(Enabled + " "+data[Enabled+"Value"]);
    });
    // console.log(ArduinoCMDs);

    connection.execute(
        "INSERT INTO `ledcontroller`.`ledtimes` (`Name`, `CronTime`, `enabled`, `Color`, `TMPColor`, `Brightness`, `type`, `LedStrip`, `Arduino`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                req.body.Naam,
                data.RunOn,
                "true",
                null,
                "sky",
                6,
                req.body.RunType.toString().toLowerCase(),
                data.Enable.join(","),
                ArduinoCMDs.join("\\n")
            ],
        function(err, results, fields) {
            if(err) console.warn(err);
          console.log(results); // results contains rows returned by server
          console.log(fields); // fields contains extra meta data about results, if available
          setTimeout(() => {
            CronJobs.LED2Cron.fireOnTick();
          }, 500);
          // If you execute same statement again, it will be picked from a LRU cache
          // which will save query preparation time and give better performance
        }
      );
    res.send(req.body);
  });
  
module.exports = app;