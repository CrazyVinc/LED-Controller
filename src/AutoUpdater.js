var cp = require("child_process");
var os = require("os");
const http = require("https");
const fs = require("fs");
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(Question) {
    return new Promise((resolve, reject) => {
        rl.question((Question || "?") + ": ", (input) => resolve(input));
    });
}

var AutoUpdaterCron;
var config;
if (require.main !== module) {
    config = require("./ConfigManager").config;
    AutoUpdaterCron = require("./CronJobs").AutoUpdaterCron;
}

var AutoUpdater = JSON.parse(fs.readFileSync("./AutoUpdater.json", "utf8"));
var Remotehash;
var Localhash = AutoUpdater.hash;
if (AutoUpdater.TMPhash !== undefined) {
    if(Localhash !== AutoUpdater.TMPhash) {
        Localhash = AutoUpdater.TMPhash;
        AutoUpdater.hash = AutoUpdater.TMPhash;
        delete AutoUpdater.TMPhash;
        fs.writeFile(
            "./AutoUpdater.json",
            JSON.stringify(AutoUpdater),
            function (err) {
                if (err) throw err;
            }
        );
}
}
var install = false;
var components = {
    version: "0.0.1",
    AutoUpdater: {
        Update: {
            URL: "https://codeload.github.com/VLGNL/LED-Controller/zip/refs/heads/master",
            METHOD: "GET",
        },
        RemoteVersion: {
            URL: "https://api.github.com/repos/vlgnl/LED-Controller/git/refs/heads/master",
            METHOD: "GET",
        },
    },
};

async function init2() {
    if (require.main !== module) {
        if (!config.get().AutoUpdater) {
            console.log("AutoUpdate is disabled in the config");
            console.log("Canceling cronjob!");
            AutoUpdaterCron.stop();
            return;
        }
        components = config.get("components");
    }
    console.log("Getting Remote Hash...");

    const data = new TextEncoder().encode(
        JSON.stringify({
            hash: AutoUpdater.hash,
            install: install,
            components: components,
        })
    );
    const options = {
        method: components.AutoUpdater.RemoteVersion.METHOD,
        headers: {
            "Content-Type": "application/json",
            "Content-Length": data.length,
            "User-Agent": "LED-Controller/" + Localhash,
        },
    };

    const req = http.request(
        components.AutoUpdater.RemoteVersion.URL,
        options,
        (response) => {
            var str = "";
            response.on("data", function (chunk) {
                str += chunk;
            });

            response.on("end", function () {
                try {
                    init3(JSON.parse(str));
                } catch (e) {
                    init3({
                        error: true,
                        msg: str,
                    });
                }
            });
        }
    );
    req.write(data);
    req.end();
}
async function init3(res) {
    if (res.error) {
        console.error("Error getting checksum. do you have internet?");
        console.error("Giving up...");
        console.error(res);
        return;
    }
    Remotehash = res.hash || res.object.sha;
    console.log("Server: " + Remotehash);
    console.log("Local:  " + Localhash);

    if (Remotehash == Localhash) {
        console.log("Uptodate!");
        return;
    } else if (Remotehash == null) {
        console.log(
            "The provided update server has serving updates currently disabled."
        );
        return;
    } else {
        console.log("Update found!");
        console.log("Downloading update...");
        download(
            components.AutoUpdater.Update.URL + "?v=" + components.version,
            "temp/update.zip",
            null
        );
    }
}

function platform2() {
    var platform = os.platform();
    if (platform == "win32") {
        return "windows";
    } else if (platform == "haiku") {
        return "NoSupport";
    } else if (platform == "android") {
        return "NoSupport";
    } else {
        return platform;
    }
}
function arch2() {
    var arch = os.arch();
    if (arch == "x64") {
        return "amd64";
    } else if (arch == "x32") {
        return "386";
    } else {
        return arch;
    }
}

