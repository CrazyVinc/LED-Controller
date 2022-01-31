'use strict';

const { Sequelize } = require('sequelize');

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.createTable('events', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Name: {
        type: Sequelize.STRING,
        field: "Name",
        unique: "Name"
      },
      enable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "enable"
      },
      criteria: {
        type: Sequelize.INTEGER(11),
        allowNull: false,
        defaultValue: "0",
        field: "criteria"
      },
      cmds: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: "cmds"
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