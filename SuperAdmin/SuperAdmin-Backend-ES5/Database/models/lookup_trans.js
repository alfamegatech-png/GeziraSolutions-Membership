const DataTypes = require('sequelize').DataTypes;
const sequelize = require('../dbConnection.js').sequelize;

const lookupTrans = sequelize.define(
  'lookupTrans',
  {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    code: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true, // Assuming the requirement for 'code' to be unique based on the index
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // IsDead: {
    //   type: DataTypes.BOOLEAN,
    //   allowNull: true,
    // },
    // IsSeperated: {
    //   type: DataTypes.BOOLEAN,
    //   allowNull: true,
    // },
  },
  {
    tableName: 'lookup_trans',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: 'lookup_trans_code_key',
        unique: true,
        fields: [{ name: 'code' }],
      },
      {
        name: 'lookup_trans_pkey',
        unique: true,
        fields: [{ name: 'id' }],
      },
    ],
  }
);

module.exports = {lookupTrans};
