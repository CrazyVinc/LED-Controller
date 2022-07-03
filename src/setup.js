/*
Installer for the LED Controller
*/
var os = require("os");
const https = require("https");
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

if (!fs.existsSync("data/tmp")) fs.mkdirSync("data/tmp", { recursive: true });
if (!fs.existsSync("data/Settings")) fs.mkdirSync("data/Settings", { recursive: true });

let installer = {};
if (!fs.existsSync("./installer.json")) {
    installer = {
        "downloadURL": "https://codeload.github.com/CrazyVinc/LED-Controller/zip/refs/heads/master",
        "remoteJSON": "https://api.github.com/repos/CrazyVinc/LED-Controller/git/refs/heads/master",
        "extract": {
            "files": ["/config-schema.json","/index.js","/installer.json","/package.json"],
            "directories": ["/src"]
        }
    };
    fs.writeFile("./installer.json", JSON.stringify(installer), (err) => {
        if (err) {
            console.error(err);
        }
    });
} else {
    installer = JSON.parse(fs.readFileSync("./installer.json", 'utf8'));
}


async function getRemoteVersion(url = installer.remoteJSON) {
    return new Promise((resolve, reject) => {
        const options = {
            method: "GET",
            headers: {
                'User-Agent': 'LED-Controller/0.1'
            }
        };

        https.request(url, options,
            (response) => {
                var str = "";
                response.on("data", function (chunk) {
                    str += chunk;
                });

                response.on("end", function () {
                    try {
                        resolve(JSON.parse(str));
                    } catch (e) {
                        reject(e);
                    }
                });
            }
        ).end();
    });
}

async function downloadExtractor() {
    return new Promise((resolve, reject) => {
        var platform = os.platform();
        var arch = os.arch();

        getRemoteVersion(`https://cdn.crazyvinc.nl/npm/autoupdater/updaters.json`).then((result) => {
            if (result?.[platform] === undefined &&
                result?.[platform]?.[arch] === undefined ) {
                    console.log(result, 4843);
                    console.log(platform, arch);
                    return reject(`No file found for ${platform}/${arch}.`);
                }
            download(`https://cdn.crazyvinc.nl/npm/autoupdater/${result[platform][arch]}`,
                `data/tmp/${result[platform][arch]}`).then((result) => {
                    resolve(result);
                }).catch((err) => {
                    reject(err)
                });
        }).catch((err) => {
            reject(err);
        });
    });
}

async function download(url, dest) {
    return new Promise((resolve, reject) => {
        var file = fs.createWriteStream(dest);
        const options = {
            method: "GET",
            headers: {
                'User-Agent': 'LED-Controller/0.1'
            }
        };
        var req = https
            .request(url, options, function (res) {
                res.pipe(file);
                file.on("finish", function () {
                    file.close();
                    resolve(file);
                });
            })
            .on("error", function (err) {
                // Handle errors
                fs.unlink(dest);
                reject(err, 4);
            });
        req.end();
    });
};

async function AskConfig() {
    return new Promise(async(resolve, reject) => {
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

        rawdata = {
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
        };
        await fs.promises.writeFile("./config.json", JSON.stringify(rawdata), 'utf8');

        resolve(rawdata);
    });
}

async function setup() {
    var extractor = await downloadExtractor().then((result) => {
        return result;
    }).catch((err) => {
        return console.error(err);
    });
    var config = await AskConfig();

    var RemoteVer = await getRemoteVersion();
    RemoteVer = RemoteVer?.object?.sha || RemoteVer?.version || RemoteVer?.ver || RemoteVer?.sha;
    if (RemoteVer == null) {
        console.error("The provided update server has serving updates currently disabled, Can't continue installing.");
        return;
    } else {
        download(installer.downloadURL, `data/tmp/update.zip`).then((result) => {
            process.send(JSON.stringify({
                msg: "execute extractor!",
                exec: `./${extractor.path}`,
                args: ['-dest=./', '-zip=./data/tmp/update.zip', '-extractfile=./installer.json', '-npm']
            }));
        }).catch((err) => {
            console.error(err);
        });
    }
}

setup();