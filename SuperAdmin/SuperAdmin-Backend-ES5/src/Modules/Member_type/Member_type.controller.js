const { Op, Sequelize } = require("sequelize");
const LookupMemberType =
  require("../../../Database/models/lookup_Member_Type.js").LookupMemberType;
const MemberRef = require("../../../Database/models/member_ref.js").MemberRef;
const Member = require("../../../Database/models/members.js").Member;
const Memberships =
  require("../../../Database/models/membership.js").Memberships;
const AppError = require("../../utils/AppError.js").AppError;
const catchError = require("../../utils/Catch Error.js").catchError;
const {
  AddNewGeneric,
  DeleteByIdGeneric,
  GetAll,
  UpdateByIdGeneric,
} = require("../services/factor.js");
const {
  MembershipFeeRules,
} = require("../../../Database/models/MembershipFeeRules.js");
const FinancialYearDiscount = require("../../../Database/models/financial_year_discounts.js");
const GroupMembersDiscount = require("../../../Database/models/GroupMembersDiscount.js");
const SeasonalGroupDiscount = require("../../../Database/models/SeasonalGroupDiscount.js");
const SeasonalMembershipPrices = require("../../../Database/models/SeasonalMembershipPrices.js");
const LookupRelation = require("../../../Database/models/LookupRelation.js");
const sequelize = require("../../../Database/dbConnection.js").sequelize;
const lookup_Types =
  require("../../../Database/models/lookup_Types.js").lookup_Types;
const LookupArea =
  require("../../../Database/models/lookup_area.js").LookupArea;
const LookupMemberRef =
  require("../../../Database/models/lookup_ref.js").LookupMemberRef;
const LookupMemberSection =
  require("../../../Database/models/lookup_section.js").LookupMemberSection;
const LookupMemberQual =
  require("../../../Database/models/lookup_qual.js").LookupMemberQual;
const lookupCity =
  require("../../../Database/models/lookup_city.js").lookupCity;
const lookupMaritalStatus =
  require("../../../Database/models/lookup_marital_status.js").lookupMaritalStatus;
const lookupNationality =
  require("../../../Database/models/lookup_nationality.js").lookupNationality;
const lookupTrans =
  require("../../../Database/models/lookup_trans.js").lookupTrans;

const GetAllMemberType = GetAll(LookupMemberType);
const DeleteMemberType = DeleteByIdGeneric(LookupMemberType);
const GetAlllookup_Types = GetAll(lookup_Types);
const DeleteLookup_Types = DeleteByIdGeneric(lookup_Types);
const AddMemberType = AddNewGeneric(LookupMemberType);
const Addlookup_Area = AddNewGeneric(LookupArea);
const Deletelookup_Area = DeleteByIdGeneric(LookupArea);

const AddlookupTypes = AddNewGeneric(lookup_Types);
const UpdateMemberType = UpdateByIdGeneric(LookupMemberType);
const GetAlllookup_Area = GetAll(LookupArea);
const UpdateMemberArea = UpdateByIdGeneric(LookupArea);
const UpdatelookupTypes = UpdateByIdGeneric(lookup_Types);
const GetAlllookup_Ref = GetAll(LookupMemberRef);
const Deletelookup_Ref = DeleteByIdGeneric(LookupMemberRef);

const UpdateMemberRef = UpdateByIdGeneric(LookupMemberRef);
const Addlookup_Ref = AddNewGeneric(LookupMemberRef);
const GetAlllookup_Section = GetAll(LookupMemberSection);
const Deletelookup_Section = DeleteByIdGeneric(LookupMemberSection);

const UpdateMemberSection = UpdateByIdGeneric(LookupMemberSection);
const Addlookup_Section = AddNewGeneric(LookupMemberSection);
const GetAlllookup_Qual = GetAll(LookupMemberQual);
const Deletelookup_Qual = DeleteByIdGeneric(LookupMemberQual);

const UpdateMemberCity = UpdateByIdGeneric(lookupCity);
const Deletelookup_City = DeleteByIdGeneric(lookupCity);

const Addlookup_Qual = AddNewGeneric(LookupMemberQual);
const Addlookup_City = AddNewGeneric(lookupCity);
const UpdateMemberQual = UpdateByIdGeneric(LookupMemberQual);
const GetAlllookup_City = GetAll(lookupCity);
const Addlookup_status = AddNewGeneric(lookupMaritalStatus);
const Deletelookup_status = DeleteByIdGeneric(lookupMaritalStatus);

const UpdateMemberStatus = UpdateByIdGeneric(lookupMaritalStatus);
const GetAlllookup_status = GetAll(lookupMaritalStatus);
const Addlookup_Nationality = AddNewGeneric(lookupNationality);
const Deletelookup_Nationality = DeleteByIdGeneric(lookupNationality);

const UpdateMemberNationality = UpdateByIdGeneric(lookupNationality);
const Deletelookup_trans = DeleteByIdGeneric(lookupTrans);

const GetAlllookup_Nationality = GetAll(lookupNationality);
const Addlookup_Trans = AddNewGeneric(lookupTrans);
const UpdateMemberTrans = UpdateByIdGeneric(lookupTrans);
const GetAlllookup_Trans = GetAll(lookupTrans);
const GetAlllFinancialYearDiscount = GetAll(FinancialYearDiscount);
const UpdateFinancialYearDiscount = UpdateByIdGeneric(FinancialYearDiscount);
const AddNewFinancialYearDiscount = AddNewGeneric(FinancialYearDiscount);

