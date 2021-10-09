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
const Ready = require('@serialport/parser-ready')

const { log } = require('console');

const ArduinoPort = new SerialPort('COM3', {
  baudRate : 9600,
  autoOpen: true
});


const parser = ArduinoPort.pipe(new Readline({ delimiter: '\n' }))
// // ArduinoPort.pipe(parser);

// parser.on('ready', () => console.log('the ready byte sequence has been received'))
// parser.on('data', console.log);
ArduinoPort.on('open', () => console.log('yay the port is open!'))
ArduinoPort.on('error', () => console.log('boo we had an error!'))



function writeAndDrain (data) {
  return new Promise(function(resolve, reject) { 
    ArduinoPort.write(data, function () {
      console.log('message written' + data)
      parser.on('data', (data) => {
          resolve(data)
      })
    })
  });
}










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
var LEDJobTracking = {};
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms || DEF_DELAY));
  }
  
connection.query("SELECT * FROM `ledtimes` WHERE `Name` =\"active\" AND `enabled`=\"true\" LIMIT 1", function(err, rows, fields) {
    console.log(rows[0].CronTime);
    LEDJobTracking = rows[0];
    LED = cron.schedule(rows[0].CronTime, async() => {
        console.log('Running a job at 01:00 at America/Sao_Paulo timezone');
        await writeAndDrain("power on\n");
        await writeAndDrain("color red\n");
        await writeAndDrain("bright down\n");
        await writeAndDrain("bright down\n");
        await writeAndDrain("bright down\n");
        await writeAndDrain("bright down\n");
        await writeAndDrain("bright down\n");
        await writeAndDrain("bright down\n");
        await writeAndDrain("bright down\n");
        await writeAndDrain("bright up\n");
        await writeAndDrain("color sky\n");
        console.log('ready');
    });
    LED.start();
    if(err) {
      console.log(11231, err);
    }
})