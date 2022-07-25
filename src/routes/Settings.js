var path = require("path");
var fs = require("fs");

var hashFiles = require("hash-files");
var express = require("express");
var archiver = require("archiver");

let ejs = require("ejs");

var moment = require("moment");

var CronJob = require("cron");
const config = require("../ConfigManager");
const { LEDs }= require("../LEDManager");

var app = express.Router();

app.get("/", function (req, res) {
    res.render("settings/index");
});

app.get("/Arduino", function (req, res) {
    res.render("settings/Arduino");
});

module.exports = app;
