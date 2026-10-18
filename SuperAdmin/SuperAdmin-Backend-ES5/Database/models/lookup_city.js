const DataTypes = require('sequelize').DataTypes;
const sequelize = require("../dbConnection.js").sequelize;

const lookupCity = sequelize.define('lookupCity', {
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
  tableName: 'lookup_city',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "lookup_city_code_key",
      unique: true,
      fields: [
        { name: "code" },
      ]
    },
    {
      name: "lookup_city_pkey",
      unique: true,
      fields: [
        { name: "id" },
      ]
    },
  ]
});

module.exports = {lookupCity};
