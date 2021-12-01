var express = require('express');
var session = require('express-session');
let ejs = require('ejs');
var bodyParser = require('body-parser');
var moment = require('moment');
var expressWs = require('express-ws');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const Ready = require('@serialport/parser-ready')

var CronJob = require('cron');
var CronVerify = require('cron-validate');

const UUID = require('uuidv4');

const Arduino = require("../src/ArduinoController");
const {connection} = require("../src/Database");
const CronJobs = require("../src/CronJobs");

var config = require('../config');

var app = express.Router();

app.post('/VerifyCron', function(req, res) {
    var Verify = CronVerify(req.body.CronTime, {
      preset: 'npm-node-cron',
    });
    console.log(Verify);
    res.send(Verify);
  });

app.post('/SendLedCommand', async (req, res) => {
  console.log(req.body);
  if(req.body.shortcut) {
    if((req.body.shortcut).startsWith("Brightness")) {
      await Arduino.Brightness((req.body.shortcut).split('|')[1])
    }
  } else {
    await Arduino.Write(req.body.action);
  }
  res.send(req.body);
});

app.ws('/SendLedCommand', async (ws, req) => {
  ws.on('message', async (msg) => {
    if(msg == "__ping__") return;
    msg = JSON.parse(msg);
    console.log(msg, 383);
    if(msg.shortcut) {
      if((msg.shortcut).startsWith("Brightness")) {
        await Arduino.Brightness((msg.shortcut).split('|')[1])
      }
    } else {
      await Arduino.Write(msg.action);
    }
  });
});

  app.post('/blocktime/:ID', async (req, res) => {
    if(req.params.ID) {
        console.log(-484, req.body);
        const [results, fields] = await connection.promise().query(
            'INSERT INTO `ledcontroller`.`blockedruns` (`JobID`, `Time`) VALUES (?, ?);', [req.params.ID, (req.body.extendedProps.Time).toString().slice(0, -1)]);
            res.send("a")
        console.log(req.body);
    } else {
        res.send("?");
    }
  });

  app.post('/Unblocktime/:ID', async (req, res) => {
    if(req.params.ID) {
        console.log(-484, req.body);
        const [results, fields] = await connection.promise().query(
            'DELETE FROM `ledcontroller`.`blockedruns` WHERE ID=? AND JobID=?;', [req.body.extendedProps.BlockedID, req.params.ID]);
        res.send("a");
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

app.get('/GetFeed', async(req, res) => {
  const [BlockedRuns] = await connection.promise().query('SELECT * FROM blockedruns');
  const [LEDS, fields] = await connection.promise().query(
      'SELECT * FROM ledtimes WHERE `enabled`=\"true\"');

  var Response = [];
  LEDS.forEach(LED => {
    var i = 0;
    if(LED.type == "cron") {
      CronJob.time(LED.CronTime).sendAt(10).forEach(Time => { i++;
        var blockedState = {State: false, ID: -1};
        
        BlockedRuns.forEach(Blocked => {
          if(Blocked.Time == moment(Time).unix().toString().slice(0, -1)) {
            blockedState.State = true;
            blockedState.ID = Blocked.ID;
          }
        });
        var obj = {
          title: "CronID: "+LED.Name,
          start: Time,
          url: "/modal/Calendar/"+LED.ID,
          extendedProps: {
            ID: LED.ID,
            Time: moment(Time).unix(),
            Count: i,
            blocked: blockedState.State,
            BlockedID: blockedState.ID,
          }
        }
        if(blockedState.State) obj["backgroundColor"] = "red";
        Response.push(obj);
      });
    };
  });
  res.send(Response);
});

  
module.exports = app;