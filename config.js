const fs = require('fs');

const config = {
	options: {},
	set new(name) {
		this.options = name;
	},
};

function ReloadConfig() {
    let rawdata = fs.readFileSync('./config.json');
    config.new = JSON.parse(rawdata);
}



ReloadConfig();
module.exports = { config, ReloadConfig }