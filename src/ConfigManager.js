const fs = require('fs');
var convict = require('convict');
var path = require('path');

var path2 = path.resolve(__dirname+"/..");
var config = convict(path2+"/config-schema.json");
config.loadFile(path2+'/config.json');
config.validate();

config.save = function() {
	fs.writeFile(path2+'/config.json', config.toString(), function (err) {
		if (err) console.warn(err);
	});
};
config.saveSet = function() {
	fs.writeFile(path2+'/config.json', config.toString(), function (err) {
		if (err) console.warn(err);
	});
};

config.reload = function() {
	config.loadFile(path2+'/config.json');
}

config.SaveReload = function() {
	fs.writeFile(path2+'/config.json', config.toString(), function (err) {
		if (err) console.warn(err);
		config.loadFile(path2+'/config.json');
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
    let rawdata = fs.readFileSync(path2+'/AutoUpdater.json');
    AutoUpdater.new = JSON.parse(rawdata);
}

ReloadUpdater();
module.exports = {
	config,
	AutoUpdater, ReloadUpdater
}