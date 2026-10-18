const express = require("express");
const { 
  AddPricingRule, 
  DeletePricingRule, 
  GetPricingRule, 
  UpdatePricingRule 
} = require("./PricingRule.controller.js");

const PricingRuleRouter = express.Router();
PricingRuleRouter.put("/UpdatePricingRule/:id", UpdatePricingRule);
PricingRuleRouter.delete("/DeletePricingRule/:id", DeletePricingRule);
PricingRuleRouter.post("/AddPricingRule", AddPricingRule);
PricingRuleRouter.get("/GetPricingRule", GetPricingRule);

module.exports = { PricingRuleRouter };
