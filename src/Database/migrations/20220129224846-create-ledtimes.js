'use strict';

const { Sequelize } = require('sequelize');

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.createTable('ledtimes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Name: {
        type: Sequelize.TEXT,
        field: "Name"
      },
      CronTime: {
        type: Sequelize.STRING(50),
        field: "CronTime"
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "enabled"
      },
      Color: {
        type: Sequelize.STRING(50),
        allowNull: true,
        field: "Color"
      },
      RGB: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: null,
        primaryKey: false,
        autoIncrement: false,
        comment: null,
        field: "RGB"
      },
      TMPColor: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Used for IR Leds",
        field: "TMPColor"
      },
      Brightness: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        defaultValue: "2",
        field: "Brightness"
      },
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "cron",
        field: "type"
      },
      LedStrip: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: "*",
        field: "LedStrip"
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