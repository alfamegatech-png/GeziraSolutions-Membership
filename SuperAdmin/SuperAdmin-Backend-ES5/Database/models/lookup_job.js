const DataTypes = require('sequelize').DataTypes;
const _Sequelize = require('sequelize').Sequelize;
const sequelize = require("../dbConnection.js").sequelize;

const LookupMemberJob = sequelize.define('lookup_job', {
  id: {
    autoIncrement: true,
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  code: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  tableName: 'lookup_job',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "lookup_job_code_key",
      unique: true,
      fields: [
        { name: "code" },
      ]
    },
    {
      name: "lookup_job_pkey",
      unique: true,
      fields: [
        { name: "id" },
      ]
    },
  ]
});

module.exports = {LookupMemberJob};
