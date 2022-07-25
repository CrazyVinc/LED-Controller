var path = require("path");
var fs = require("fs");

var hashFiles = require("hash-files");
var express = require("express");
var archiver = require("archiver");

let ejs = require("ejs");

var moment = require("moment");

var CronJob = require("cron");
const config = require("../ConfigManager");
const {models} = require("../Database");

var app = express.Router();

// app.get("/", function (req, res) {
//     res.render("settings/index");
// });

app.get("/", async (req, res) => {
    const users = await models.accounts_model.findAll({
        where: {
            active: true
        }
    })
    res.render("dashboard/index", {
        users: users
    });
});

module.exports = app;
