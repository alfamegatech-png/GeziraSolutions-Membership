const { DataTypes } = require('sequelize');
const sequelize = require('../dbConnection.js').sequelize;

const Transaction_AccountNumbers = sequelize.define(
  'Transaction_AccountNumbers',
  {
    AccountNumberId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'AccountNumbers',
        key: 'Id',              
      },
      onUpdate: 'NO ACTION',
      onDelete: 'CASCADE',
    },
    TransactionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true, 
      references: {
        model: 'Transactions',
        key: 'Id',           
      },
      onUpdate: 'NO ACTION',
      onDelete: 'CASCADE',
    },
    Money: {
      type: DataTypes.DOUBLE, 
      allowNull: false,
    },
  },
  {
    schema: 'clubtheclub',
    tableName: 'Transaction_AccountNumbers',
    timestamps: false, 
    indexes: [
      {
        fields: ['TransactionId'],
        using: 'BTREE',
      },
    ],
  }
);

module.exports = Transaction_AccountNumbers;
