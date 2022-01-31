var path = require('path');

require('console-stamp')(console, '[HH:MM:ss.l]');

var mysql = require('mysql2');
var CronJob = require('cron');
var moment = require('moment');
var moment = require('moment-strftime');
const axios = require('axios');
const merge = require('deepmerge')

const {connection, models} = require("./Database");
const ConfigControl  = require("./ConfigManager.js");
const Arduino = require("./ArduinoController");
const AutoUpdater = require("./AutoUpdater");

const { randomUUID, randomInt } = require('crypto');
const { asyncForEach }  = require("./utils");


var TMP = {
    "init": false,
}
var LEDWakeUpEvent;
var LedTMP = {};

var AutoUpdaterCron = new CronJob.CronJob('0 0 */3 * * *', async () => {
    console.log("Looking for updates..");
    AutoUpdater.update();
}, null, true, null, null, false);

var LED = new CronJob.CronJob('0 0 0 * * *', async () => {
    console.log('Waking Up...');
    LEDWakeUpEvent = new Date();
    const [results, fields] = await connection.promise().query(
        'SELECT * FROM blockedruns WHERE Time=? limit 1', [moment().unix().toString().slice(0, -1)]);
    if(results.length > 0) {
        console.log("LED Job is blocked, Deleting MySQL Row...");
        await connection.promise().query('DELETE FROM `blockedruns` WHERE `ID`=?;', [results[0].ID]);
        
        LEDWakeUpEvent = new Date() - LEDWakeUpEvent;
        console.log('LED Job quit forced: %dms', LEDWakeUpEvent);
        return;
    }

    await Arduino.Write("bed power on");
    if(LedTMP.WakeUP.TMPColor !== null) {
        console.log(384);
        await Arduino.Write("bed color "+LedTMP.WakeUP.TMPColor);
    }
    await Arduino.Brightness(LedTMP.WakeUP.Brightness);
    await Arduino.Write("bed color "+LedTMP.WakeUP.Color);
    LEDWakeUpEvent = new Date() - LEDWakeUpEvent;
    console.log('LEDs completed: ' + LEDWakeUpEvent + 'ms');
}, null, false);
var LEDJobTracking = {};
var Events = {};
var Events2 = {};
var JobsInit = {};

var EventReload = new CronJob.CronJob('0 */5 * * * *', async () => {
    ConfigControl.config.reload();
    var options = ConfigControl.config.get();
    asyncForEach(Object.entries(options.Events), async (Event) => {
        if(!([Event[0]] in JobsInit)) {
            JobsInit[Event[0]] = {"init": false};
        }
        if(Event[1].enabled) {
            if(Events[Event[0]] === undefined) {
                TMP = merge(TMP, {
                    "RunTimeCalc": {
                        [Event[0]]: {
                            "RunTime": new Date(),
                        }
                    },
                });

                Events2[Event[0]] = new CronJob.CronJob('0 0 0 1 1 1', async () => {
                    console.log(`Recheck Event for ${Event[0]}...`);
                    TMP["RunTimeCalc"][Event[0]]["RunTime"] = new Date();
                    if(Event[1].criteria.type == "Web API") {
                        var response = await axios.get(Event[1].criteria.API.URL);
                        var time = moment.utc(response.data.results.sunset).local();

                        if(moment(time).isAfter(moment())) {
                            Events[Event[0]].setTime(new CronJob.CronTime(moment(time)));
                            console.log("Coming", moment(time).format("dddd, MMMM Do YYYY, HH:mm:ss"));
                        } else {
                            console.log("Past", moment(time).format("dddd, MMMM Do YYYY, HH:mm:ss"));
                        }
                    }
                    TMP["RunTimeCalc"][Event[0]]["RunTime"] = new Date() - TMP["RunTimeCalc"][Event[0]]["RunTime"];
                    console.log('Recheck Event completed: %dms', TMP["RunTimeCalc"][Event[0]]["RunTime"]);
                    Events[Event[0]].start();
                }, null, true, null, null, true);


                Events[Event[0]] = new CronJob.CronJob('0 0 18 1 1 1', async () => {
                    console.log(`Running Event for ${Event[0]}...`);
                    LEDWakeUpEvent = new Date();
                    if(Event[1].criteria.type == "Web API") {
                        var Recheck = moment().add({
                            [(Event[1].criteria.Recheck.type)]: (Event[1].criteria.Recheck.count)
                        });
                        
                        Events2[Event[0]].setTime(new CronJob.CronTime(Recheck));
                        if(JobsInit[Event[0]].init) {
                            console.log("SunSet", -472);
                            await Arduino.Write("bed power on");
                            await Arduino.Write("pc rgb 175");
                            await Arduino.Write("bed power on");
                            await Arduino.Brightness(Event[1].Brightness);
                            await Arduino.Write("bed color "+Event[1].Color);
                        } else {
                            JobsInit[Event[0]] = {"init": true};
                        }
                    }
                    LEDWakeUpEvent = new Date() - LEDWakeUpEvent;
                    console.log('Event completed: ' + LEDWakeUpEvent + 'ms');
                }, null, false, null, null, true);
            }
        } else {
            console.log("Deleting..");
            Events[Event[0]].stop();
            Events2[Event[0]].stop();
            delete Events[Event[0]];
            delete Events2[Event[0]];
        }
      });
}, null, true, null, null, true);



