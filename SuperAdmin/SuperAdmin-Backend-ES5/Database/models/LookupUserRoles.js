const DataTypes = require('sequelize').DataTypes;
const sequelize = require('../dbConnection.js').sequelize;
const LookupRoles = require('./LookupRoles.js');
const User = require('./user.js');

const LookupUserRoles = sequelize.define(
  'LookupUserRoles',
  {
    UserID: {
      type: DataTypes.TEXT,
      allowNull: false,
      primaryKey: true,
      references: {
        model: User,
        key: 'id',
      },
    },
    RoleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: LookupRoles,
        key: 'id',
      },
    },
  },
  { timestamps: false }
);

// LookupUserRoles.belongsTo(LookupRoles, { foreignKey: 'id' ,targetKey: 'RoleId',as:'UserRole'})
// LookupUserRoles.belongsTo(User, { foreignKey: 'id' ,targetKey: 'UserID',as:'UserId'})

module.exports = {LookupUserRoles};
