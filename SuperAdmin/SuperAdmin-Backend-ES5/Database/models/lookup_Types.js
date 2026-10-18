const DataTypes = require('sequelize').DataTypes;
const sequelize = require('../dbConnection.js').sequelize;

const lookup_Types = sequelize.define('lookup_Types', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  code: {
    type: DataTypes.INTEGER,
  },
  Add_types: {
    type: DataTypes.STRING(255),
  },
  supscription: {
    type: DataTypes.DOUBLE,
  },
  added_value: {
    type: DataTypes.DOUBLE,
  },
  card_fee: {
    type: DataTypes.DOUBLE,
  },
  value_added_tax: {
    type: DataTypes.DOUBLE,
  },
  total_amount: {
    type: DataTypes.DOUBLE,
  },
  Expired_date: {
    type: DataTypes.DATEONLY,
  }
}, {
  timestamps: false,
});

module.exports = {lookup_Types};
