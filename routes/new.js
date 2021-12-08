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

var config = require('../config');

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

  
module.exports = app;