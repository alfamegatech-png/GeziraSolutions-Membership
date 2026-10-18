const { Op, Sequelize, Transaction } = require("sequelize");
const sequelize = require("../../../Database/dbConnection.js").sequelize;
const LookupMemberRef =
  require("../../../Database/models/lookup_ref.js").LookupMemberRef;
const MemberRef = require("../../../Database/models/member_ref.js").MemberRef;
const Member = require("../../../Database/models/members.js").Member;

const {
  CountMembers,
  GetAll,
  MembersFilter,
  MembersFilterV2,
  MembersFilterV2CountOnly,
  getPagination,
} = require("../services/factor.js");
const { catchError } = require("../../utils/Catch Error.js");
const { AppError } = require("../../utils/AppError.js");
const { logger } = require("../../utils/logger.js");
const { User } = require("../../../Database/models/user.js");
const { Memberships } = require("../../../Database/models/membership.js");
const History = require("../../../Database/models/history.js");

const GetSpecificMember = catchError(async (req, res, next) => {
  const { member_code } = req.params;

  if (!member_code) {
    logger.warn("Member Code Is Not Valid");
    throw new AppError("Member Code Is Not Valid", 400);
  }

  const specificMember = await Member.findOne({ where: { member_code } });

  if (!specificMember) {
    logger.warn("Member not found");
    throw new AppError("Member not found", 404);
  }

  logger.info("Specific member retrieved successfully");
  res.json({ message: "Success", specificMember });
});

const getMemberRef = catchError(async (req, res, next) => {
  const { member_code } = req.params;

  if (!member_code) {
    logger.warn("Missing member_code in request body");
    throw new AppError("Missing member_code in request body", 400);
  }

  const member = await Member.findOne({ where: { member_code } });

  if (!member) {
    logger.warn("Member Not Found");
    throw new AppError("Member Not Found", 404);
  }

  const relatedMembers = await MemberRef.findAll({ where: { member_code } });

  logger.info("Member and related members retrieved successfully");
  res.json({ member, relatedMembers });
});

const updatedMember = catchError(async (req, res, next) => {
  const memberId = req.params.id;
  const updatedMemberData = req.body;

  const currentMember = await Member.findByPk(memberId);

  if (!currentMember) {
    logger.warn("Member not found");
    return next(new AppError("Member not found", 404));
  }

  const updatedFields = {};
  for (const field in updatedMemberData) {
    if (updatedMemberData[field] !== currentMember[field]) {
      updatedFields[field] = updatedMemberData[field];
    }
  }

  if (Object.keys(updatedFields).length === 0) {
    return res.json({ message: "Member data is already up to date" });
  }

  const result = await Member.update(updatedFields, {
    where: { id: memberId },
  });
  logger.info("Member data updated successfully");
  res.json({ message: "Member data updated successfully", result });
});

const numericMemberFields = new Set([
  "member_code",
  "job",
  "marital_status",
  "nationality",
  "religion",
  "sex",
  "member_type",
  "section",
  "city",
  "area",
  "qual",
  "trans",
  "id_1",
]);

function sanitizeMemberData(data) {
  const allowedFields = new Set(Object.keys(Member.rawAttributes));
  return Object.entries(data || {}).reduce((cleanData, [key, value]) => {
    if (!allowedFields.has(key) || value === "" || value === undefined) {
      return cleanData;
    }

    if (numericMemberFields.has(key)) {
      cleanData[key] = Number(value || 0);
      return cleanData;
    }

    cleanData[key] = value;
    return cleanData;
  }, {});
}

const AddMember = catchError(async (req, res, next) => {
  const insertData = sanitizeMemberData(req.body);

  if (!insertData.member_code) {
    logger.warn("member_code is required");
    return next(new AppError("member_code is required", 400));
  }

  if (!insertData.name) {
    logger.warn("name is required");
    return next(new AppError("name is required", 400));
  }

  const memberCodeCheck = await Member.findOne({
    where: { member_code: insertData.member_code },
  });

  if (memberCodeCheck) {
    logger.warn("member_code already exists");
    return next(new AppError("member_code already exists", 400));
  }

  const newMember = await Member.create(insertData);
  logger.info("Member data inserted successfully");
  res.json({ message: "Member data inserted successfully", newMember });
});

