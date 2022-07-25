const {
  DataTypes
} = require('sequelize');

const useBcrypt = require('sequelize-bcrypt');
module.exports = sequelize => {
  const attributes = {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      defaultValue: null,
      primaryKey: true,
      autoIncrement: true,
      comment: null,
      field: "id"
    },
    token: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "token"
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      unique: true,
      field: "username"
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      field: "password"
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: null,
      primaryKey: false,
      autoIncrement: false,
      comment: null,
      unique: true,
      field: "email"
    },
    meta: {
      type: DataTypes.JSON(),
      allowNull: true,
      defaultValue: {}
    },
    active: {
      type: DataTypes.BOOLEAN(),
      allowNull: true,
      defaultValue: true
    },
    meta: {
      type: DataTypes.JSON(),
      allowNull: true,
      defaultValue: {}
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    }
  };
  const options = {
    tableName: "accounts",
    comment: "",
    indexes: []
  };
  const AccountsModel = sequelize.define("accounts_model", attributes, options);
  useBcrypt(AccountsModel);
  
  return AccountsModel;
};