var path = require('path');

const Sequelize = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
var mysql = require('mysql2');

const {config} = require('../ConfigManager.js');
const utils = require("../utils");

var models = require("./models");

const sequelize = models.sequelize;

var connection = mysql.createPool({
	host     : config.get().DB.hostname,
	user     : config.get().DB.user,
	password : config.get().DB.password,
	database : config.get().DB.database,
	waitForConnections: true,
	queueLimit: 0
});

const umzug = new Umzug({
	migrations: { glob: 'src/Database/migrations/*.js' },
	context: sequelize.getQueryInterface(),
	storage: new SequelizeStorage({ sequelize }),
	logger: console,
});


(async () => {
	try {
		await umzug.up();
	} catch (error) {
		console.log(error);
	}
})();

async function init() {
	if(await models.accounts_model.count() == 0) {
		await models.accounts_model.create({
			token: "yduehg",
			username: "example",
			password: "example",
			email: "example@example.com"
		});
	}
	if(await models.ledtimes_model.count() == 0) {
		await models.ledtimes_model.create({
			Name: "Night time",
			CronTime: "0 0 0 * * *",
			enabled: false,
			Brightness: 0
		});
	}
}

setTimeout(() => {
	init();
}, 5000);


module.exports = {
    connection,
	seq: sequelize,
	sequelize,
	models
}