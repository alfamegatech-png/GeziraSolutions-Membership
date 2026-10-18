const AppError = require("../../utils/AppError.js").AppError;
const catchError = require("../../utils/Catch Error.js").catchError;
const { sequelize } = require("../../../Database/dbConnection.js");
const { LookupMemberRef } = require("../../../Database/models/lookup_ref.js");
const { PricingRule } = require("../../../Database/models/PricingRule.js");
const { logger } = require("../../utils/logger.js");
const { AddNewGeneric } = require("../services/factor.js");

const AddPricingRule = AddNewGeneric(PricingRule);
const DeletePricingRule = catchError(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    logger.warn("ID is not provided");
    throw new AppError("ID is not provided", 400);
  }

  const pricingRule = await PricingRule.findOne({ where: { id } });

  if (!pricingRule) {
    logger.warn("PricingRule not found for the provided ID");
    throw new AppError("PricingRule not found for the provided ID", 404);
  }

  await pricingRule.update({ is_deleted: true });

  logger.info("PricingRule deleted successfully");
  res.json({ message: "Success", pricingRule });
});
const UpdatePricingRule = catchError(async (req, res, next) => {
  const { id } = req.params;
  const { name, minAge, maxAge, price, amount,refId } = req.body;

  if (!id) {
    logger.warn("ID is not provided");
    return next(new AppError("ID is not provided", 400));
  }

  const pricingRule = await PricingRule.findOne({ where: { id } });

  if (!pricingRule) {
    logger.warn("PricingRule not found for the provided ID");
    return next(new AppError("PricingRule not found for the provided ID", 404));
  }


  await pricingRule.update({ is_deleted: true });

  const newPricingRule = await PricingRule.create({
    name: name || pricingRule.name,
    minAge: minAge !== undefined ? minAge : pricingRule.minAge,
    maxAge: maxAge !== undefined ? maxAge : pricingRule.maxAge,
    price: price !== undefined ? price : pricingRule.price,
    // code: code !== undefined ? code : pricingRule.code,
    refId:refId!==undefined ?refId:pricingRule.refId,
    amount: amount !== undefined ? amount : pricingRule.code,
  });

  logger.info("PricingRule updated successfully");
  res.json({ message: "Success", newPricingRule });
});

const GetPricingRule = catchError(async (req, res, next) => {
  const pricingRules = await PricingRule.findAll({
    where: { is_deleted: false },
    include: [
      {
        model: LookupMemberRef,
        as: "ref",
        required: false,
        on: {
          col1: sequelize.where(
            sequelize.col("PricingRule.refId"),
            "=",
            sequelize.col("ref.code")
          ),
        },
        attributes: ["id", "code", "name"],
      },
    ],
  });

  if (pricingRules.length === 0) {
    return next(new AppError("Not Found Any PricingRules"));
  }

  res.json({ message: "Success", pricingRules });
});

module.exports = {
  AddPricingRule,
  DeletePricingRule,
  UpdatePricingRule,
  GetPricingRule,
};
