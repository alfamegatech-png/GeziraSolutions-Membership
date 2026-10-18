const { DataTypes } = require("sequelize");
const sequelize = require("../dbConnection.js").sequelize;

const SeasonalGroupDiscount = sequelize.define(
  "SeasonalGroupDiscount",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    discount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    selected_price_ids: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "seasonal_group_discount",
    schema: "public",
    timestamps: false,
    indexes: [
      {
        name: "idx_seasonal_group_discount_id",
        unique: true,
        fields: ["id"],
      },
    ],
  }
);

module.exports = SeasonalGroupDiscount;
