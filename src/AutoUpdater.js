const fs = require("fs");

const { autoUpdater } = require("@crazyvinc/updater");

var {config, AppCache} = require("./ConfigManager");
const merge = require("deepmerge");
const { overwriteMerge } = require("./utils");
const moment = require("moment");

var AutoUpdaterCron;
if (require.main !== module) AutoUpdaterCron = require("./CronJobs").AutoUpdaterCron;

var installer = JSON.parse(fs.readFileSync(`./installer.json`));

const downloader = new autoUpdater({
    remoteJSON: installer.remoteJSON,
    downloadURL: installer.downloadURL
});



var Remotehash;
var Localhash = AppCache.cache?.version?.hash;
if (AppCache.cache?.version?.TMPhash !== undefined) {
        Localhash = AppCache.cache.version.TMPhash;
        delete AppCache.options.version?.hash;
        delete AppCache.options.version?.TMPhash;
        
        AppCache.new = merge(AppCache.cache,
            { version: { hash: Localhash }},
            { arrayMerge: overwriteMerge }
        );
}

async function init2() {
    if (!config.get().AutoUpdater) {
        console.log("AutoUpdate is disabled in the config");
        console.log("Canceling cronjob!");
        AutoUpdaterCron.stop();
        return;
    } else {
        var lastTimeLooked = AppCache.cache.version?.lastTimeLooked || 0;
        var ONE_HOUR = 60 * 60 * 1000; /* ms */
        if(moment().diff(lastTimeLooked) < ONE_HOUR) return;
        /* Only allow getting version once a hour */
        
        await downloader.getRemoteVersion()
            .then(async (result) => {
            result = JSON.parse(result);
            Remotehash = result?.hash || result?.object?.sha || null;
            if (Remotehash == null) {
                console.log(`Currently unable to find the remote version! Canceling update check.`, result);
                return;
            } else {
                AppCache.new = merge(AppCache.cache,
                    { version: { lastTimeLooked: moment.now() }},
                    { arrayMerge: overwriteMerge }
                );
            }
            if (Remotehash !== (Localhash || null)) {
                downloader.defaultUpdater('data/tmp')
                    .then(async (result) => {
                        AppCache.new = {...AppCache.cache,
                            version: { TMPhash:Remotehash }
                        };
                        
                        await downloader.download(installer.downloadURL, "./data/tmp/update.zip");
                        setTimeout(() => {
                            process.send(
                                JSON.stringify({
                                    msg: "execute extractor!",
                                    exec: result.path,
                                    args: ['-dest=./', '-zip=./data/tmp/update.zip', '-extractfile=./installer.json', '-npm']
                                })
                            );
                        }, 250);
                    })
                    .catch((err) => {
                        console.log(-2, err);
                    });
            }
        })
        .catch(function (error) {
            console.error("Error getting checksum. do you have internet?");
            console.error("Giving up...");
            console.error(error);
        });
    }
}

init2();
exports.update = init2;