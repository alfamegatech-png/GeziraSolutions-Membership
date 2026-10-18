const Sequelize = require('sequelize').Sequelize;
const sequelize = require("../dbConnection.js").sequelize;

const LookupMemberType = sequelize.define('lookup_member_type', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: Sequelize.literal('nextval(\'lookup_member_type_id_seq\'::regclass)'),
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
  price: {
    type: Sequelize.INTEGER,
  },
}, {
  tableName: 'lookup_member_type',
  timestamps: false,
  schema: 'public', // Replace with the actual schema name

});

module.exports = {LookupMemberType};
