const Sequelize = require('sequelize').Sequelize;
const DataTypes = require('sequelize').DataTypes;
const sequelize = require("../dbConnection.js").sequelize;

const LookupArea = sequelize.define('lookup_area', {
  id: {
    autoIncrement: true,
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  code: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'lookup_area',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "lookup_area_code_key",
      unique: true,
      fields: [
        { name: "code" },
      ]
    },
    {
      name: "lookup_area_pkey",
      unique: true,
      fields: [
        { name: "id" },
      ]
    },
  ]
});

module.exports = {LookupArea};
