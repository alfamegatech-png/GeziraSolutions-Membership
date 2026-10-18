const { DataTypes } = require("sequelize");
const sequelize = require("../dbConnection.js").sequelize;

const GroupMembersDiscount = sequelize.define(
  "GroupMembersDiscount",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
      comment: "Primary key",
    },
    From: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "The minimum number of members to apply the discount",
    },
    To: {
      type: DataTypes.INTEGER,
      allowNull: true, 
      comment: "The maximum number of members to apply the discount (nullable)",
    },
    Discount: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: "Discount percentage applied when the member count falls within the range",
    },
  },
  {
    sequelize,
    tableName: "group_members", 
    schema: "public",
    timestamps: false,
   
  }
);

module.exports = GroupMembersDiscount;
