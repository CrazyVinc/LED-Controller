var express = require("express");

var app = express.Router();


app.post("/", async (req, res) => {
    if (config.config.get("Other.UpdateServer") || req.query?.forceupdate) {
        let Installer = JSON.parse(fs.readFileSync("./installer.json", "utf8"));
        await hashFiles(
            {
                files: Installer.FilesForHash,
            },
            async (error, hash) => {
                config.AutoUpdater.options.hash = hash;
                fs.writeFile(
                    "./AutoUpdater.json",
                    JSON.stringify(config.AutoUpdater.options),
                    function (err) {
                        if (err) {
                            res.send({ hash: hash });
                            console.warn(err);
                            return;
                        }
                        console.log("AutoUpdater.json is updated!", hash);
                        config.ReloadUpdater();
                        res.send({ hash: hash });
                    }
                );
            }
        );
    } else {
        console.log("Requested update is canceled.");
        res.send({ error: true, hash: null, UpdateServer: false });
    }
});

app.get("/", async (req, res) => {
    if (config.config.get("Other.UpdateServer") || req.query?.forceupdate) {
        var archive = archiver("zip", {
            zlib: { level: 9 }, // Sets the compression level.
        });

        archive.on("error", function (err) {
            res.status(500).send({ error: err.message });
        });

        //on stream closed we can end the request
        archive.on("end", function () {
            console.log("Archive wrote %d bytes", archive.pointer());
        });

        //set the archive name
        res.attachment("update.zip");

        //this is the streaming magic
        archive.pipe(res);

        let Installer = JSON.parse(fs.readFileSync("./installer.json", "utf8"));
        var files = [];
        var directories = [];

        Installer["DL"]["files"].forEach((file) => {
            files.push(__dirname + file);
        });

        Installer["DL"]["directories"].forEach((dir) => {
            directories.push(__dirname + dir);
        });

        for (var i in files) {
            if (req.query.v !== undefined) {
                archive.file(files[i], {
                    name: "LED-Controller-master/" + path.basename(files[i]),
                });
            } else {
                archive.file(files[i], { name: path.basename(files[i]) });
            }
        }

        for (var i in directories) {
            if (req.query.v !== undefined) {
                archive.directory(
                    directories[i],
                    "LED-Controller-master/" +
                        directories[i].replace(__dirname + "/", "")
                );
            } else {
                archive.directory(
                    directories[i],
                    directories[i].replace(__dirname + "/", "")
                );
            }
        }

        archive.finalize();
    } else {
        res.send({ error: true, msg: "Updates are currently disabled." });
    }
});


module.exports = {
    app,
    path: "/updates"
};
