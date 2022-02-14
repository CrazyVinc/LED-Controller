var express = require("express");
var session = require("express-session");
let ejs = require("ejs");
var bodyParser = require("body-parser");
var moment = require("moment");

var CronJob = require("cron");
var CronVerify = require("cron-validate");

const UUID = require("uuidv4");

const Arduino = require("../src/ArduinoController");
const { connection } = require("../src/Database");
const CronJobs = require("../src/CronJobs");
var models = require("../models");

var config = require("../src/ConfigManager");
const { MySQL2ToSequelize } = require("../src/utils");

const { sendMessage, ws } = require("../src/SocketIO");

var app = express.Router();

app.post("/VerifyCron", function (req, res) {
    var Verify = CronVerify(req.body.CronTime, {
        preset: "npm-node-cron",
    });
    console.log(Verify);
    res.send(Verify);
});

app.post("/blocktime/:ID", async (req, res) => {
    if (req.params.ID) {
        // console.log(-484, req.body, req.params);

        const results = await models.blockedruns.create({
            JobID: req.params.ID,
            Time: req.body.extendedProps.Time.toString().slice(0, -1),
        });
        // if(results.warningCount > 0) console.warn("api.js | /Blocktime/:ID", results);
        // console.log(results)
        res.send(
            "Event " +
                req.body.title +
                "(" +
                req.params.ID +
                ") is now blocked."
        );
    } else {
        res.send("?");
    }
});

app.post("/blocktime/:ID", async (req, res) => {
    if (req.params.ID) {
        // console.log(-484, req.body, req.params);

        const results = await models.blockedruns.create({
            JobID: req.params.ID,
            Time: req.body.extendedProps.Time.toString().slice(0, -1),
        });
        // if(results.warningCount > 0) console.warn("api.js | /Blocktime/:ID", results);
        // console.log(results)
        res.send(
            "Event " +
                req.body.title +
                "(" +
                req.params.ID +
                ") is now blocked."
        );
    } else {
        res.send("?");
    }
});

app.post("/Unblocktime/:ID", async (req, res) => {
    if (req.params.ID) {
        const [results, fields] = await connection
            .promise()
            .query(
                "DELETE FROM `ledcontroller`.`blockedruns` WHERE id=? AND JobID=?;",
                [req.body.extendedProps.BlockedID, req.params.ID]
            );
        res.send(
            "Event " +
                req.body.title +
                "(" +
                req.params.ID +
                ") is now unblocked."
        );
    } else {
        res.send("?");
    }
});

app.post("/delete/:ID", async (req, res) => {
    if(req.params.ID) {
        const [results, fields] = await connection
            .promise()
            .query(
                "DELETE FROM `ledcontroller`.`ledtimes` WHERE id=?;",
                [req.params.ID]
            );
        res.send(
            "Event " +
                req.body.title +
                "(" +
                req.params.ID +
                ") is now deleted."
        );
    } else {
        res.send("?");
    }
});

app.get("/GetDates", async (req, res) => {
    const [results, fields] = await connection
        .promise()
        .query("SELECT * FROM ledtimes");
    res.send(results);
});

app.get("/GetFeed/disabled", async (req, res) => {
    const LedTimes = await MySQL2ToSequelize(
        await models.ledtimes_model.findAll({
            attributes: ["ID", "Name", "CronTime", "type", "LedStrip"],
            where: {
                enabled: false,
            },
        })
    );
    res.send(LedTimes);
});

app.get("/GetFeed", async (req, res) => {
    const blocked = await models.blockedruns.findAll();
    var BlockedRuns = [];

    for (let i = 0; i < blocked.length; i++) {
        const row = blocked[i];
        BlockedRuns.push(row.dataValues);
    }
    const LedTimes = await models.ledtimes_model.findAll({
        where: {
            enabled: true,
        },
    });
    var LEDS = [];

    for (let i = 0; i < LedTimes.length; i++) {
        const row = LedTimes[i];
        LEDS.push(row.dataValues);
    }

    var Response = [];
    LEDS.forEach((LED) => {
        var i = 0;
        if (LED.type == "cron") {
            CronJob.time(LED.CronTime)
                .sendAt(5)
                .forEach((Time) => {
                    i++;
                    var blockedState = { State: false, ID: -1 };

                    BlockedRuns.forEach((Blocked) => {
                        if (
                            Blocked.Time ==
                            moment(Time).unix().toString().slice(0, -1)
                        ) {
                            blockedState.State = true;
                            blockedState.ID = Blocked.id;
                        }
                    });
                    var obj = {
                        title: LED.Name,
                        start: Time,
                        url: "/modal/Calendar/" + LED.ID,
                        extendedProps: {
                            ID: LED.ID,
                            Time: moment(Time).unix(),
                            enable: LED.enabled,
                            Count: i,
                            blocked: blockedState.State,
                            BlockedID: blockedState.ID,
                        },
                    };
                    if (blockedState.State) obj["backgroundColor"] = "red";
                    Response.push(obj);
                });
        }
    });
    res.send(Response);
});

module.exports = app;
