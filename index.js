var mysql = require('mysql2');
var express = require('express');
var session = require('express-session');
let ejs = require('ejs');
var bodyParser = require('body-parser');
var cron = require('node-cron');
var path = require('path');
const { uuid } = require('uuidv4');


var connection = mysql.createConnection({
	host     : '192.168.1.253',
	user     : 'root',
	password : 'vlg',
	database : 'ledcontroller'
});

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

app.get('/new', auth, function(req, res) {
  res.render('New');
});

app.get('/new/range', auth, function(req, res) {
  res.render('New');
});

app.get('/api/GetDates', auth, async(req, res) => {
  const [results, fields] = await connection.promise().query(
    'SELECT * FROM ledtimes');
    res.send(results);
});

app.listen(3000);













const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const { log } = require('console');

const ArduinoPort = new SerialPort('COM3',{ baudRate : 9600 }  );


const parser = new Readline();
ArduinoPort.pipe(parser);

// read data  
parser.on('data', console.log);

// write data 
// setTimeout(function() {
//     ArduinoPort.write("color sky\n");
// }, 2000);

















function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}



var CronTimer = "*/5 * * * * * ";
var LED;
var DelaySleep = 50;
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms || DEF_DELAY));
  }
connection.query("SELECT * FROM `ledtimes` WHERE `Name` =\"active\" AND `enabled`=\"true\" LIMIT 1", function(err, rows, fields) {
    console.log(rows[0].CronTime);
    LED = cron.schedule(rows[0].CronTime, async() => {
        console.log('Running a job at 01:00 at America/Sao_Paulo timezone');
        
        ArduinoPort.write("power on\n");
        console.log(138);
        await sleep(30);
        ArduinoPort.write("color red\n");
        console.log(141);
        await sleep(DelaySleep);
        ArduinoPort.write("bright down\n");
        console.log(144);
        await sleep(DelaySleep);
        ArduinoPort.write("bright down\n");
        console.log(147);
        await sleep(DelaySleep);
        ArduinoPort.write("bright down\n");
        console.log(150);
        await sleep(DelaySleep);
        ArduinoPort.write("bright down\n");
        console.log(153);
        await sleep(DelaySleep);
        ArduinoPort.write("bright down\n");
        console.log(156);
        await sleep(DelaySleep);
        ArduinoPort.write("bright down\n");
        console.log(159);
        await sleep(DelaySleep);
        ArduinoPort.write("bright down\n");
        console.log(162);
        await sleep(DelaySleep);
        ArduinoPort.write("bright up\n");
        console.log(165);
        
        await sleep(DelaySleep);
        ArduinoPort.write("color Sky\n");
        console.log(169);
        await sleep(DelaySleep);
        console.log('ready');
    });
    LED.start();
})