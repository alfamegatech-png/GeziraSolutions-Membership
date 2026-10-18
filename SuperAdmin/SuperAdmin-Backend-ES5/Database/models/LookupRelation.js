const { DataTypes } = require("sequelize");
const sequelize = require("../dbConnection.js").sequelize;

const LookupRelation = sequelize.define(
  "LookupRelation",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "lookup_relation",
    schema: "public",
    timestamps: false,
    indexes: [
      {
        name: "idx_lookup_relation_id",
        unique: true,
        fields: ["id"],
      },
      {
        name: "idx_lookup_relation_code",
        unique: true,
        fields: ["code"],
      },
    ],
  }
);

// Association
LookupRelation.associate = (models) => {
  LookupRelation.hasMany(models.SeasonalMembershipPrices, {
    foreignKey: "relation",
    sourceKey: "code",
    as: "seasonal_prices"
  });
};


module.exports = LookupRelation;
