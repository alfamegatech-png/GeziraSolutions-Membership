const express = require("express");

const {
  updatedRefMember,
  AddMemberRef,
  deleteMember_ref,
  GetSpecificMember_ref,
  GetAllMembersRef,
  familiesMembersWithEndDate,
  RefMembersFilterV2,
  RefMembersFilterCountOnly,
  FilterWithEndDateAndType,
  GetNewJoinedMembers ,
  FilterOnlySwiming,
  RefMembersFilter,
  GetMembersByAge,
  FilterMembersByAge,
} = require("./memberRef.controller.js");

const memberRefRouter = express.Router();

memberRefRouter.put("/updateMemberRef/:id", updatedRefMember);
memberRefRouter.post("/insert-memberRef", AddMemberRef);
memberRefRouter.delete("/delete-memberRef/:id", deleteMember_ref);
memberRefRouter.get("/get-memberRef/:member_code", GetSpecificMember_ref);
memberRefRouter.get("/GetAllMembersRef", GetAllMembersRef);
memberRefRouter.get("/familiesMembersWithEndDate", familiesMembersWithEndDate);
memberRefRouter.post("/RefMembersFilterV2", RefMembersFilterV2);
memberRefRouter.post("/RefMembersFilterCountOnly", RefMembersFilterCountOnly);
memberRefRouter.get("/FilterWithEndDateAndType", FilterWithEndDateAndType);
memberRefRouter.get(
  "/GetNewJoinedMembers",
  GetNewJoinedMembers 
);
memberRefRouter.get("/FilterOnlySwiming", FilterOnlySwiming);

memberRefRouter.get("/RefMembersFilter", RefMembersFilter);
memberRefRouter.get("/FilterMembersByAge", FilterMembersByAge);

module.exports = {
  memberRefRouter: memberRefRouter,
};
