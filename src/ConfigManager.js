const fs = require('fs');

const config = {
	options: {},
	set new(name) {
		this.options = name;
	},
};

async function ReloadConfig() {
	let rawdata;
	rawdata = fs.readFileSync('./config.json');
	config.new = JSON.parse(rawdata);
}

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


ReloadConfig();
ReloadUpdater();
module.exports = {
	config, ReloadConfig,
	AutoUpdater, ReloadUpdater
}