const UpdateMembershipFeeRules = UpdateByIdGeneric(MembershipFeeRules);
const GetAllMembershipFeeRules = GetAll(MembershipFeeRules);
const AddNewMembershipFeeRules = AddNewGeneric(MembershipFeeRules);
const UpdateGroupMembersDiscount = UpdateByIdGeneric(GroupMembersDiscount);
const GetAllGroupMembersDiscount = GetAll(GroupMembersDiscount);
const AddNewGroupMembersDiscount = AddNewGeneric(GroupMembersDiscount);
const AddNewSeasonalGroupDiscount = AddNewGeneric(SeasonalGroupDiscount);
const GetAllSeasonalGroupDiscount = GetAll(SeasonalGroupDiscount);
const UpdateSeasonalGroupDiscount = UpdateByIdGeneric(SeasonalGroupDiscount);
const DeleteSeasonalGroupDiscount = DeleteByIdGeneric(SeasonalGroupDiscount);
const AddNewSeasonalMembershipPrices = AddNewGeneric(SeasonalMembershipPrices);
const GetAllSeasonalMembershipPrices = GetAll(SeasonalMembershipPrices);
const UpdateSeasonalMembershipPrices = UpdateByIdGeneric(SeasonalMembershipPrices);
const DeleteSeasonalMembershipPrices = DeleteByIdGeneric(SeasonalMembershipPrices);

const AddNewLookupRelation = AddNewGeneric(LookupRelation);
const GetAllLookupRelation = GetAll(LookupRelation);
const DeleteLookupRelation = DeleteByIdGeneric(LookupRelation);
const UpdateLookupRelation = UpdateByIdGeneric(LookupRelation);

module.exports = {
  UpdateGroupMembersDiscount:UpdateGroupMembersDiscount,
  GetAllGroupMembersDiscount:GetAllGroupMembersDiscount,
  AddNewGroupMembersDiscount:AddNewGroupMembersDiscount,
  GetAllMemberType: GetAllMemberType,
  DeleteMemberType: DeleteMemberType,
  GetAlllookup_Types: GetAlllookup_Types,
  DeleteLookup_Types: DeleteLookup_Types,
  AddMemberType: AddMemberType,
  Addlookup_Area: Addlookup_Area,
  Deletelookup_Area: Deletelookup_Area,
  AddlookupTypes: AddlookupTypes,
  UpdateMemberType: UpdateMemberType,
  GetAlllookup_Area: GetAlllookup_Area,
  UpdateMemberArea: UpdateMemberArea,
  UpdatelookupTypes: UpdatelookupTypes,
  GetAlllookup_Ref: GetAlllookup_Ref,
  Deletelookup_Ref: Deletelookup_Ref,
  UpdateMemberRef: UpdateMemberRef,
  Addlookup_Ref: Addlookup_Ref,
  GetAlllookup_Section: GetAlllookup_Section,
  Deletelookup_Section: Deletelookup_Section,
  UpdateMemberSection: UpdateMemberSection,
  Addlookup_Section: Addlookup_Section,
  GetAlllookup_Qual: GetAlllookup_Qual,
  Deletelookup_Qual: Deletelookup_Qual,
  UpdateMemberCity: UpdateMemberCity,
  Deletelookup_City: Deletelookup_City,
  Addlookup_Qual: Addlookup_Qual,
  Addlookup_City: Addlookup_City,
  UpdateMemberQual: UpdateMemberQual,
  GetAlllookup_City: GetAlllookup_City,
  Addlookup_status: Addlookup_status,
  Deletelookup_status: Deletelookup_status,
  UpdateMemberStatus: UpdateMemberStatus,
  GetAlllookup_status: GetAlllookup_status,
  Addlookup_Nationality: Addlookup_Nationality,
  Deletelookup_Nationality: Deletelookup_Nationality,
  UpdateMemberNationality: UpdateMemberNationality,
  Deletelookup_trans: Deletelookup_trans,
  GetAlllookup_Nationality: GetAlllookup_Nationality,
  Addlookup_Trans: Addlookup_Trans,
  UpdateMemberTrans: UpdateMemberTrans,
  GetAlllookup_Trans: GetAlllookup_Trans,
  UpdateMembershipFeeRules: UpdateMembershipFeeRules,
  GetAllMembershipFeeRules: GetAllMembershipFeeRules,
  AddNewMembershipFeeRules: AddNewMembershipFeeRules,
  AddNewFinancialYearDiscount: AddNewFinancialYearDiscount,
  UpdateFinancialYearDiscount: UpdateFinancialYearDiscount,
  GetAlllFinancialYearDiscount: GetAlllFinancialYearDiscount,
   AddNewSeasonalGroupDiscount,
  GetAllSeasonalGroupDiscount,
  UpdateSeasonalGroupDiscount,
    AddNewSeasonalMembershipPrices,
  GetAllSeasonalMembershipPrices,
  UpdateSeasonalMembershipPrices,
    AddNewLookupRelation,
  GetAllLookupRelation,
  UpdateLookupRelation,
  DeleteLookupRelation,
  DeleteSeasonalGroupDiscount,  
  DeleteSeasonalMembershipPrices
};
