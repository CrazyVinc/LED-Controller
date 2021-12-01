var path = require('path');
const { log } = require('console');

require('console-stamp')(console, '[HH:MM:ss.l]');

var mysql = require('mysql2');

var express = require('express');
var session = require('express-session');
let ejs = require('ejs');
var bodyParser = require('body-parser');

const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const Ready = require('@serialport/parser-ready')

var CronJob = require('cron');

const { uuid } = require('uuidv4');
const config = require('../config.js');


const DBStatus = {
	status: {},
	set update(name) {
		this.status = name;
	},
};
const Queue = {
	Queue: {},
	set new(name) {
		this.new = name;
	},
};

var connection = mysql.createPool({
	host     : '192.168.1.253',
	user     : 'root',
	password : 'vlg',
    waitForConnections: true,
	database : 'ledcontroller',
	queueLimit: 0,
});

module.exports = {
    connection,
	Queue,
	DBStatus
}