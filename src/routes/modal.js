var express = require('express');
var session = require('express-session');
let ejs = require('ejs');
var bodyParser = require('body-parser');
var moment = require('moment');

var CronJob = require('cron');
var CronVerify = require('cron-validate');

const UUID = require('uuidv4');

const Arduino = require("../ArduinoController");
const {connection} = require("../Database");
const {RemoteCntrlColors, capitalizeFirstLetter} = require("../utils");

var config = require('../ConfigManager');

var app = express.Router();

app.post('/Calendar/:ID', async(req, res) => {
    // console.log(req.body, req.params);
    if(req.params.ID) {
      const [results, fields] = await connection.promise().query(
        'SELECT * FROM ledtimes WHERE enabled=1');
        // console.log(results);
        res.render('modal/EditEvent', {"LEDS": results, Cron: CronJob, moment: moment, req: req});
    } else {
      // console.log("?");
      res.send("?");
    }
  });
  
  app.post('/NewEvent', async(req, res) => {
    // console.log(req.body);
    res.render('modal/NewEvent', {config: JSON.parse(config.config), capitalizeFirstLetter, Cron: CronJob, moment: moment, req: req, RemoteCntrlColors: RemoteCntrlColors});
  });
  
  
module.exports = app;