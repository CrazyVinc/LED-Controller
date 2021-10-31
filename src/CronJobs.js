
var path = require('path');

var mysql = require('mysql2');
var CronJob = require('cron');
var moment = require('moment');
var moment = require('moment-strftime');
const axios = require('axios');

const {connection, DBStatus, Queue} = require("./Database");
const ConfigControl  = require("../config.js");
const Arduino = require("./ArduinoController");
const { randomUUID, randomInt } = require('crypto');


async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }
  
var LEDWakeUpEvent;
var LedTMP = {};

var DatabaseOffline = new CronJob.CronJob('0 */5 * * * *', async () => {
    connection.query("SELECT * FROM `ledtimes` WHERE `Name`=\"active\" AND `enabled`=\"true\" LIMIT 1", function(err, rows, fields) {
        if(err) {
            // DB.
            DBStatus.update = {Status: false, info: err}
            console.log("Database error: ", err);
            LED.stop();
            return;
        }
        if(rows.length > 0) {
            console.log("\nREFRESH\n");
            console.log(rows[0].CronTime);
            LEDJobTracking = rows[0];
            LED.setTime(CronJob.time(rows[0].CronTime));
            LED.start();
            LedTMP.WakeUP = rows[0];
        } else {
            console.log("No active LED Timer found!");
            LED.stop();
        }
    })
}, null, true, null, null, true);


var LED = new CronJob.CronJob('0 0 0 * * *', async () => {
  console.log('Waking Up...');
  LEDWakeUpEvent = new Date();
  
  await Arduino.Write("power on");
  await Arduino.Write("color red");
  await Arduino.Brightness(LedTMP.WakeUP.Brightness);
  await Arduino.Write("color "+LedTMP.WakeUP.Color);
  LEDWakeUpEvent = new Date() - LEDWakeUpEvent;
  console.log('LEDs completed: ' + LEDWakeUpEvent + 'ms');
}, null, false);
var LEDJobTracking = {};



var Events = {};
var Events2 = {};

var LEDJobReload = new CronJob.CronJob('0 */30 * * * *', async () => {
    connection.query("SELECT * FROM `ledtimes` WHERE `Name`=\"active\" AND `enabled`=\"true\" LIMIT 1", function(err, rows, fields) {
        if(err) {
            DBStatus.status = {Status: false, info: err}
            console.error("Database error: ", err);
            LED.stop();
            return;
        }
        if(rows.length > 0) {
            console.log("\nREFRESH\n");
            console.log(rows[0].CronTime);
            LEDJobTracking = rows[0];
            LED.setTime(CronJob.time(rows[0].CronTime));
            LED.start();
            LedTMP.WakeUP = rows[0];
        } else {
            console.log("No active LED Timer found!");
            LED.stop();
        }
    })
}, null, true, null, null, true);

// JobsInit[Event[0]] = {"init": false}
var JobsInit = {}
var EventReload = new CronJob.CronJob('*/30 * * * * *', async () => {
    ConfigControl.ReloadConfig()
    var options = ConfigControl.config.options;
    asyncForEach(Object.entries(options.Events), async (Event) => {
        if(!([Event[0]] in JobsInit)) {
            // console.log("a");
            console.log(([Event[0]] in JobsInit), 6);
            JobsInit[Event[0]] = {"init": false}
        }    
        if(Event[1].enabled) {
            if(Events[Event[0]] === undefined) {
                // if(Event[1].criteria.API.type === "JSON") {
                //     if(Event[1].criteria.if !== undefined) {
                //         if((Event[1].criteria.if).includes('>=')) {
                //             var CriteriaIF = (Event[1].criteria.if).split(" >=");
                //             console.log(-1, Cr iteriaIF[0], response.data[(CriteriaIF[0])]);
                //             results.sunset >= {$TimeNow}
                //         }
                //     }
                // }

                Events2[Event[0]] = new CronJob.CronJob('0 0 0 */35 * *', async () => {
                    console.log(`Recheck Event for ${Event[0]}...`);
                    LEDWakeUpEvent = new Date();
                    if(Event[1].criteria.type == "Web API") {
                        var response = await axios.get(Event[1].criteria.API.URL);
                        var time = response.data.results.sunset;

                        if(moment(time).isAfter(moment())) {
                            Events[Event[0]].setTime(new CronJob.CronTime(moment(time)));
                            console.log("Coming");
                        } else {
                            console.log("Past");
                        }
                        // console.log(5473, moment(Events[Event[0]].nextDates()).toLocaleString());
                    }
                    LEDWakeUpEvent = new Date() - LEDWakeUpEvent;
                    console.log('Recheck Event completed: ' + LEDWakeUpEvent + 'ms');
                    Events[Event[0]].start();
                }, null, false, null, null, true);


                Events[Event[0]] = new CronJob.CronJob('0 0 0 * * *', async () => {
                    console.log(`Running Event for ${Event[0]}...`);
                    LEDWakeUpEvent = new Date();
                    if(Event[1].criteria.type == "Web API") {
                        // var response = await axios.get(Event[1].criteria.API.URL);
                        // var time = moment(response.data.results.sunset);
                        var Recheck = moment().add({
                            [(Event[1].criteria.Recheck.type)]: (Event[1].criteria.Recheck.count)
                        });
                        
                        Events2[Event[0]].setTime(new CronJob.CronTime(Recheck));
                        // console.log(time, 4673892);
                        
                        if(JobsInit[Event[0]].init) {
                            console.log("SunSet",472);
                            await Arduino.Write("power on");
                            await Arduino.Brightness(6);
                            await Arduino.Write("color white");
                        } else {
                            console.log(JobsInit[Event[0]].init);
                            JobsInit[Event[0]] = {"init": true}
                        }
                    }
                    LEDWakeUpEvent = new Date() - LEDWakeUpEvent;
                    console.log('Event completed: ' + LEDWakeUpEvent + 'ms');
                }, null, true, null, null, true);

                await new Promise(r => setTimeout(r, 1000));

                //Events[Event[0]].setTime(new CronJob.CronTime(moment(TMP[Event[0]].RunTime)));
                // console.log(-3785, TMP);

                Events[Event[0]].start();
                Events2[Event[0]].start();

                // console.log(Event[1].criteria.API);
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

// var dik = new CronJob.CronJob('*/5 * * * * *', async () => {
//     console.log('Running Event...');
//     LEDWakeUpEvent = new Date();
//     // console.log(TMP);
//     console.log(5473, moment(Events["SunSet"].nextDates()).toLocaleString())
//     console.log(-473, moment(Events2["SunSet"].nextDates()).toLocaleString())
//     LEDWakeUpEvent = new Date() - LEDWakeUpEvent;
//     console.log(randomInt(5838), 'LEDs completed: ' + LEDWakeUpEvent + 'ms');
//   }, null, true);

module.exports = { 
    LedJob: LED,
    LEDJobReload,
    EventReload,
    Events
}