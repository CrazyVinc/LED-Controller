'use strict';

const { Sequelize } = require('sequelize');

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.createTable('ledlog', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      LedID: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        primaryKey: false,
        autoIncrement: false,
        comment: null,
        field: "LedID"
      },
      When: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('current_timestamp'),
        primaryKey: false,
        autoIncrement: false,
        comment: null,
        field: "When"
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
  }
};