const http = require('http');
var path = require('path');
var fs = require('fs');

var hashFiles = require('hash-files');
var express = require('express');
var archiver = require('archiver');
var session = require('express-session');
const SequelizeStore = require('express-session-sequelize')(session.Store);

let ejs = require('ejs');
var bodyParser = require('body-parser');

var moment = require('moment');

var CronJob = require('cron');

const { socketConnection } = require('./SocketIO');
const config = require('./ConfigManager');
const AppCache = config.AppCache;
const {connection, sequelize} = require("./Database");
const { randomUUID } = require('crypto');

const sessionStore = new SequelizeStore({
  db: sequelize,
});

const app = express();
const server = http.createServer(app);
socketConnection(server);

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
        if (results.length == 0) {
          req.session.destroy();
          return res.status(403).redirect('/');
        }
        req.session.CheckFree = 3;
        return next();
      } else {
        req.session.CheckFree--
        return next();
      }
    } else {
      return res.status(403).redirect('/');
    }
  } else {
    return res.status(403).redirect('/');
  }
};

app.post('/update', async(req, res) => {
  if(config.config.get('Other.UpdateServer')) {
    let Installer = JSON.parse(fs.readFileSync('./installer.json', 'utf8'));
    await hashFiles({
      "files": Installer.FilesForHash
    }, async(error, hash) => {
      if(err) console.error(err);
        console.log(AppCache.cache);
        AppCache.cache.version.hash = hash;
        res.send({hash: hash});
    });
  } else {
    console.log("Requested update is canceled.")
    res.send({error: true, hash: null, UpdateServer: false});
  }
});

app.get('/update', async(req, res) => {
  if(config.config.get('Other.UpdateServer')) {
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

    let Installer = JSON.parse(fs.readFileSync('./installer.json', 'utf8'));
    var files = [];
    var directories = [];

    
    Installer["DL"]["files"].forEach(file => {
      files.push(__dirname + file);
    });;

    Installer["DL"]["directories"].forEach(dir => {
      directories.push(__dirname + dir);
    });;
    
    for(var i in files) {
      if(req.query.v !== undefined) {
        archive.file(files[i], { name: "LED-Controller-master/"+path.basename(files[i]) });
      } else {
        archive.file(files[i], { name: path.basename(files[i]) });
      }
    }

    for(var i in directories) {
      if(req.query.v !== undefined) {
        archive.directory(directories[i], "LED-Controller-master/"+directories[i].replace(__dirname + '/', ''));
      } else {
        archive.directory(directories[i], directories[i].replace(__dirname + '/', ''));
      }
    }

    archive.finalize();
  } else {
    res.send({error: true, msg: "Updates are currently disabled."});
  }
});

app.get('/', function(req, res) {
  if(req.query.logout !== undefined) {
    req.session.destroy(function() {
      res.render('login');
    })
  } else if (req.session.loggedin || !config.config.get().Other.Auth) {
    res.redirect('/home');
	} else {
	  res.render('login');
  }
});

app.get('/reload', auth, function(req, res) {
  config.config.reload();
  res.send("Config is now reloaded! Going back in 3 seconds...<script>setTimeout(() => { if ('referrer' in document) { window.location = document.referrer; } else { window.history.back(); } }, 3000);</script>");
});

app.all('/auth', function(request, response) {
	var username = request.body.username || request.query.auth.split(";")[0];
	var password = request.body.password || request.query.auth.split(";")[1];
	if (username && password) {
		connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
			if (results.length > 0) {
				request.session.loggedin = true;
        request.session.CheckFree = 5;
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
  res.render('control', {LEDs: config.config.get("LEDs")})
});

app.get('/Settings', auth, function(req, res) {
  res.render('settings');
});

app.get('/Calendar', auth, async(req, res) => {
  res.render('Calendar', {Cron: CronJob, moment: moment});
});

app.get('/control', auth, function(req, res) {
  res.render('control');
});

app.use('/modal', auth, require("./routes/modal"));
app.use('/test', auth, require("./routes/test"));
app.use('/new', auth, require("./routes/new"));
app.use('/api', auth, require("./routes/api"));
app.use('/upload', auth, require("./routes/upload"));

app.get('*', auth, function(req, res){
  res.status(404).render('errors', {error: {code: "404"}});
});

app.set('port', config.config.get().port);
server.listen(app.get('port'), () => {
  require("./SocketController");
  console.log("The LEDController server is running on port:", app.get("port"))
});