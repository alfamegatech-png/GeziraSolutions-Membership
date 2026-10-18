const express = require('express');
const SeasonalMembershipPrices = require('./SeasonalMembershipPrices.controller.js');

const SeasonalMembershipPricesRouter = express.Router();


SeasonalMembershipPricesRouter.get('/GetAllSeasonalMembershipPrices', SeasonalMembershipPrices.getAllSeasonalMembershipPrices);
SeasonalMembershipPricesRouter.get('/GetAllSeasonalGroupDiscount', SeasonalMembershipPrices.getAllSeasonalGroupDiscount);


module.exports = {
  SeasonalMembershipPricesRouter: SeasonalMembershipPricesRouter
};
