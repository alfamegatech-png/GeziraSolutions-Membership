const express = require("express");
const Member_type = require("./Member_type.controller.js");

const memberTypeRouter = express.Router();

memberTypeRouter.get("/GetAllMemberType", Member_type.GetAllMemberType);
memberTypeRouter.delete("/DeleteMemberType", Member_type.DeleteMemberType);

memberTypeRouter.get("/GetAlllookup_Types", Member_type.GetAlllookup_Types);
memberTypeRouter.delete("/DeleteLookup_Types", Member_type.DeleteLookup_Types);

memberTypeRouter.get("/GetAlllookup_ref", Member_type.GetAlllookup_Ref);
memberTypeRouter.get("/GetAlllookup_area", Member_type.GetAlllookup_Area);
memberTypeRouter.delete("/Deletelookup_Area", Member_type.Deletelookup_Area);
memberTypeRouter.delete("/Deletelookup_Ref", Member_type.Deletelookup_Ref);
memberTypeRouter.delete(
  "/Deletelookup_Section",
  Member_type.Deletelookup_Section
);
memberTypeRouter.delete("/Deletelookup_Qual", Member_type.Deletelookup_Qual);

memberTypeRouter.get("/GetAlllookup_Section", Member_type.GetAlllookup_Section);
memberTypeRouter.get("/GetAlllookup_Qual", Member_type.GetAlllookup_Qual);
memberTypeRouter.post("/AddMemberType", Member_type.AddMemberType);
memberTypeRouter.post("/AddlookupTypes", Member_type.AddlookupTypes);
memberTypeRouter.post("/AddlookupSection", Member_type.Addlookup_Section);
memberTypeRouter.post("/AddlookupRef", Member_type.Addlookup_Ref);
memberTypeRouter.post("/Addlookup_Qual", Member_type.Addlookup_Qual);
memberTypeRouter.post("/Addlookup_area", Member_type.Addlookup_Area);
memberTypeRouter.put("/UpdateMemberType", Member_type.UpdateMemberType);
memberTypeRouter.put("/UpdateMemberSection", Member_type.UpdateMemberSection);

memberTypeRouter.put("/UpdateMemberArea", Member_type.UpdateMemberArea);
memberTypeRouter.put(
  "/UpdateMembershipFeeRules",
  Member_type.UpdateMembershipFeeRules
);
memberTypeRouter.get(
  "/GetAllMembershipFeeRules",
  Member_type.GetAllMembershipFeeRules
);
memberTypeRouter.post(
  "/AddNewMembershipFeeRules",
  Member_type.AddNewMembershipFeeRules
);

memberTypeRouter.put("/UpdatelookupTypes", Member_type.UpdatelookupTypes);
memberTypeRouter.put("/UpdatelookupRef", Member_type.UpdateMemberRef);
memberTypeRouter.put("/UpdatelookupQual", Member_type.UpdateMemberQual);
memberTypeRouter.get("/GetAlllookupCity", Member_type.GetAlllookup_City);
memberTypeRouter.delete("/Deletelookup_City", Member_type.Deletelookup_City);
memberTypeRouter.delete(
  "/Deletelookup_status",
  Member_type.Deletelookup_status
);
memberTypeRouter.delete(
  "/Deletelookup_Nationality",
  Member_type.Deletelookup_Nationality
);
memberTypeRouter.delete("/Deletelookup_trans", Member_type.Deletelookup_trans);

memberTypeRouter.post("/AddlookupCity", Member_type.Addlookup_City);

memberTypeRouter.put("/UpdateMemberCity", Member_type.UpdateMemberCity);

memberTypeRouter.get("/GetAlllookupStatus", Member_type.GetAlllookup_status);

memberTypeRouter.post("/AddlookupStatus", Member_type.Addlookup_status);

memberTypeRouter.put("/UpdateMemberStatus", Member_type.UpdateMemberStatus);

memberTypeRouter.get(
  "/GetAlllookupNationality",
  Member_type.GetAlllookup_Nationality
);

memberTypeRouter.post(
  "/AddlookupNationality",
  Member_type.Addlookup_Nationality
);

memberTypeRouter.put(
  "/UpdateMemberNationality",
  Member_type.UpdateMemberNationality
);

memberTypeRouter.get("/GetAlllookupTrans", Member_type.GetAlllookup_Trans);

memberTypeRouter.post("/AddlookupTrans", Member_type.Addlookup_Trans);

memberTypeRouter.put("/UpdateMemberTrans", Member_type.UpdateMemberTrans);

memberTypeRouter.get(
  "/GetAllFinancialYearDiscount",
  Member_type.GetAlllFinancialYearDiscount
);

memberTypeRouter.post(
  "/AddFinancialYearDiscount",
  Member_type.AddNewFinancialYearDiscount
);

memberTypeRouter.put(
  "/UpdateFinancialYearDiscount",
  Member_type.UpdateFinancialYearDiscount
);

memberTypeRouter.get(
  "/GetAllGroupMembersDiscount",
  Member_type.GetAllGroupMembersDiscount
);

memberTypeRouter.post(
  "/AddGroupMembersDiscount",
  Member_type.AddNewGroupMembersDiscount
);

memberTypeRouter.put(
  "/UpdateGroupMembersDiscount",
  Member_type.UpdateGroupMembersDiscount
);

memberTypeRouter.post("/AddLookupRelation", Member_type.AddNewLookupRelation);
memberTypeRouter.get("/GetAllLookupRelation", Member_type.GetAllLookupRelation);
memberTypeRouter.put("/UpdateLookupRelation", Member_type.UpdateLookupRelation);

memberTypeRouter.post(
  "/AddSeasonalMembershipPrices",
  Member_type.AddNewSeasonalMembershipPrices
);

memberTypeRouter.put(
  "/UpdateSeasonalMembershipPrices",
  Member_type.UpdateSeasonalMembershipPrices
);

memberTypeRouter.post(
  "/AddSeasonalGroupDiscount",
  Member_type.AddNewSeasonalGroupDiscount
);
memberTypeRouter.put(
  "/UpdateSeasonalGroupDiscount",
  Member_type.UpdateSeasonalGroupDiscount
);
memberTypeRouter.delete(
  "/DeleteSeasonalGroupDiscount",
  Member_type.DeleteSeasonalGroupDiscount
);
memberTypeRouter.delete(
  "/DeleteSeasonalMembershipPrices",
  Member_type.DeleteSeasonalMembershipPrices
);
memberTypeRouter.delete(
  "/DeleteLookupRelation",
  Member_type.DeleteLookupRelation
);


module.exports = {
  memberTypeRouter: memberTypeRouter,
};
