const { User } = require('./associations.js');
const { MemberRef } = require('./member_ref.js');
const { Member } = require('./members.js');

const DataTypes = require('sequelize').DataTypes;
const _Sequelize = require('sequelize').Sequelize;
const sequelize = require("../dbConnection.js").sequelize;


const History = sequelize.define('history', {
  id: {
    autoIncrement: true,
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  member_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  changed_fields: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false
  },
  last_values: {
    type: DataTypes.ARRAY(DataTypes.JSONB),
    allowNull: false
  },
  time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  tableName: 'history',
  schema: 'public',
  timestamps: false,
  indexes: [
    {
      name: "idx_history_id",
      unique: true,
      fields: [
        { name: "id" },
      ]
    },
    {
      name: "idx_history_user_id",
      fields: [
        { name: "user_id" },
      ]
    },
    {
      name: "idx_history_action",
      fields: [
        { name: "action" },
      ]
    },
    {
      name: "idx_history_member_id",
      fields: [
        { name: "member_id" },
      ]
    },
    {
      name: "idx_history_changed_fields",
      fields: [
        { name: "changed_fields" },
      ]
    },
    {
      name: "idx_history_last_values",
      fields: [
        { name: "last_values" },
      ]
    },
    {
      name: "idx_history_time",
      fields: [
        { name: "time" },
      ]
    }
  ]
});

// Associations
History.belongsTo(Member, { foreignKey: 'member_id', targetKey: 'id', as: 'Member' });
History.belongsTo(MemberRef, { foreignKey: 'member_id', targetKey: 'id', as: 'MemberRef' });
History.belongsTo(User, { foreignKey: 'user_id', targetKey: 'id', as: 'users' });

module.exports = History;
