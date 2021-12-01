var path = require('path');
const { log } = require('console');

require('console-stamp')(console, '[HH:MM:ss.l]');

var mysql = require('mysql2');

var express = require('express');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
let ejs = require('ejs');
var bodyParser = require('body-parser');

var moment = require('moment');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const Ready = require('@serialport/parser-ready')

var CronJob = require('cron');
var CronVerify = require('cron-validate');

const UUID = require('uuidv4');

const Arduino = require("./src/ArduinoController");
const {connection} = require("./src/Database");
const CronJobs = require("./src/CronJobs");
const { verify, randomUUID } = require('crypto');

var config = require('./config');


var sessionStore = new MySQLStore({}, connection.promise());

var app = express();
var expressWs = require('express-ws')(app);
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
  if(!config.config.options.Other.Auth) {
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
        console.log(-001, req.session.CheckFree);
        return next();
      }
    } else {
      console.log(893);
      return res.redirect('/');
    }
  } else {
    console.log(452);
    return res.redirect('/');
  }
};

app.get('/', function(req, res) {
  if (req.session.loggedin || !config.config.options.Other.Auth) {
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
app.get('/control', auth, function(req, res) {
  res.render('control');
});


app.post('/modal/Calendar/:ID', auth, async(req, res) => {
  console.log(req.body);
  if(req.params.ID) {
    const [results, fields] = await connection.promise().query(
      'SELECT * FROM ledtimes WHERE `enabled`=\"true\"');
    res.render('modal/Calendar', {"LEDS": results, Cron: CronJob, moment: moment, req: req});
  } else {
    console.log("?");
    res.send("?");
  }
});

app.post('/modal/NewEvent', auth, async(req, res) => {
  console.log(req.body);
  res.render('modal/NewEvent', {Cron: CronJob, moment: moment, req: req});
});

app.use('/api', auth, require("./routes/api"));

app.get('/test', async(req, res) => {
  Arduino.Brightness(6);
  res.send("f");
});

app.get('*', auth, function(req, res){
  // res.redirect("/home");
  res.send("404")
});

app.listen(3000);