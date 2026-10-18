const { DataTypes } = require('sequelize');
const sequelize = require('../dbConnection.js').sequelize;

const AccountNumbers = sequelize.define(
  'AccountNumbers',
  {
    Id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    Name: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
  },
  {
    schema: 'clubtheclub',
    tableName: 'AccountNumbers',
    timestamps: false,
  }
);

module.exports = AccountNumbers;
