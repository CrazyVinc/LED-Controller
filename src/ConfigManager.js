const fs = require('fs');
var convict = require('convict');
var config = convict("./config-schema.json");
config.loadFile('./config.json');
config.validate();

config.save = function() {
	fs.writeFile('config.json', config.toString(), function (err) {
		if (err) console.warn(err);
	});
};
config.saveSet = function() {
	fs.writeFile('config.json', config.toString(), function (err) {
		if (err) console.warn(err);
	});
};

config.reload = function() {
	config.loadFile('./config.json');
}

config.SaveReload = function() {
	fs.writeFile('config.json', config.toString(), function (err) {
		if (err) console.warn(err);
		config.loadFile('./config.json');
	});
}
//config.save();
const AutoUpdater = {
	options: {},
	set new(name) {
		this.options = name;
	},
};

function ReloadUpdater() {
    let rawdata = fs.readFileSync('./AutoUpdater.json');
    AutoUpdater.new = JSON.parse(rawdata);
}

ReloadUpdater();
module.exports = {
	config,
	AutoUpdater, ReloadUpdater
}