const fs = require('fs');
var convict = require('convict');
var path = require('path');


var path2 = path.resolve(__dirname+"/..");
var config = convict(path2+"/config-schema.json");

const merge = require("deepmerge");

var { DeleteFromValue, overwriteMerge } = require('./utils');

var path2 = path.resolve(__dirname+"/..");


/* Save the (new) config to the file */
function save(conf = config, JSON_Conf = JSON.parse(conf.toString()), PreFormated = false) {
	if(!PreFormated) {
		JSON_Conf = DeleteFromValue(JSON_Conf, "[Sensitive]");
		JSON_Conf = merge(conf.getFileContent, JSON_Conf, {
			arrayMerge: overwriteMerge,
		});
	}
	fs.writeFile(path2+'/config.json', JSON.stringify(JSON_Conf, null, 2), function (err) {
		if (err) console.error(err);
		conf.reload;
	});
};

/* Set a setting and save to file */
function setSave(option, value, conf = config) {
    var ConfObj = DeleteFromValue(conf.toString(), "[Sensitive]");
    var ConfCurrent = conf.getFileContent;
    ConfObj = merge(ConfCurrent, ConfObj, {
        arrayMerge: overwriteMerge,
    });

	fs.writeFile(path2+'/config.json', JSON.stringify(ConfObj, null, 2), function (err) {
		if (err) console.warn(err);
		conf.reload;
	});
};

/* Set a setting */
function set(option, value, conf = config) {
	conf.set(option, value);
    var newConf = DeleteFromValue(conf.toString(), "[Sensitive]");
    var oldConf = conf.getFileContent;
    newConf = merge(oldConf, newConf, {
        arrayMerge: overwriteMerge,
    });
	
	conf.getFileContent = newConf;
};


/* Reinitialize the config */
function reload(conf = config, file = '/config.json') {
	conf.loadFile(path2+file);
	try {
		conf.getFileContent = JSON.parse(fs.readFileSync(path2+'/config.json'));
	} catch (err) {
		console.warn("There was a error while parsing the config file, Trying another method. ", err);
		var Conf = DeleteFromValue(conf.toString(), "[Sensitive]");
		Conf["WARN"] = ["No Sensitive"];
		conf.getFileContent = Conf;
	}
}

var config = convict(path2+"/config-schema.json");

config.loadFile(path2+'/config.json');
config.validate();

// config.set = set(config, this);
config.save = save;
config.setSave = setSave
config.reload = reload
config.reload(config, '/config.json');



var arduinoConfig = convict({
    "SerialPort": {
        "doc": "The port of the Serialbind. Use null for automatic detection",
        "format": "*",
        "default": null,
        "env": "SERIAL",
        "arg": "serial",
        "nullable": true
    },
    "LEDs": {
        "Single": {
            "doc": "Define the command used to control the LED",
            "format": "Array",
            "default": []
        },
        "RGB": {
            "doc": "Define the command used to control that RGB LED",
            "format": "Array",
            "default": []
        }
    }
});


// arduinoConfig.set = set(config, this);
arduinoConfig.save = save;
arduinoConfig.setSave = setSave
arduinoConfig.reload = reload
arduinoConfig.reload(arduinoConfig, '/Settings/arduino.json');


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
	arduinoConfig,
	AppCache, ReloadAppCache
}