const deleteMember = catchError(async (req, res, next) => {
  const memberCode = req.params.member_code;

  try {
    const member = await Member.findOne({ where: { member_code: memberCode } });

    if (!member) {
      logger.warn("Member not found");
      return next(new AppError("Member not found", 404));
    }

    if (member.is_deleted) {
      logger.warn("Member already marked as deleted");
      return next(new AppError("Member already marked as deleted", 400));
    }

    member.is_deleted = true;
    member.suspended = "موقوف";
    member.suspended_date = new Date();

    await member.save();

    await Memberships.update(
      { status: 2 },
      { where: { member_code: memberCode } }
    );

    logger.info("Member and memberships updated successfully");
    res.json({ message: "Member and memberships updated successfully" });
  } catch (error) {
    logger.error("Error updating member and memberships: ", error);
    next(error);
  }
});

const GetMemberDetails = async (req, res) => {
  const { member_code } = req.query;
  // Fetch members without eager loading their associations
  const members = await Member.findAll({
    where: { member_code: member_code },
  });

  // Lazily load associations
  for (const member of members) {
    // Lazily load 'member_ref' associations for each member
    const memberRefs = await member.getMember_ref(); // Use get<Alias>() method to lazily load data
    member.dataValues.memberRefs = []; // Prepare to attach loaded memberRefs

    // Lazily load other associations
    const memberType = await member.getMemberType();
    const memberSection = await member.getMemberSection();
    const memberJob = await member.getMemberJob();
    const memberQual = await member.getMemberQual();

    // Lazily load memberships
    const memberships = await member.getMemberships(); // Using the 'get<Alias>()' method provided by Sequelize for the 'hasMany' relationship

    // Attach other associations directly to member
    member.dataValues.memberType = memberType;
    member.dataValues.memberSection = memberSection;
    member.dataValues.memberJob = memberJob;
    member.dataValues.memberQual = memberQual;
    member.dataValues.memberships = memberships; // Attach memberships to the member object

    for (const memberRef of memberRefs) {
      // For each memberRef, lazily load 'lookup_ref'
      const lookupRef = await memberRef.getLookup_ref(); // Assuming 'getLookup_ref' is the correct method name
      // Attach lookupRef to memberRef
      memberRef.dataValues.lookupRef = lookupRef;
      // Then attach memberRef (with lookupRef included) to the member object
      member.dataValues.memberRefs.push(memberRef);
    }
  }

  res.json({ message: "success", members });
};

const MainMembersFilter = MembersFilter(Member);
const GetAllMembers = GetAll(Member);

const MembersFilterv2 = MembersFilterV2(Member);
const MembershipsFilterv2 = MembersFilterV2(Memberships);
const MembersFilterCountOnly = MembersFilterV2CountOnly(Member);

