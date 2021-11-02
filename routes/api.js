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

app.post('/VerifyCron', function(req, res) {
    var Verify = CronVerify(req.body.CronTime, {
      preset: 'npm-node-cron',
    });
    console.log(Verify);
    res.send(Verify);
  });
  
  app.post('/SendLedCommand', function(req, res) {
    var Verify = CronVerify(req.body.CronTime, {
      preset: 'npm-node-cron',
    });
    console.log(Verify);
    res.send(Verify);
  });

  app.post('/blocktime/:ID', async (req, res) => {
    if(req.params.ID) {
        console.log(-484, req.body);
        const [results, fields] = await connection.promise().query(
            'INSERT INTO `ledcontroller`.`blockedruns` (`JobID`, `Time`) VALUES (?, ?);', [1, (req.body.extendedProps.Time).toString().slice(0, -1)]);
            res.send("a")
        console.log(req.body);
    } else {
        res.send("?");
    }
  });
  
  app.get('/GetDates', async(req, res) => {
    const [results, fields] = await connection.promise().query(
      'SELECT * FROM ledtimes');
      if(LED.type == "cron") {
         Cron.time(LED.CronTime).sendAt(10).forEach(Time => {
            console.log(Time);
         });
      };
      res.send(results);
  });
  
  
module.exports = app    ;