const Sequelize = require('sequelize').Sequelize;
const sequelize = require("../dbConnection.js").sequelize;

const LookupCanceled = sequelize.define('lookup_canceled', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: Sequelize.literal('nextval(\'lookup_canceled_id_seq\'::regclass)'),
    primaryKey: true,
  },
  code: {
    type: Sequelize.INTEGER,
    allowNull: false,
    unique: true,
  },
  name: {
    type: Sequelize.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'lookup_canceled',
  timestamps: false,
});

module.exports = {LookupCanceled};
