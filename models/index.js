 'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);

const {config} = require('../src/ConfigManager.js');

const options= {
	dialect: 'mysql',
	define: { underscoredAll: true },
  logging: false
}
const sequelize = new Sequelize(config.get().DB.database, config.get().DB.user, config.get().DB.password, {
	host     : config.get().DB.hostname,
	...options
});
const db = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if(db[modelName].associate) {
    db[modelName].associate(db);
  }
});


db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;