'use strict';

const { Sequelize } = require('sequelize')
const useBcrypt = require('sequelize-bcrypt');

// var salt = bcrypt.genSaltSync(12);
// var password = bcrypt.hashSync(msg.password, salt);
module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.addColumn('accounts', 'meta', {
      type: Sequelize.JSON(),
      allowNull: true,
      defaultValue: "{}"
    });
    await queryInterface.addColumn('accounts', 'active', {
      type: Sequelize.BOOLEAN(),
      allowNull: true,
      defaultValue: true
    });
    await queryInterface.addColumn('accounts', 'last_login', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.changeColumn(
      'ledtimes',
      'CronTime',
      {
        type: Sequelize.STRING(255)
      }
    );

    await queryInterface.changeColumn(
      'ledtimes',
      'LedStrip',
      {
        type: Sequelize.JSON(),
        defaultValue: []
      }
    );
  },
  async down(queryInterface, Sequelize) {
  }
};