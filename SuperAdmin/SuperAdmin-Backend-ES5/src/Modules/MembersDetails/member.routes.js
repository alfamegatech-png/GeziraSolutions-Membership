const express = require("express");
const { GetAllMembers, GetSpecificMember, MainMembersFilter, GetMemberDetails, countMembers, getAllLogs, AddMember, MembersFilterv2, MembersFilterCountOnly, getMemberRef, updatedMember, deleteMember, FilterMembers, MembershipsFilterv2 } = require("./member.controller");


const memberRouter = express.Router();
memberRouter.get("/GetAllmembers", GetAllMembers);
memberRouter.get("/GetSpecificMember/:member_code", GetSpecificMember);
memberRouter.get("/MembersFilter", MainMembersFilter);
memberRouter.get("/GetMemberDetails", GetMemberDetails);
memberRouter.post("/countMembers", countMembers);
memberRouter.post("/getAllLogs", getAllLogs);

memberRouter.post("/insert-member", AddMember);
memberRouter.post("/MembersFilterv2", MembersFilterv2);
memberRouter.post("/MembersFilterCountOnly", MembersFilterCountOnly);
memberRouter.get("/get-member/memberRef/:member_code", getMemberRef);
memberRouter.post("/FilterMembers", FilterMembers);
memberRouter.post("/MembershipsFilterv2", MembershipsFilterv2);


memberRouter.put("/updateMember/:id", updatedMember);



memberRouter.delete("/delete-member/:member_code", deleteMember);

module.exports = { memberRouter };
