const { LookupMemberRef } = require('./lookup_ref.js');

const DataTypes = require('sequelize').DataTypes;
const sequelize = require('../dbConnection.js').sequelize;

// Define the PricingRule model
const PricingRule = sequelize.define('PricingRule', {
  id: {
    autoIncrement: true,
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'name'
  },
  minAge: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'min_age'
  },
  maxAge: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'max_age'
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_deleted'
  },
  code:{
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'code'
  },
  refId:{
    type: DataTypes.INTEGER,
    allowNull: true,
    field:'refId'
  }
}, {
  tableName: 'pricing_rules',
  schema: 'public',
  timestamps: false
});

// Export the model
PricingRule.belongsTo(LookupMemberRef, { foreignKey: 'refId', as: 'ref' });
LookupMemberRef.hasMany(PricingRule, { foreignKey: 'refId' });

module.exports = {PricingRule};
