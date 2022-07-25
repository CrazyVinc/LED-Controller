var express = require("express");
var session = require("express-session");
let ejs = require("ejs");
var moment = require("moment");

var CronJob = require("cron");
var CronVerify = require("cron-validate");

const UUID = require("uuidv4");
const merge = require("deepmerge");

const Arduino = require("../ArduinoController");
const { models } = require("../Database");
const CronJobs = require("../CronJobs");
var config = require("../ConfigManager");
var { DeleteFromValue, overwriteMerge } = require('../utils');

var app = express.Router();

app.post("/config", async (req, res) => {
    var newConf = DeleteFromValue(req.body);
    var oldConf = config.config.getFileContent;
    newConf = merge(oldConf, newConf, {
        arrayMerge: overwriteMerge,
    });
    config.config.save(newConf, true);
    res.send({ status: 200, msg: "New Config uploaded", NewConfig: newConf });
});

module.exports = app;