var LEDCrons = {
    "Job": {},
    "jobs": {
        "new": [],
        "new2": []
    }
};


// MySQL Jobs
var LED2Cron = new CronJob.CronJob('0 */5 * * * *', async () => {
    console.log('Starting LED Commands refreshing...');
    TMP = merge(TMP, {
        "LED2Cron": {
            "RunTime": new Date(),
        },
    });

    const fields = await models.ledtimes_model.findAll({
        where: {
            enabled: true
        }
    });
    var results = [];
    
    for (let i = 0; i < fields.length; i++) {
        const row = fields[i];
        results.push(row.dataValues);
    }
    
    LEDCrons["jobs"]["new"] = [];
    asyncForEach(results, async (row) => {
        TMP = merge(TMP, {
            "LED2Cron": {
                [row.ID]: {
                    "RunTime": new Date(),
                },
            },
        });
        if(LEDCrons["Job"][row.ID] == undefined) {
            LEDCrons["Job"][row.ID] = new CronJob.CronJob('0 0 0 * * *', async () => {
                
                console.log(`Running Job for ${row.Name}...`);
                TMP["LED2Cron"][row.ID].RunTime = new Date();
                var TMPLED = {
                    IR: [], RGB: []
                };
                if(row.LedStrip == "*") {
                    Object.keys(ConfigControl.config.get("LEDs")).forEach(function (key) {
                        ConfigControl.config.get()["LEDs"][key].forEach(key2 => {
                            if(key == "IRRGB") {
                                TMPLED.IR.push(key2)
                            } else {
                                TMPLED.RGB.push(key2);
                            }
                        });
                    });
                }
                
                if(row.Color == "off") {
                    asyncForEach(TMPLED.IR, async (IR) => {
                        Arduino.Write(IR+" power off");
                    });
                } else if(row.Color != null) {
                    asyncForEach(TMPLED.IR, async (IR) => {
                        Arduino.Write(IR+" power on");
                        await Arduino.brightness(row.Brightness);
                        Arduino.Write(IR+" color "+row.Color);
                    });
                }

                if(row.RGB !== undefined) {
                    asyncForEach(TMPLED.RGB, async (LED) => {
                        Arduino.WriteAdvanced(LED + " RGB "+row.RGB);
                    });
                }

                TMP["LED2Cron"][row.ID].RunTime = new Date() - TMP["LED2Cron"][row.ID].RunTime
                console.log('CronJob %s completed: %dms', row.Name, TMP["LED2Cron"][row.ID].RunTime);
            }, null, true, null, null, false);
        }
        if(row.type == "cron") {
            LEDCrons["Job"][row.ID].setTime(new CronJob.CronTime(row.CronTime));
            LEDCrons["Job"][row.ID].start();
            if(LEDCrons["jobs"]["new"].indexOf(row.ID) === -1) {
                LEDCrons["jobs"]["new"].push(row.ID);
            }
        }
    });

    if(TMP["init"]) {
        asyncForEach(Object.keys(LEDCrons["Job"]), async (row) => {
            if(!LEDCrons["jobs"]["new"].includes(parseInt(row))) {
                LEDCrons["Job"][row].stop();
                delete LEDCrons["Job"][row];
                delete LEDCrons["jobs"]["new"][row];
            }
        });
    } else {
        TMP["init"] = true;
    }
    TMP["LED2Cron"].RunTime = new Date() - TMP["LED2Cron"].RunTime;
    console.log('LED Commands Lookup completed in: %dms', TMP["LED2Cron"].RunTime);
}, null, false, null, null, false);

setTimeout(() => {
    LED2Cron.start();
    LED2Cron.fireOnTick()
}, 7500);


module.exports = { 
    LedJob: LED,
    EventReload,
    LED2Cron,
    Events,
    AutoUpdaterCron
}
