const { Op, Sequelize, where } = require("sequelize");
const LookupMemberType =
  require("../../../Database/models/lookup_Member_Type.js").LookupMemberType;
const MemberRef = require("../../../Database/models/member_ref.js").MemberRef;
const Member = require("../../../Database/models/members.js").Member;
const Memberships =
  require("../../../Database/models/membership.js").Memberships;
const {
  GetAll,
  MembersFilter,
  MembersFilterV2,
  MembersFilterV2CountOnly,
  getPagination,
} = require("../services/factor.js");
const { catchError } = require("../../utils/Catch Error.js");
const { logger } = require("../../utils/logger.js");
const { AppError } = require("../../utils/AppError.js");
const sequelize = require("../../../Database/dbConnection.js").sequelize;

const numericRefFields = new Set([
  "member_type",
  "member_code",
  "ref",
  "serial_no",
  "sex",
  "deleted",
]);

function sanitizeMemberRefData(data) {
  const allowedFields = new Set(Object.keys(MemberRef.rawAttributes));
  return Object.entries(data || {}).reduce((cleanData, [key, value]) => {
    if (!allowedFields.has(key) || value === "" || value === undefined) {
      return cleanData;
    }

    if (numericRefFields.has(key)) {
      cleanData[key] = Number(value || 0);
      return cleanData;
    }

    cleanData[key] = value;
    return cleanData;
  }, {});
}

const updatedRefMember = catchError(async (req, res, next) => {
  const memberId = req.params.id;
  const updatedRefMemberData = req.body;

  const memberRef = await MemberRef.findByPk(memberId);

  if (!memberRef) {
    logger.warn("Member_ref not found", 404);
    next(new AppError("Member_ref not found", 404));
  }

  await memberRef.update(updatedRefMemberData);
  logger.info("Member_ref data updated successfully");
  res.json({ message: "Member_ref data updated successfully" });
});

const AddMemberRef = catchError(async (req, res, next) => {
  const userData = sanitizeMemberRefData(req.body);

  try {
    if (!userData.member_type) {
      logger.warn("member_type is required");
      return next(new AppError("member_type is required", 400));
    }

    if (!userData.member_code) {
      logger.warn("member_code cannot be 0");
      return next(new AppError("member_code cannot be 0", 400));
    }

    const memberExists = await Member.findOne({
      where: { member_code: userData.member_code },
    });

    if (!memberExists) {
      logger.warn("member_code not found");
      return next(new AppError("member_code not found", 400));
    }

    const nameExists = await MemberRef.findOne({
      where: { member_code: userData.member_code, name: userData.name },
    });

    if (nameExists) {
      logger.warn("Duplicate name with the same member_code found");
      return next(
        new AppError("Duplicate name with the same member_code found", 400)
      );
    }

    const maxSerialNo = await MemberRef.max("serial_no", {
      where: { member_code: userData.member_code },
    });

    const newSerialNo = maxSerialNo ? maxSerialNo + 1 : 1;

    const newMemberRef = await MemberRef.create({
      ...userData,
      serial_no: newSerialNo,
    });

    logger.info("Member_ref data inserted successfully");
    res.json({
      message: "Member_ref data inserted successfully",
      newMemberRef,
    });
  } catch (error) {
    logger.error("An error occurred while adding member_ref", error);
    next(new AppError("An error occurred while adding member_ref", 500));
  }
});

const deleteMember_ref = catchError(async (req, res, next) => {
  const memberId = req.params.id;

  const memberRef = await MemberRef.findByPk(memberId);

  if (!memberRef) {
    logger.warn("Member_ref not found");
    next(new AppError("Member_ref not found", 404));
  }

  await memberRef.destroy();
  logger.info(`Member_ref with ID ${memberId} deleted successfully`);
  res.json({ message: "Member_ref deleted successfully" });
});

