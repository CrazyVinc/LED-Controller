var path = require('path');

require('console-stamp')(console, '[HH:MM:ss.l]');

var mysql = require('mysql2');
var CronJob = require('cron');
var moment = require('moment');
var moment = require('moment-strftime');
const axios = require('axios');
const merge = require('deepmerge')

const {connection, DBStatus, Queue} = require("./Database");
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

// var DatabaseOffline = new CronJob.CronJob('0 */5 * * * *', async () => {
//     connection.query("SELECT * FROM `ledtimes` WHERE `Name`=\"active\" AND `enabled`=\"true\" LIMIT 1", function(err, rows, fields) {
//         if(err) {
//             // DB.
//             DBStatus.update = {Status: false, info: err}
//             console.log("Database error: ", err);
//             LED.stop();
//             return;
//         }
//         if(rows.length > 0) {
//             console.log("\nREFRESH\n");
//             console.log(rows[0].CronTime);
//             LEDJobTracking = rows[0];
//             LED.setTime(CronJob.time(rows[0].CronTime));
//             LED.start();
//             LedTMP.WakeUP = rows[0];
//         } else {
//             console.log("No active LED Timer found!");
//             LED.stop();
//         }
//     })
// }, null, true, null, null, true);

var AutoUpdaterCron = new CronJob.CronJob('0 0 * * * *', async () => {
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

    await Arduino.Write("power on");
    if(LedTMP.WakeUP.TMPColor !== null) {
        console.log(384);
        await Arduino.Write("color "+LedTMP.WakeUP.TMPColor);
    }
    await Arduino.Brightness(LedTMP.WakeUP.Brightness);
    await Arduino.Write("color "+LedTMP.WakeUP.Color);
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
                }, null, false, null, null, true);


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
                            await Arduino.Write("power on");
                            await Arduino.Write("rgb 175");
                            await Arduino.Write("power on");
                            await Arduino.Brightness(Event[1].Brightness);
                            await Arduino.Write("color "+Event[1].Color);
                        } else {
                            JobsInit[Event[0]] = {"init": true}
                        }
                    }
                    LEDWakeUpEvent = new Date() - LEDWakeUpEvent;
                    console.log('Event completed: ' + LEDWakeUpEvent + 'ms');
                }, null, true, null, null, true);

                await new Promise(r => setTimeout(r, 1000));

                Events[Event[0]].start();
                Events2[Event[0]].start();
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
    
    const [results, fields] = await connection.promise().query(
        'SELECT * FROM ledtimes WHERE enabled=\"true\"');

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
                
                if(row.Color == "off") {
                    await Arduino.Write("power off");
                } else {
                    await Arduino.Write("power on");
                    await Arduino.Brightness(row.Brightness);
                    await Arduino.Write("color "+row.Color);
                }

                if(row.Arduino !== undefined) {
                    if(new RegExp("\(\d*\)").test(row.Arduino)) {
                        if(!(row.Arduino).includes('\\n')) row.Arduino = row.Arduino+"\\n";
                        asyncForEach((row.Arduino).split('\\n'), async (row2) => {
                            if(new RegExp("sleep\(\d*\)").test(row2)) {
                                setTimeout(()=> {}, row2.match(/\d*/g).join(''));
                            } else if(new RegExp("bright\(\d*\)").test(row2)) {
                               await Arduino.Brightness(row2.match(/\d*/g).join(''));
                            } else {
                               await Arduino.Write(row2);
                            }
                        });
                    } else {
                        await Arduino.Write(row.Arduino);
                    }
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
}, null, true, null, null, true);


module.exports = { 
    LedJob: LED,
    EventReload,
    Events,
    AutoUpdaterCron
}
