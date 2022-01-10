const http = require('http');
var path = require('path');
var fs = require('fs');
const { log } = require('console');
var cp = require("child_process");

require('console-stamp')(console, '[HH:MM:ss.l]');

var config = require('./src/ConfigManager');

var mysql = require('mysql2');

const AutoUpdater = require('./src/AutoUpdater');
const { socketConnection } = require('./src/SocketIO');
const { pq, reset } = require("./src/Queue");
const gradient = require('gradient-color');

var hashFiles = require('hash-files');
var express = require('express');
var archiver = require('archiver');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
let ejs = require('ejs');
var bodyParser = require('body-parser');

var moment = require('moment');

var CronJob = require('cron');
var CronVerify = require('cron-validate');

const UUID = require('uuidv4');

const Arduino = require("./src/ArduinoController");
const {RemoteCntrlColors, capitalizeFirstLetter} = require("./src/utils");
const {connection} = require("./src/Database");
const CronJobs = require("./src/CronJobs");
const { verify, randomUUID } = require('crypto');


process.on("message", function (message) {
  console.log(`Message from main.js: ${message}`);
});

var sessionStore = new MySQLStore({}, connection.promise());

const app = express();
const server = http.createServer(app);
socketConnection(server);


TimeOut = setTimeout(() => {
  let LastDataJSON = fs.readFileSync('LastData.json');
  LastDataJSON = JSON.parse(LastDataJSON);
  Object.keys(LastDataJSON).forEach(function(key) {
    var LED = LastDataJSON[key];
    console.log(0, LED.cmd);
    Arduino.Write(LED.cmd, true)
  });
}, 2500);


app.set('view engine', 'ejs');
app.use(session({
	secret: 'secret',
	resave: true,
	store: sessionStore,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 }
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.use('/assets', express.static('assets'));
// Authentication and Authorization Middleware
var auth = async (req, res, next) => {
  if(!config.config.get().Other.Auth) {
    if (!req.session.loggedin) {
      req.session.loggedin = true;
      req.session.CheckFree = 3;
      req.session.username = "VLGNL";
      req.session.token = randomUUID;
    }
    next();
    return;
  }
  if (req.session.loggedin) {
    if (typeof req.session.CheckFree !== 'undefined' && req.session.username && req.session.token) {
      if(req.session.CheckFree == 0) {
        const [results, fields] = await connection.promise().query(
            'SELECT * FROM accounts WHERE username = ? AND token = ?',
            [req.session.username, req.session.token]);
        if (results.length > 0) {
          console.log("Next");
        } else {
          console.log("Dest");
          req.session.destroy();
          return res.redirect('/');
        }
        req.session.CheckFree = 3;
        return next();
      } else {
        console.log(000, req.session.CheckFree);
        req.session.CheckFree--;
        console.log(-1, req.session.CheckFree);
        return next();
      }
    } else {
      return res.redirect('/');
    }
  } else {
    return res.redirect('/');
  }
};

app.post('/update', async(req, res) => {
  // if(req.body.hash !== undefined) {
  //   res.send("No Hash received!");
  //   return;
  // }
  if(config.config.get('Other.UpdateServer')) {
    await hashFiles({
      "files": config.AutoUpdater.options.FilesForHash
      }, async(error, hash) => {
      config.AutoUpdater.options.hash = hash;
      fs.writeFile('./AutoUpdater.json', JSON.stringify(config.AutoUpdater.options), function (err) {
        if (err) throw err;
        console.log('AutoUpdater.json is updated!');
        config.ReloadUpdater();
      });
      res.send({hash: hash});
    });
  } else {
    res.send({hash: null, UpdateServer: false});
  }
});

app.get('/update', async(req, res) => {
    var archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    });

    archive.on('error', function(err) {
      res.status(500).send({error: err.message});
    });

    //on stream closed we can end the request
    archive.on('end', function() {
      console.log('Archive wrote %d bytes', archive.pointer());
    });

    //set the archive name
    res.attachment('update.zip');

    //this is the streaming magic
    archive.pipe(res);

    var files = [
      __dirname + '/AutoUpdater.json',
      __dirname + '/index.js',
      __dirname + '/config-schema.json',
      __dirname + '/package.json'
    ];

    for(var i in files) {
      archive.file(files[i], { name: path.basename(files[i]) });
    }

    var directories = [
      __dirname + '/views',
      __dirname + '/src',
      __dirname + '/routes',
      __dirname + '/assets',
    ]

    for(var i in directories) {
      archive.directory(directories[i], directories[i].replace(__dirname + '/', ''));
    }

    archive.finalize();
});

app.get('/', function(req, res) {
  if (req.session.loggedin || !config.config.get().Other.Auth) {
    res.redirect('/home');
	} else {
	  res.render('login');
  }
});

app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
        console.log(results[0].token);
				request.session.loggedin = true;
        request.session.CheckFree = 3;
				request.session.username = username;
				request.session.token = results[0].token;
				response.redirect('/home');
			} else {
				response.send('Incorrect Username and/or Password!');
			}
			response.end();
		});
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});

app.get('/home', auth, async (req, res) => {
  res.render('control')
});

app.use('/new', auth, require("./routes/new"));

app.get('/Settings', auth, function(req, res) {
  res.render('settings');
});

app.get('/Calendar', async(req, res) => {
  const [BlockedRuns] = await connection.promise().query('SELECT * FROM blockedruns');
  const [results, fields] = await connection.promise().query(
      'SELECT * FROM ledtimes WHERE `enabled`=\"true\"');
  res.render('Calendar', {"LEDS": results, "BlockedRuns": BlockedRuns, Cron: CronJob, moment: moment});
});

app.get('/control', auth, function(req, res) {
  res.render('control');
});


app.post('/modal/Calendar/:ID', auth, async(req, res) => {
  console.log(req.body);
  if(req.params.ID) {
    const [results, fields] = await connection.promise().query(
      'SELECT * FROM ledtimes WHERE `enabled`=\"true\"');
      console.log(results);
    res.render('modal/Calendar', {"LEDS": results, Cron: CronJob, moment: moment, req: req});
  } else {
    console.log("?");
    res.send("?");
  }
});

app.post('/modal/NewEvent', auth, async(req, res) => {
  console.log(req.body);
  res.render('modal/NewEvent', {capitalizeFirstLetter, Cron: CronJob, moment: moment, req: req, RemoteCntrlColors: RemoteCntrlColors});
});

app.use('/api', auth, require("./routes/api"));

app.get('/test', async(req, res) => {
  if(req.query.stop !== undefined) {
    res.send("stop");
    return;
  }
  if(req.query.rgb !== undefined) {
    Arduino.Write("rgb "+req.query.rgb);
    res.send("rgb");
    return;
  }
  console.log(req.query.colors);
  const colors = gradient.default(req.query.colors.split(","), req.query.count || 10)
  var search = /([0-9]+), ([0-9]+), ([0-9]+)/;

  colors.forEach(color => {
    color = color.match(search);
    Arduino.Write("rgb "+color[0]);
  });
  res.send(colors);
});

app.get('/test2', async(req, res) => {
  for(let i = 0; i < 500; i++) {
    Arduino.Write("power on");
    Arduino.Write("power off");
  };
  res.send("a");
});

app.get('*', auth, function(req, res){
  res.status(404).render('errors', {error: {code: "404"}});
  // res.redirect("/home");
});

app.set('port', config.config.get().port);
server.listen(app.get('port'), () => {
  console.log("The LEDController server is running on port:", app.get("port"))
});