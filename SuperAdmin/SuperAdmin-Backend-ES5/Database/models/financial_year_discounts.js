const { DataTypes } = require("sequelize");
const sequelize = require("../dbConnection.js").sequelize;

const FinancialYearDiscount = sequelize.define(
  "FinancialYearDiscount",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: true,
      primaryKey: true,
    },
    financial_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      comment: "The financial year for the discount",
    },
    discount_percentage: {
      type: DataTypes.DECIMAL,
      allowNull: false,
      comment: "Discount percentage for this financial year",
    },
  },
  {
    sequelize,
    tableName: "financial_year_discounts",
    schema: "public",
    timestamps: false,
    indexes: [
      {
        name: "idx_financial_year_discounts_id",
        unique: true,
        fields: [{ name: "id" }],
      },
      {
        name: "idx_financial_year_discounts_year",
        unique: true,
        fields: [{ name: "financial_year" }],
      },
    ],
  }
);

module.exports = FinancialYearDiscount;