function runUpdater() {
    console.log("Looking for compiled updater");
    var platform = platform2();
    var arch = arch2();
    if (platform == "NoSupport" || arch == "NoSupport") {
        console.log("Canceling update.");
        console.log("No AutoUpdater found for this platform!");
        return;
    }
    if (platform == "windows") arch = arch + ".exe"; // 32 Bit requires administration rights
    var updater = "Updater/Updater-" + platform + "-" + arch;
    var updaterR = "Updater/RUN.Updater-" + platform + "-" + arch;
    if (fs.existsSync(updater)) {
        console.log(
            "Compiled updater found! Making ready for starting the updater."
        );
        fs.copyFile(updater, updaterR, (err) => {
            if (err) {
                console.warn(
                    "There was a error while making ready for executing the updater:",
                    err
                );
                return err;
            }

            AutoUpdater.TMPhash = Remotehash;
            setTimeout(() => {
                fs.writeFile(
                    "./AutoUpdater.json",
                    JSON.stringify(AutoUpdater),
                    function (err) {
                        if (err) throw err;
                        console.log("AutoUpdater.json is updated!");
                        setTimeout(() => {
                            process.send(
                                JSON.stringify({
                                    msg: "update available!",
                                    exec: updaterR,
                                })
                            );
                        }, 500);
                    }
                );
            }, 500);
        });
    } else {
        console.log("???", updater);
    }
}

var download = function (url, dest, cb) {
    console.log(url);
    var file = fs.createWriteStream(dest);
    const options = {
        method: components.AutoUpdater.Update.METHOD,
        headers: {
            "User-Agent": "LED-Controller/" + Localhash,
        },
    };
    var request = http
        .request(url, options, function (response) {
            response.pipe(file);
            file.on("finish", function () {
                file.close(cb);
                runUpdater();
            });
        })
        .on("error", function (err) {
            // Handle errors
            fs.unlink(dest);
            if (cb) cb(err.message);
        });
    const data = new TextEncoder().encode(
        JSON.stringify({
            hash: AutoUpdater.hash,
            install: install,
            version: components,
        })
    );
    request.write(data);
};

async function init() {
    if (require.main === module || !fs.existsSync("./config.json")) {
        install == true;
        var resultT = { DB: {} };
        console.log("Setup");
        await ask("Which SerialPort must be used")
            .then((answer) => {
                console.log(answer);
                resultT["SerialPort"] = answer;
                return ask("On which port must the website run");
            })
            .then((answer) => {
                console.log(answer);
                resultT["WebPort"] = answer;
                return ask("Database Hostname");
            })
            .then((answer) => {
                console.log(answer);
                console.log("Database Setup");
                resultT["DB"]["hostname"] = answer;
                return ask("Database username");
            })
            .then((answer) => {
                console.log(answer);
                resultT["DB"]["user"] = answer;
                return ask("Database password");
            })
            .then((answer) => {
                console.log(answer);
                resultT["DB"]["password"] = answer;
                return ask("Database name");
            })
            .then((answer) => {
                console.log(answer);
                resultT["DB"]["database"] = answer;
                rl.close();
            })
            .then(() => {
                console.log(resultT);
            });

        rawdata = JSON.stringify({
            SerialPort: resultT.SerialPort,
            AutoUpdater: true,
            port: resultT.WebPort,
            DB: {
                hostname: resultT.DB.hostname,
                user: resultT.DB.user,
                password: resultT.DB.password,
                database: resultT.DB.database,
            },
            Events: {
                SunSet: {
                    enabled: true,
                    Color: "white",
                    Brightness: 6,
                    criteria: {
                        type: "Web API",
                        API: {
                            URL: "https://api.sunrise-sunset.org/json?lat=52.065150&lng=4.532130&formatted=0",
                            type: "JSON",
                        },
                        if: "results.sunset >= {$TimeNow}",
                        Recheck: {
                            type: "hour",
                            count: "1",
                        },
                    },
                },
            },
        });
        fs.writeFile("./config.json", rawdata, (err) => {
            if (err) {
                console.error(err);
            }
        });
        init2();
    } else {
        init2();
    }
}
init();
exports.update = init;
