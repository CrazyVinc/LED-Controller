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

app.get("/reload", function (req, res) {
    config.config.reload();
    res.send(
        "Config is now reloaded! Going back in 3 seconds...<script>setTimeout(() => { if ('referrer' in document) { window.location = document.referrer; } else { window.history.back(); } }, 3000);</script>"
    );
});

app.get("/home", async (req, res) => {
    res.render("control", { LEDs: LEDs, Array});
});

app.get("/Calendar", async (req, res) => {
    res.render("Calendar", { Cron: CronJob, moment: moment });
});

app.get("/control", function (req, res) {
    res.render("control");
});

module.exports = app;
