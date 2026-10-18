const Sequelize = require('sequelize').Sequelize;
const DataTypes = require('sequelize').DataTypes;
const sequelize = require("../dbConnection.js").sequelize;

const MembershipFeeRules = sequelize.define('membership_fee_rules', {
  id: {
    autoIncrement: true,
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  start_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  end_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  fee_percentage: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },  manager_grace_days : {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

}, {
  tableName: 'membership_fee_rules',
  schema: 'public',
  timestamps: false,
  
});

module.exports = {MembershipFeeRules};
