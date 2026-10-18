

const { LookupRoles } = require("./LookupRoles");
const { LookupUserRoles } = require("./LookupUserRoles");
const { User } = require("./user");
const Transactions = require('./Transactions');
const Transaction_AccountNumbers = require('./Transaction_AccountNumbers');
const AccountNumbers = require('./AccountNumbers');
const SeasonalMembershipPrices = require("./SeasonalMembershipPrices");
const LookupRelation = require("./LookupRelation");




LookupRoles.hasMany(LookupUserRoles, { foreignKey: "RoleId", as: "Roles" });
LookupUserRoles.belongsTo(LookupRoles, { foreignKey: "RoleId", as: "Role" });

User.hasMany(LookupUserRoles, { foreignKey: "UserID" });
LookupUserRoles.belongsTo(User, { foreignKey: "UserID", as: "User" });





Transactions.hasMany(Transaction_AccountNumbers, { foreignKey: 'TransactionId' });
Transaction_AccountNumbers.belongsTo(Transactions, { foreignKey: 'TransactionId' });

AccountNumbers.hasMany(Transaction_AccountNumbers, { foreignKey: 'AccountNumberId' });
Transaction_AccountNumbers.belongsTo(AccountNumbers, { foreignKey: 'AccountNumberId' });

SeasonalMembershipPrices.belongsTo(LookupRelation, {
  foreignKey: "relation",
  targetKey: "code",
  as: "relation_info"
});
LookupRelation.hasMany(SeasonalMembershipPrices, {

  foreignKey: "relation",
  sourceKey: "code",
  as: "seasonal_prices"
});





module.exports = {
  LookupRoles: LookupRoles,
  LookupUserRoles: LookupUserRoles,
  User: User,
  lookupRelation: LookupRelation,
  SeasonalMembershipPrices: SeasonalMembershipPrices,
};
