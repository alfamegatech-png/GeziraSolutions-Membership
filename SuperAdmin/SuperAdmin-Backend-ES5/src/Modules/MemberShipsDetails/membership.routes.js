const express = require("express");
const { 
  AddMemberShips, 
  AddMultipleMemberships, 
  FilterFamiliesWithEndDateAndType, 
  GetAllAddedRefMempership, 
  GetAllEndedMemberships, 
  GetAllMemberships, 
  GetSpecificMemberShip, 
  GetTotalAmountOfAllFields, 
  returnAllFIlterdData, 
  GetFamiliesMembers,
  GetExpiredMemberships,
  GetMembersByInstallmentType,
  GetMembershipReport,
  GetReceiptItemsReport,
  GetSafeDailyReport,
  GetAccountingReviewReport
} = require("./memberShip.controller.js");
const { GetAllEndedMembershipsSchema } = require("../../utils/Validations.js");
const { validateRequest } = require("../../middleware/ValidationMiddleware.js");

const membershipRouter = express.Router();
membershipRouter.get("/GetSpecificMemberShip/:member_code", GetSpecificMemberShip);
membershipRouter.get("/GetAllMemberships", GetAllMemberships);
membershipRouter.get("/GetTotalAmountOfAllFields", GetTotalAmountOfAllFields);
membershipRouter.get("/GetAllAddedRefMempership", GetAllAddedRefMempership);
membershipRouter.get("/GetAllEndedMemberships", GetAllEndedMemberships);
membershipRouter.get("/returnAllFIlterdData", returnAllFIlterdData);
membershipRouter.post("/AddMemberShips", AddMemberShips);
membershipRouter.get("/FilterFamiliesWithEndDateAndType", FilterFamiliesWithEndDateAndType);
membershipRouter.post("/AddMultipleMemberships", AddMultipleMemberships);
membershipRouter.get("/GetFamiliesMembers",GetFamiliesMembers);
membershipRouter.get("/GetExpiredMemberships",GetExpiredMemberships);
membershipRouter.get("/GetMembersByInstallmentType",GetMembersByInstallmentType);
membershipRouter.get("/GetMembershipReport", GetMembershipReport);
membershipRouter.get("/GetReceiptItemsReport", GetReceiptItemsReport);
membershipRouter.get("/GetSafeDailyReport", GetSafeDailyReport);
membershipRouter.get("/GetAccountingReviewReport", GetAccountingReviewReport);

module.exports = { membershipRouter };
