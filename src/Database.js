var fs = require('fs');
var path = require('path');

require('console-stamp')(console, '[HH:MM:ss.l]');

var mysql = require('mysql2');

const {config} = require('./ConfigManager.js');

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
	host     : config.get().DB.hostname,
	user     : config.get().DB.user,
	password : config.get().DB.password,
	database : config.get().DB.database,
	waitForConnections: true,
	queueLimit: 0,
});

module.exports = {
    connection,
	Queue,
	DBStatus
}
