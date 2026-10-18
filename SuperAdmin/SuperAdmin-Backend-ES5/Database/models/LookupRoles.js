const DataTypes = require('sequelize').DataTypes;
const sequelize = require('../dbConnection.js').sequelize;

const LookupRoles = sequelize.define(
  'LookupRoles',
  {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  { timestamps: false }
);

module.exports = {LookupRoles};
