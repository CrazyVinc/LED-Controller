const {
  DataTypes
} = require('sequelize');

module.exports = sequelize => {
  const attributes = {
    ID: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: null,
      primaryKey: true,
      autoIncrement: true,
      comment: null,
      field: "ID"
    },
    Name: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "Name"
    },
    CronTime: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "CronTime"
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "enabled"
    },
    Color: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "Color"
    },
    RGB: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "RGB"
    },
    TMPColor: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: "Used for IR Leds",
      field: "TMPColor"
    },
    Brightness: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      defaultValue: "2",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "Brightness"
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "cron",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "type"
    },
    LedStrip: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "*",
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "LedStrip"
    },
    cmd: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      field: "cmd"
    }
  };
  const options = {
    tableName: "ledtimes",
    comment: "",
    indexes: []
  };
  const LedtimesModel = sequelize.define("ledtimes_model", attributes, options);
  return LedtimesModel;
};