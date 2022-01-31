'use strict';

const { Sequelize } = require('sequelize');

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.createTable('accounts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      token: {
        type: Sequelize.STRING,
        field: "token"
      },
      username: {
        type: Sequelize.STRING,
        field: "username",
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        field: "password"
      },
      email: {
        type: Sequelize.STRING,
        field: "email",
        unique: true
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