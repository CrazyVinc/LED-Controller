var path = require('path');

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
const { asyncForEach, MySQL2ToSequelize }  = require("./utils");

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
    
    const results = MySQL2ToSequelize(await models.blockedruns.findAll({
        where: {
            Time: moment().unix().toString().slice(0, -1)
        }
    }))
    
    console.log(883, moment().unix().toString().slice(0, -1))
    // const [results, fields] = await connection.promise().query(
    //     'SELECT * FROM blockedruns WHERE Time=? limit 1', [moment().unix().toString().slice(0, -1)]);
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
                const IsBlocked = await MySQL2ToSequelize(await models.blockedruns.findAll({
                    attributes: ['id'],
                    where: {
                        JobID: row.ID,
                        Time: moment().unix().toString().slice(0, -1)
                    }
                }));
                if(IsBlocked.length > 0) {
                    await models.blockedruns.destroy({
                        where: {
                          id: IsBlocked[0].id,
                        }
                      });
                    return;
                }
                
                console.log(`Running Job for ${row.Name}...`);
                TMP["LED2Cron"][row.ID].RunTime = new Date();
                var TMPLED = {
                    IR: [], RGB: []
                };

                if(row.LedStrip == "*") {
                    Object.keys(ConfigControl.arduinoConfig.get("LEDs")).forEach(function (key) {
                        ConfigControl.arduinoConfig.get()["LEDs"][key].forEach(key2 => {
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
                } else if(row.cmd !== (undefined || null)) {
                    JSON.parse(row.LedStrip).forEach(LedStrip => {
                        JSON.parse(row.cmd).forEach(cmd => {
                            console.log(cmd);
                            Arduino.Write(cmd.command, false, cmd.type, LedStrip, {options: {color: [cmd.color]}}, true);
                        });
                    });
                } else if(row.Color != null) {
                    asyncForEach(TMPLED.IR, async (IR) => {
                        Arduino.Write(IR+" power on");
                        await Arduino.brightness(row.Brightness);
                        Arduino.Write(IR+" color "+row.Color);
                    });
                } else if(row.RGB !== (undefined || null)) {
                    console.log("2");
                    asyncForEach(TMPLED.RGB, async (LED) => {
                        Arduino.WriteAdvanced(LED + " RGB "+row.RGB);
                    });
                }

                TMP["LED2Cron"][row.ID].RunTime = new Date() - TMP["LED2Cron"][row.ID].RunTime
                // console.log('CronJob %s completed: %dms', row.Name, TMP["LED2Cron"][row.ID].RunTime);
            }, null, true, null, null, false);
        }
        if(row.type == "cron") {
            LEDCrons["Job"][row.ID].setTime(new CronJob.CronTime(row.CronTime));
        } else {
            LEDCrons["Job"][row.ID].setTime(new CronJob.CronTime(moment(row.CronTime)));
        }//Thu Jun 09 2022 03:26:00 GMT+0200 (Midden-Europese zomertijd)
            LEDCrons["Job"][row.ID].start();
            if(LEDCrons["jobs"]["new"].indexOf(row.ID) === -1) {
                LEDCrons["jobs"]["new"].push(row.ID);
            }
        // }
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
    LED2Cron,
    Events,
    AutoUpdaterCron
}
