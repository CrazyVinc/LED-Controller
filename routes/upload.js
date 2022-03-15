var express = require('express');
var session = require('express-session');
let ejs = require('ejs');
var bodyParser = require('body-parser');
var moment = require('moment');

var CronJob = require('cron');
var CronVerify = require('cron-validate');

const UUID = require('uuidv4');

const merge = require('deepmerge')

const Arduino = require("../src/ArduinoController");
const { models } = require("../src/Database");
const CronJobs = require("../src/CronJobs");
var config = require('../src/ConfigManager');

var app = express.Router();

function DeleteSensitive(obj) {
    for (let k in obj) {
      if (typeof obj[k] === "object") {
        DeleteSensitive(obj[k]);
      } else {
        // base case, stop recurring
        if(obj[k] == "[Sensitive]") {
            delete obj[k];
        }
      }
    }
    return obj;
}

app.use(bodyParser.urlencoded({ extended: true }));

const overwriteMerge = (destinationArray, sourceArray, options) => sourceArray

app.post('/config', async (req, res) => {
    var newConf = DeleteSensitive(req.body);
    var oldConf = JSON.parse(config.config.getFileContent);
    newConf = merge(oldConf, newConf, {
      arrayMerge: overwriteMerge
    });
    config.config.save(newConf);
    res.send({status: 200, msg: "New Config uploaded", NewConfig: newConf});
});
  
module.exports = app;