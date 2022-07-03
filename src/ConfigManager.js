const fs = require('fs');
var convict = require('convict');
var path = require('path');

var path2 = path.resolve(__dirname+"/..");
var config = convict(path2+"/config-schema.json");

const merge = require("deepmerge");

var { DeleteFromValue, overwriteMerge } = require('./utils');

config.loadFile(path2+'/config.json');
config.getFileContent = fs.readFileSync(path2+'/config.json', 'utf8');

/* Save a new config object */
function save(conf = config, PreFormated = false) {
	console.log(conf.getFileContent, -48)
	if(!PreFormated) {
		var JSON_Conf = DeleteFromValue(JSON.parse(conf.toString()), "[Sensitive]");
		JSON_Conf = merge(JSON.parse(conf.getFileContent), JSON_Conf, {
			arrayMerge: overwriteMerge,
		});
	}
	fs.writeFile(path2+'/config.json', JSON.stringify(JSON_Conf, null, 2), 'utf8', function (err) {
		if (err) console.error(err);
		// config.reload;
	});
};

config.save = save

/* Reload the config */
config.reload = function() {
	config.loadFile(path2+'/config.json');
	config.getFileContent = fs.readFileSync(path2+'/config.json', 'utf8');
}




const AppCache = {
	options: {
		version: {}
	},
	get cache() {
		return this.options;
	},
	set cache(val) {
		this.options = val;
	},
	set new(val) {
		this.options = val;
		
		fs.writeFileSync(`${path2}/data/cache/app.json`, JSON.stringify(val));
	},
};

try {
	if (fs.existsSync(`${path2}/data/cache/app.json`)) {
		AppCache.new = JSON.parse(fs.readFileSync(path2+'/data/cache/app.json'));
	} else {
		AppCache.new = {};
	}
} catch (error) {
	AppCache.new = {};
	console.error(error);
}


function ReloadAppCache() {
    let rawdata = fs.readFileSync(path2+'/data/cache/app.json');
    AppCache.new = JSON.parse(rawdata);
}

module.exports = {
	config,
	AppCache, ReloadAppCache
}