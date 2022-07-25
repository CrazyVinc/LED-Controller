'use strict';

const { Sequelize } = require('sequelize');

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.changeColumn(
      'ledtimes',
      'Brightness',
      {
        type: Sequelize.INTEGER(11),
        allowNull: true,
        defaultValue: "2",
        field: "Brightness"
      }
    );
    await queryInterface.addColumn('ledtimes', 'cmd', Sequelize.JSON());
  },
  async down(queryInterface, Sequelize) {
  }
};