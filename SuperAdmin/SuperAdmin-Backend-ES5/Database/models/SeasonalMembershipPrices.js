const { DataTypes } = require("sequelize");
const sequelize = require("../dbConnection.js").sequelize;

const SeasonalMembershipPrices = sequelize.define(
  "SeasonalMembershipPrices",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    relation: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "lookup_relation",
        key: "code",
      },
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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
    tableName: "seasonal_membership_prices",
    schema: "public",
    timestamps: false,
    indexes: [
      {
        name: "idx_seasonal_membership_prices_id",
        unique: true,
        fields: ["id"],
      },
    ],
  }
);

SeasonalMembershipPrices.associate = (models) => {
  SeasonalMembershipPrices.belongsTo(models.LookupRelation, {
    foreignKey: "relation",
    targetKey: "code",
    as: "relation_info"
  });
};

module.exports = SeasonalMembershipPrices;
