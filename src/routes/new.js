var express = require('express');
var session = require('express-session');
let ejs = require('ejs');
var moment = require('moment');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const Ready = require('@serialport/parser-ready')

var CronJob = require('cron');
var CronVerify = require('cron-validate');

const UUID = require('uuidv4');

const Arduino = require("../ArduinoController");
const { getCommand } = require('../ArduinoParser');

const { models } = require("../Database");
const CronJobs = require("../CronJobs");
const { verify, randomUUID } = require('crypto');

var config = require('../ConfigManager');

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
    
    data.RunOn = (data.Calendar || (data.Sec+" "+data.Min+" "+data.Hours+" "+data.DayOfMonth+" "+data.Months+" "+data.DayOfWeek));

    var ArduinoCMDs = [];
    // data.LEDs = data.LEDs.split(',');
    // console.log(data.LEDs)
    data.LEDs = data.LEDs.filter(led => led !== 'dummy');
    data.LEDNames = [];
    data.LEDs.forEach(LED => {
        LED = JSON.parse(LED);
        data.LEDNames.push(LED.name);

        var action = getCommand("LEDs."+LED.type, {
            pin: [ 11, 10, 9 ], color: [ LED.value ]
        });
        ArduinoCMDs.push({command: action, color: LED.value, type: LED.type});
    });
    // console.log(ArduinoCMDs, 5747, data);
    await models.ledtimes_model.create({
        Name: data.JobName,
        CronTime: data.RunOn,
        enabled: true,
        cmd: ArduinoCMDs,
        type: req.body.RunType.toString().toLowerCase(),
        LedStrip: data.LEDNames
    });
    setTimeout(() => {
        CronJobs.LED2Cron.fireOnTick();
    }, 500);
    res.send(req.body);
  });
  
module.exports = app;