const DataTypes = require('sequelize').DataTypes;
const sequelize = require("../dbConnection.js").sequelize;

const lookupNationality = sequelize.define('lookupNationality', {
  id: {
    autoIncrement: true,
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  code: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true // Assuming code uniqueness based on the original indexes
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'lookup_nationality',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "lookup_nationality_code_key",
      unique: true,
      fields: [
        { name: "code" },
      ]
    },
    {
      name: "lookup_nationality_pkey",
      unique: true,
      fields: [
        { name: "id" },
      ]
    },
  ]
});

module.exports = {lookupNationality};
