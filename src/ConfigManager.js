const fs = require('fs');
var convict = require('convict');
var path = require('path');

var path2 = path.resolve(__dirname+"/..");
var config = convict(path2+"/config-schema.json");
config.loadFile(path2+'/config.json');
config.validate();

/* Save a new config object */
config.save = function(obj) {
	config.load(obj);
	config.validate();
	fs.writeFile(path2+'/config.json', JSON.stringify(obj, null, 2), function (err) {
		if (err) console.warn(err);
	});
	config.reload;
};

/* Reload the config */
config.reload = function() {
	config.loadFile(path2+'/config.json');
	config.getFileContent = fs.readFileSync(path2+'/config.json');
}

const AutoUpdater = {
	options: {},
	set new(name) {
		this.options = name;
	},
};

config.getFileContent = fs.readFileSync(path2+'/config.json');

function ReloadUpdater() {
    let rawdata = fs.readFileSync(path2+'/AutoUpdater.json');
    AutoUpdater.new = JSON.parse(rawdata);
}

ReloadUpdater();
module.exports = {
	config,
	AutoUpdater, ReloadUpdater
}