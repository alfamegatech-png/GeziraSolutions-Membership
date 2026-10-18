const { Op, Sequelize } = require("sequelize");
const { SeasonalMembershipPrices, lookupRelation } = require("../../../Database/models/associations.js");
const SeasonalGroupDiscount = require("../../../Database/models/SeasonalGroupDiscount.js");
const AppError = require("../../utils/AppError.js").AppError;
const catchError = require("../../utils/Catch Error.js").catchError;

const getAllSeasonalMembershipPrices = catchError(async (req, res, next) => {
  const allPrices = await SeasonalMembershipPrices.findAll({
    where: {
      is_deleted: false,
    },
  include: [
      {
        model: lookupRelation,
        as: "relation_info",
        attributes: ["id", "code", "name"]
      }
    ],
    order: [["id", "DESC"]]
  });

  res.status(200).json({
    status: "success",
    count: allPrices.length,
    data: allPrices
  });
});
const getAllSeasonalGroupDiscount = catchError(async (req, res, next) => {
  const discounts = await SeasonalGroupDiscount.findAll({
    order: [["id", "DESC"]],
  });

  const allPrices = await SeasonalMembershipPrices.findAll({
    attributes: ["id", "price", "duration", "nationality", "currency", "relation"],
    where: {
      is_deleted: false,
    },
    include: [
      {
        model: lookupRelation,
        as: "relation_info",
        attributes: ["id", "code", "name"]
      }
    ]
  });

  const pricesMap = {};
  allPrices.forEach((p) => {
    pricesMap[p.id] = p;
  });

  const result = discounts.map((discount) => {
    const selectedPrices = discount.selected_price_ids
      .map((id) => pricesMap[id])
      .filter((p) => p); 

    return {
      id: discount.id,
      discount: discount.discount,
      description: discount.description,
      created_at: discount.created_at,
      updated_at: discount.updated_at,
      selectedPrices,
    };
  });

  res.status(200).json({
    status: "success",
    count: result.length,
    data: result,
  });
});


module.exports = {
  getAllSeasonalMembershipPrices,
  getAllSeasonalGroupDiscount,
};
