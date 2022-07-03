'use strict';

const {
  Model,
  DataTypes
} = require('sequelize');
module.exports = (sequelize) => {
  class blockedruns extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  blockedruns.init({
    JobID: {
      allowNull: false,
      type: DataTypes.INTEGER
    },
    Time: {
      allowNull: false,
      type: DataTypes.STRING
    },
  }, {
    sequelize,
    modelName: 'blockedruns',
  });
  return blockedruns;
};