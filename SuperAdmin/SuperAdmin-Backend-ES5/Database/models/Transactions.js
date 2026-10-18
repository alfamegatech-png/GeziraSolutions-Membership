const { DataTypes } = require('sequelize');
const sequelize = require('../dbConnection.js').sequelize;

const Transactions = sequelize.define(
  'Transactions',
  {
    Id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    SafeNumber: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    CreateBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    CreateAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    CancelBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    CancelAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    Canceled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    ReceiptNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    CreateByMembershipUser: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    CancelByMembershipUser: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    schema: 'clubtheclub',
    tableName: 'Transactions',
    timestamps: false,
  }
);

module.exports = Transactions;
