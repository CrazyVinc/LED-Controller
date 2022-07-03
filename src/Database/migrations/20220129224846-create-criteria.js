'use strict';

const { Sequelize } = require('sequelize');

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.createTable('criteria', {
      ID: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Name: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: null,
        primaryKey: false,
        autoIncrement: false,
        comment: null,
        field: "Name",
        unique: "Name"
      },
      Enable: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        field: "Enable"
      },
      Type: {
        type: Sequelize.TEXT,
        field: "Type"
      },
      URL: {
        type: Sequelize.TEXT,
        field: "URL"
      },
      ResType: {
        type: Sequelize.TEXT,
        field: "ResType"
      },
      IF: {
        type: Sequelize.TEXT,
        field: "IF"
      },
      Recheck: {
        type: Sequelize.TEXT,
        field: "Recheck"
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
    // await queryInterface.dropTable('criteria');
  }
};