const GetSpecificMember_ref = catchError(async (req, res, next) => {
  const { member_code } = req.params;
  if (!member_code || member_code === 0) {
    logger.warn("Member Code Is Not Valid or Equal 0");
    next(new AppError("Member Code Is Not Valid or Equal 0", 400));
  }

  const specificMembers = await MemberRef.findAll({
    where: { member_code: member_code },
  });

  if (specificMembers.length === 0) {
    logger.warn("Member_ref not found");
    next(new AppError("Member_ref not found", 404));
  }

  logger.info(`Specific members retrieved for member_code: ${member_code}`);
  res.json({ message: "Success", specificMembers });
});

const FilterOnlySwiming = catchError(async (req, res, next) => {
  const { endDate, PageLimit, PageNumber, isFirstTime, isSeperatefee } =
    req.query; // Add isTrue to query parameters

  const queryOptions = {
    // distinct: true,
    col: "member_code",
    where: {},
    logging: console.log,
    limit: PageLimit ? parseInt(PageLimit) : undefined,
    offset: PageNumber ? parseInt(PageNumber) : undefined,
    // distinct: true,
  };

  if (isSeperatefee === "true") {
    queryOptions.where.seperate_fees = {
      [Sequelize.Op.ne]: 0, // Filters memberships where renew_fee is not zero
    };
  } else if (isSeperatefee === "false") {
    queryOptions.where.seperate_fees = 0;
    queryOptions.where.renew_fee = 0; // Filters memberships where renew_fee is zero
    // Filters memberships where renew_fee is zero
  }
  if (isFirstTime === "true") {
    queryOptions.where.join_fee = {
      [Sequelize.Op.ne]: 0, // Filters memberships where renew_fee is not zero
    };
  } else if (isFirstTime === "false") {
    queryOptions.where.join_fee = 0; // Filters memberships where renew_fee is zero
    queryOptions.where.renew_fee = 0; // Filters memberships where renew_fee is zero
  }

  if (endDate) {
    const date = endDate;
    const parsedDate = new Date(date);
    queryOptions.where.end_date = parsedDate;
  }
  const sumTotalAmount = await Memberships.sum("total_amount", queryOptions);

  // if (member_type) {
  //   queryOptions.include = {
  //     model: Member,
  //     where: {
  //       member_type: member_type.split(","),
  //     },
  //   };
  // }

  const count = await Memberships.count(queryOptions);
  const FilteredMembersDetails =
    PageLimit && PageNumber ? await Memberships.findAll(queryOptions) : [];

  res.json({
    count,
    FilteredMembersDetails,
    sumTotalAmount,
  });
});

const familiesMembersWithEndDate = catchError(async (req, res, next) => {
  const {
    PageLimit,
    PageNumber,
    endDate,
    includeMemberRef,
    includeMemberships,
  } = req.query;

  let includeArray = [];

  if (includeMemberRef == "true") {
    includeArray.push({
      model: MemberRef,
      required: true,
      as: "member_ref",
      attributes: [],
    });
  }

  if (includeMemberships === "true") {
    // Create a where condition for "memberships" only when it's included
    const membershipsWhere = {};

    if (endDate) {
      const parsedEndDate = new Date(endDate);
      membershipsWhere.end_date = parsedEndDate;
    }

    includeArray.push({
      model: Memberships,
      required: false,
      as: "memberships",
      where: membershipsWhere, // Include the where condition
      attributes: [],
    });
  }

  const queryOptions2 = {
    distinct: true,
    col: "member_code",
    include: includeArray,
    limit: PageLimit ? parseInt(PageLimit) : undefined,
    offset: PageNumber ? parseInt(PageNumber) : undefined,
  };
  const queryOptions = {
    col: "member_code",
    limit: PageLimit ? parseInt(PageLimit) : undefined,
    offset: PageNumber ? parseInt(PageNumber) : undefined,
  };

  const familiesMembersCount = await Member.count(queryOptions2);
  const familiesMembersRefCount = await MemberRef.count(queryOptions);

  res.json({
    familiesMembers: familiesMembersCount,
    familiesMembersRefCount,
  });
});