const countMembers = async (req, res) => {
  const filters = req.body;

  if (!Array.isArray(filters) || filters.length === 0) {
    logger.warn("Invalid input format");
    return res
      .status(400)
      .json({ message: "Input must be an array of filter objects" });
  }

  const modelMapping = {
    members: Member,
    members_ref: MemberRef,
  };

  try {
    const results = await Promise.all(
      filters.map(async (filterSet, modelIndex) => {
        const model = modelMapping[filterSet.model];
        const modelFilters = filterSet.filters;

        if (!model || !modelFilters || !Array.isArray(modelFilters)) {
          return {
            model: filterSet.modelName,
            error: `Invalid filters for model at index ${modelIndex}`,
          };
        }

        const counts = await Promise.all(
          modelFilters.map(async (filter, filterIndex) => {
            const whereClause = {};

            if (filter.member_type) {
              whereClause.member_type = { [Op.in]: filter.member_type };
            }

            if (filter.sex) {
              whereClause.sex = { [Op.in]: filter.sex };
            }

            if (filter.ref) {
              whereClause.ref = { [Op.in]: filter.ref };
            }

            const count = await model.count({
              where: whereClause,
              logging: console.log,
            });

            let description = `Count of members with member type ${filter.member_type}`;
            if (filter.sex) {
              description += ` and sex ${filter.sex}`;
            }
            if (filter.ref) {
              description += ` and ref ${filter.ref}`;
            }
            description += `: ${count}`;

            return {
              description,
              count,
            };
          })
        );

        return {
          model: filterSet.model,
          counts,
        };
      })
    );

    res.json({ results });
  } catch (error) {
    logger.error("Error counting members:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllLogs = catchError(async (req, res, next) => {
  const {
    PageNumber,
    Pagelimit,
    startDate,
    endDate,
    requireMember,
    requireRefMember,
    searchName,
  } = req.body;

  // Validate start and end dates
  if (
    !startDate ||
    !endDate ||
    isNaN(new Date(startDate).getTime()) ||
    isNaN(new Date(endDate).getTime())
  ) {
    return next(
      new AppError(
        "Invalid dates provided. Both start date and end date must be valid dates."
      )
    );
  }

  const pagination = getPagination(PageNumber, Pagelimit);

  // Date filter with incremented dates
  const dateFilter = {
    time: {
      [Sequelize.Op.between]: [
        new Date(
          new Date(startDate).setDate(new Date(startDate).getDate() - 1)
        ),
        new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 1)),
      ],
    },
  };

  // Name filter
  const nameFilter = searchName
    ? {
        name: {
          [Sequelize.Op.iLike]: `%${searchName}%`,
        },
      }
    : {};

  // Conditional includes based on searchName
  const includeOptions = [
    {
      model: Member,
      as: "Member",
      attributes: ["name"],
      where: searchName ? nameFilter : undefined,
      required: searchName ? requireMember === true : false,
    },
    {
      model: MemberRef,
      as: "MemberRef",
      attributes: ["name"],
      where: searchName ? nameFilter : undefined,
      required: searchName ? requireRefMember === true : false,
    },
    {
      model: User,
      as: "users",
      attributes: ["fullname"],
    },
  ];

  // Fetch history data with filters and pagination
  const historyData = await History.findAndCountAll({
    where: dateFilter,
    include: includeOptions,
    ...pagination,
    subQuery: false,
  });

  // Response with data
  res.json({
    data: historyData.rows,
    total: historyData.count,
  });
});


const FilterMembers = catchError(async (req, res, next) => {
  const { type, years } = req.body; // Added `years` to the request body
  const { PageNumber, Pagelimit } = req.query;

  if (!type) {
    throw new AppError("Missing or invalid 'type' in request body", 400);
  }

  if (type === "expiredMemberships" && (!years || isNaN(years) || years < 1)) {
    throw new AppError(
      "Missing or invalid 'years' for expired memberships",
      400
    );
  }

  const pagination = getPagination(PageNumber, Pagelimit);

  const allMembers = await Member.findAll({
    include: [
      {
        model: Memberships,
        as: "memberships",
        required: false,
        attributes: ["member_order_date", "status", "canceled", "end_date"],
      },
    ],
  });

  const filteredMembers = [];
  for (const member of allMembers) {
    const memberships = member.memberships || [];
    let lastMembership = null;

    for (const membership of memberships) {
      if (
        !lastMembership ||
        new Date(membership.member_order_date) >
          new Date(lastMembership.member_order_date)
      ) {
        lastMembership = membership;
      }
    }

    if (type === "noMembership" && memberships.length === 0) {
      filteredMembers.push(member);
    } else if (
      type === "activeMemberships" &&
      lastMembership &&
      lastMembership.canceled === 0 &&
      lastMembership.status === 1 &&
      new Date(lastMembership.end_date) > new Date()
    ) {
      filteredMembers.push(member);
    } else if (type === "expiredMemberships" && lastMembership) {
      const expirationDate = new Date(lastMembership.end_date);
      const currentDate = new Date();
      const yearsDifference =
        currentDate.getFullYear() - expirationDate.getFullYear();

      if (
        lastMembership.canceled === 0 &&
        lastMembership.status === 2 &&
        expirationDate < currentDate &&
        yearsDifference >= years
      ) {
        filteredMembers.push(member);
      }
    }
  }

  const paginatedMembers = filteredMembers.slice(
    pagination.offset,
    pagination.offset + pagination.limit
  );

  res.json({
    message: "Filtered members retrieved successfully",
    members: paginatedMembers,
    total: filteredMembers.length,
  });
});

module.exports = {
  getAllLogs,
  GetAllMembers,
  GetSpecificMember,
  updatedMember,
  AddMember,
  getMemberRef,
  deleteMember,
  MainMembersFilter,
  MembersFilterv2,
  MembersFilterCountOnly,
  countMembers,
  GetMemberDetails,
  FilterMembers,
  MembershipsFilterv2,
};
