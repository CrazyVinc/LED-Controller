var path = require('path');
const { log } = require('console');

var mysql = require('mysql2');

var express = require('express');
var session = require('express-session');
let ejs = require('ejs');
var bodyParser = require('body-parser');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const Ready = require('@serialport/parser-ready')

var CronJob = require('cron');
var CronVerify = require('cron-validate');

const { uuid } = require('uuidv4');

const Arduino = require("./src/ArduinoController");
const {connection} = require("./src/Database");
const CronJobs = require("./src/CronJobs");
const { verify } = require('crypto');

var config = require('./config');


var app = express();
app.set('view engine', 'ejs');
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());

app.use('/assets', express.static('assets'));
// Authentication and Authorization Middleware
var auth = async (req, res, next) => {
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
  if (req.session.loggedin) {
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

app.get('/home', auth, function(req, res) {
  res.render('home');
});

app.get('/new/DateTime', auth, function(req, res) {
  res.render('new/DateTime');
});

app.get('/new/range', auth, function(req, res) {
  res.render('new/range');
});

app.get('/new/CronJob', auth, function(req, res) {
  res.render('new/CronJob');
});
app.get('/Settings', auth, function(req, res) {
  res.render('settings');
});

app.post('/api/VerifyCron', auth, function(req, res) {
  var Verify = CronVerify(req.body.CronTime, {
    preset: 'npm-node-cron',
  });
  console.log(Verify);
  res.send(Verify);
});

app.get('/api/GetDates', auth, async(req, res) => {
  const [results, fields] = await connection.promise().query(
    'SELECT * FROM ledtimes');
    res.send(results);
});


app.get('/test', async(req, res) => {
  Arduino.Brightness(6);
  res.send("f");
});

app.get('*', auth, function(req, res){
  res.redirect("/home");
});

app.listen(3000);