const FilterWithEndDateAndType = catchError(async (req, res, next) => {
  const { member_type, startDate, endDate, PageLimit, PageNumber } = req.query;
  if (!member_type) return next(new AppError("Invalid member type", 404));

  const pagination = getPagination(PageNumber, PageLimit);
  const queryOptions = {
    distinct: true,
    col: "member_code",
    where: {},
    logging: console.log,
    ...pagination,
  };

  // تعديل التاريخ ليشمل startDate و endDate
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    queryOptions.where.start_date = { [Op.gte]: start };
    queryOptions.where.end_date = { [Op.lte]: end };
  } else if (startDate) {
    const parsedStart = new Date(startDate);
    queryOptions.where.start_date = { [Op.gte]: parsedStart };
  } else if (endDate) {
    const parsedEnd = new Date(endDate);
    queryOptions.where.end_date = { [Op.lte]: parsedEnd };
  } else {
    return next(new AppError("Invalid start date & end date provided"));
  }

  // فلترة على نوع العضو
  if (member_type) {
    queryOptions.include = {
      model: Member,
      as: "members",
      where: {
        member_type: member_type.split(","),
      },
      logging: console.log,
    };
  }

  const count = await Memberships.count(queryOptions);
  const FilteredMembersDetails =
    PageLimit && PageNumber ? await Memberships.findAll(queryOptions) : [];

  res.json({
    count,
    FilteredMembersDetails,
  });
});

const GetNewJoinedMembers = catchError(async (req, res, next) => {
  const { startDate, endDate, PageLimit, PageNumber } = req.query;

  if (!startDate || !endDate) {
    return next(new AppError("Invalid start date and end date", 404));
  }

  const pagination = getPagination(PageNumber, PageLimit);

  const queryOptions = {
    where:{},
    ...pagination,
    // logging: console.log,
  };

  // Date filtering
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);
  parsedEndDate.setDate(parsedEndDate.getDate() + 1);

  queryOptions.where.join_date = {
    [Sequelize.Op.between]: [parsedStartDate, parsedEndDate],
  };

  const FilteredMemberships = await Member.findAndCountAll(queryOptions);

  res.json({
    FilteredMemberships,
  });
});

const GetAllMembersRef = GetAll(MemberRef);
const RefMembersFilter = MembersFilter(MemberRef);
const RefMembersFilterV2 = MembersFilterV2(MemberRef);
const RefMembersFilterCountOnly = MembersFilterV2CountOnly(MemberRef);

const FilterMembersByAge = catchError(async (req, res, next) => {
  const { age, PageLimit, PageNumber } = req.query;
  const pagination = getPagination(PageNumber, PageLimit);
  if (!age) {
    logger.warn("Age is required");
    return next(new AppError("Age is required", 400));
  }

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const birthYearStart = currentYear - parseInt(age) - 1;
  const birthYearEnd = currentYear - parseInt(age);

  const queryOptions = {
    where: {
      birth_date: {
        [Op.gte]: new Date(
          birthYearStart,
          currentDate.getMonth(),
          currentDate.getDate()
        ),
        [Op.lte]: new Date(
          birthYearEnd,
          currentDate.getMonth(),
          currentDate.getDate()
        ),
      },
    },
    ...pagination,
  };

  const filteredMembers = await MemberRef.findAndCountAll(queryOptions);

  if (filteredMembers.length === 0) {
    logger.warn("No members found for the specified age range");
    return next(
      new AppError("No members found for the specified age range", 404)
    );
  }

  logger.info(`Filtered members by age: ${age}`);
  res.json({
    message: "Success",
    filteredMembers,
  });
});

module.exports = {
  updatedRefMember: updatedRefMember,
  AddMemberRef: AddMemberRef,
  deleteMember_ref: deleteMember_ref,
  GetSpecificMember_ref: GetSpecificMember_ref,
  GetAllMembersRef: GetAllMembersRef,
  RefMembersFilter: RefMembersFilter,
  FilterWithEndDateAndType: FilterWithEndDateAndType,
  familiesMembersWithEndDate: familiesMembersWithEndDate,
  RefMembersFilterV2: RefMembersFilterV2,
  GetNewJoinedMembers: GetNewJoinedMembers,
  FilterOnlySwiming: FilterOnlySwiming,
  RefMembersFilterCountOnly: RefMembersFilterCountOnly,
  FilterMembersByAge: FilterMembersByAge,
};
