const { Op, Sequelize, col, fn } = require("sequelize");

const {
  createHistoryLogOnSubmit,
  GetAll,
  getPagination,
} = require("../services/factor.js");
const { logger } = require("../../utils/logger.js");
const { User } = require("../../../Database/models/user.js");
const { catchError } = require("../../utils/Catch Error.js");
const { AppError } = require("../../utils/AppError.js");
const { Memberships } = require("../../../Database/models/membership.js");
const { Member } = require("../../../Database/models/members.js");
const { MemberRef } = require("../../../Database/models/member_ref.js");
const status = require("statuses");
const Invoice = require("../Invoice/Invoice.js");
const sequelize = require("../../../Database/dbConnection.js").sequelize;
const LookupMemberType =
  require("../../../Database/models/lookup_Member_Type.js").LookupMemberType;
const LookupMemberRef =
  require("../../../Database/models/lookup_ref.js").LookupMemberRef;

const receiptReportFields = [
  "delay_penalty",
  "previous_penalties",
  "maintenance_fee",
  "membership_card_fee",
  "fellowship_fund_fee",
  "transfer_separation_fee",
  "renew_fee",
  "value_added_tax",
  "swimming",
  "first_time_fee",
  "join_fee",
  "installment",
  "new_ref_fees",
  "prev_years_fee",
  "seperate_fees",
  "total_amount",
];

function buildReportFilters(query, alias = "m") {
  const {
    startDate,
    endDate,
    memberType,
    status,
    operationType,
    safeNo,
    serialNo,
    memberCode,
  } = query;
  const filters = [];
  const replacements = {};

  if (startDate) {
    filters.push(`${alias}.member_order_date >= :startDate`);
    replacements.startDate = new Date(startDate);
  }

  if (endDate) {
    const parsedEndDate = new Date(endDate);
    parsedEndDate.setHours(23, 59, 59, 999);
    filters.push(`${alias}.member_order_date <= :endDate`);
    replacements.endDate = parsedEndDate;
  }

  if (memberType) {
    filters.push(`mem.member_type = :memberType`);
    replacements.memberType = Number(memberType);
  }

  if (status) {
    filters.push(`${alias}.status = :status`);
    replacements.status = Number(status);
  }

  if (safeNo) {
    filters.push(`${alias}.safe_no = :safeNo`);
    replacements.safeNo = Number(safeNo);
  }

  if (serialNo) {
    filters.push(`${alias}.serial_no = :serialNo`);
    replacements.serialNo = Number(serialNo);
  }

  if (memberCode) {
    filters.push(`${alias}.member_code = :memberCode`);
    replacements.memberCode = Number(memberCode);
  }

  if (operationType === "new") {
    filters.push(`(COALESCE(${alias}.join_fee, 0) > 0 OR COALESCE(${alias}.first_time_fee, 0) > 0)`);
  } else if (operationType === "renew") {
    filters.push(`(
      COALESCE(${alias}.join_fee, 0) = 0
      AND COALESCE(${alias}.first_time_fee, 0) = 0
      AND (
        COALESCE(${alias}.renew_fee, 0) > 0
        OR COALESCE(${alias}.prev_years_fee, 0) > 0
        OR COALESCE(${alias}.delay_penalty, 0) > 0
        OR COALESCE(${alias}.previous_penalties, 0) > 0
        OR COALESCE(${alias}.maintenance_fee, 0) > 0
        OR COALESCE(${alias}.membership_card_fee, 0) > 0
        OR COALESCE(${alias}.fellowship_fund_fee, 0) > 0
        OR COALESCE(${alias}.transfer_separation_fee, 0) > 0
        OR COALESCE(${alias}.seperate_fees, 0) > 0
      )
    )`);
  } else if (operationType === "swimming") {
    filters.push(`(
      COALESCE(${alias}.swimming, 0) > 0
      AND COALESCE(${alias}.join_fee, 0) = 0
      AND COALESCE(${alias}.first_time_fee, 0) = 0
      AND COALESCE(${alias}.renew_fee, 0) = 0
      AND COALESCE(${alias}.prev_years_fee, 0) = 0
    )`);
  }

  return {
    whereSql: filters.length ? `WHERE ${filters.join(" AND ")}` : "",
    replacements,
  };
}

function getReportPagination(query) {
  const limit = query.PageLimit ? parseInt(query.PageLimit, 10) : 20;
  const page = query.PageNumber ? parseInt(query.PageNumber, 10) : 1;
  return {
    limit,
    page,
    offset: (page - 1) * limit,
  };
}

function buildMembershipCredits(data) {
  return [
    {
      accountNumberId: process.env.membership_card_fee_ACCOUNT,
      money: data.membership_card_fee || 0,
    },
    {
      accountNumberId: process.env.maintenance_fee_ACCOUNT,
      money: data.maintenance_fee || 0,
    },
    {
      accountNumberId: process.env.renew_fee_ACCOUNT,
      money: data.renew_fee || 0,
    },
    {
      accountNumberId: process.env.fellowship_fund_ACCOUNT || process.env.renew_fee_ACCOUNT,
      money: data.fellowship_fund_fee || 0,
    },
    {
      accountNumberId: process.env.delay_penalty_ACCOUNT,
      money: Number(data.delay_penalty || 0) + Number(data.previous_penalties || 0),
    },
    {
      accountNumberId: process.env.swimming_ACCOUNT,
      money: data.swimming || 0,
    },
    {
      accountNumberId: process.env.value_added_tax_ACCOUNT,
      money: data.value_added_tax || 0,
    },
    {
      accountNumberId: process.env.join_fee_ACCOUNT,
      money: data.join_fee || 0,
    },
    {
      accountNumberId: process.env.installment_ACCOUNT,
      money: data.installment || 0,
    },
    {
      accountNumberId: process.env.first_time_fee_ACCOUNT,
      money: data.first_time_fee || 0,
    },
    {
      accountNumberId: process.env.prev_years_fee_ACCOUNT,
      money: data.prev_years_fee || 0,
    },
    {
      accountNumberId: process.env.seperate_fees_ACCOUNT,
      money: Number(data.seperate_fees || 0) + Number(data.transfer_separation_fee || 0),
    },
    {
      accountNumberId: process.env.new_ref_fees_ACCOUNT,
      money: data.new_ref_fees || 0,
    },
  ].filter((credit) => Number(credit.money) > 0);
}

const numericMembershipFields = new Set([
  "status",
  "member_code",
  "delay_penalty",
  "previous_penalties",
  "maintenance_fee",
  "membership_card_fee",
  "fellowship_fund_fee",
  "transfer_separation_fee",
  "renew_fee",
  "renew_years",
  "total_amount",
  "value_added_tax",
  "is_synced",
  "safe_no",
  "serial_no",
  "swimming",
  "first_time_fee",
  "join_fee",
  "form_no",
  "canceled",
  "secondary",
  "installment",
  "new_ref_fees",
  "prev_years_fee",
  "seperate_fees",
]);

function sanitizeMembershipData(data) {
  const allowedFields = new Set(Object.keys(Memberships.rawAttributes));
  return Object.entries(data || {}).reduce((cleanData, [key, value]) => {
    if (!allowedFields.has(key) || value === "" || value === undefined) {
      return cleanData;
    }

    if (numericMembershipFields.has(key)) {
      cleanData[key] = Number(value || 0);
      return cleanData;
    }

    cleanData[key] = value;
    return cleanData;
  }, {});
}

const GetSpecificMemberShip = catchError(async (req, res, next) => {
  const { member_code } = req.params;

  if (!member_code) {
    logger.warn("Member Code Is Not Provided");
    throw new AppError("Member Code Is Not Provided", 400);
  }

  const specificMember = await Memberships.findOne({
    where: { member_code },
  });

  if (!specificMember) {
    logger.warn("Member not found for the provided code");
    throw new AppError("Member not found for the provided code", 404);
  }

  logger.info("Specific Membership retrieved successfully");
  res.json({ message: "Success", specificMember });
});
const AddMemberShips = catchError(async (req, res, next) => {
  const membershipData = sanitizeMembershipData(req.body.membershipData);

  console.log(membershipData);


  const existingUser = await User.findOne({
    where: { id: membershipData.userId },
  });

  if (!existingUser) {
    logger.warn("User not found with the provided userId");
    return next(new AppError("User not found with the provided userId", 400));
  }

  const transaction = await sequelize.transaction();

  try {
    const existingMember = await Member.findOne({
      where: { member_code: membershipData.member_code },
      transaction,
    });

    if (!existingMember) {
      logger.warn("Invalid member_code: Member not found");
      throw new AppError("Invalid member_code: Member not found", 400);
    }

    const newMembership = await Memberships.create(membershipData, {
      fields: Object.keys(membershipData),
      transaction,
    });

    const Credits = buildMembershipCredits(membershipData);

    const transactionRequest = {
      safeNumber: existingUser.safe_no || null,
      receiptNumber: newMembership.serial_no,
      debit: {
        totalPrice: membershipData.total_amount || 0,
      },
      Credits,
    };

    console.log(transactionRequest);

    const invoiceResult = await Invoice(transactionRequest, membershipData.userId,transaction);

    if (invoiceResult.status === "error") {
      throw new Error(`Invoice creation failed: ${invoiceResult.message}`);
    }

    await transaction.commit();

    logger.info(
      `Membership and invoice created successfully for member_code ${membershipData.member_code}`
    );

    res.status(201).json({
      message: "Membership and invoice created successfully",
      newMembership,
      invoice: invoiceResult.data,
    });
  } catch (error) {
    await transaction.rollback();

    logger.error("Error creating membership and invoice:", error);
    next(new AppError(error.message, 500));
  }
});



const GetAllMemberships = GetAll(Memberships);

const GetAllAddedMempership = catchError(async (req, res, next) => {
  const { startDate, endDate, PageLimit, PageNumber } = req.query;

  const totalAmountSumResult = await Memberships.findOne({
    where: {
      member_order_date: {
        [Op.between]: [startDate, endDate],
      },
      new_ref_fees: {
        [Op.ne]: 0,
      },
    },
    attributes: [[fn("SUM", col("total_amount")), "totalAmountSum"]],
  });
  const totalAmountSum = totalAmountSumResult.getDataValue("totalAmountSum");

  const queryOptions = {
    include: MemberRef,
    where: {
      member_order_date: {
        [Op.between]: [startDate, endDate],
      },
      new_ref_fees: {
        [Op.ne]: 0,
      },
    },
    order: [["member_order_date", "ASC"]], // Sort by member_order_date in ascending order

    limit: PageLimit ? parseInt(PageLimit) : undefined,
    offset: PageNumber ? parseInt(PageNumber) : undefined,
  };

  const count = await Memberships.count(queryOptions);
  const FilteredMembersDetails =
    PageLimit && PageNumber ? await Memberships.findAll(queryOptions) : [];

  res.json({
    count,
    totalAmountSum,
    FilteredMembersDetails,
  });
});

const GetTotalAmountOfAllFields = catchError(async (req, res, next) => {
  const { startDate, endDate } = req.query;
  const queryOptions = {
    attributes: [
      "safe_no",
      [sequelize.fn("sum", sequelize.col("total_amount")), "totalamount"],
      [sequelize.fn("sum", sequelize.col("delay_penalty")), "penalty"],
      [sequelize.fn("sum", sequelize.col("previous_penalties")), "previousPenalties"],
      [sequelize.fn("sum", sequelize.col("maintenance_fee")), "maintainance"],
      [sequelize.fn("sum", sequelize.col("membership_card_fee")), "card"],
      [sequelize.fn("sum", sequelize.col("fellowship_fund_fee")), "fellowshipFund"],
      [sequelize.fn("sum", sequelize.col("transfer_separation_fee")), "transferSeparation"],
      [sequelize.fn("sum", sequelize.col("renew_fee")), "renew"],
      [sequelize.fn("sum", sequelize.col("value_added_tax")), "tax"],
      [sequelize.fn("sum", sequelize.col("swimming")), "swimming"],
      [sequelize.fn("sum", sequelize.col("first_time_fee")), "firsttime"],
      [sequelize.fn("sum", sequelize.col("join_fee")), "joinfees"],
      [sequelize.fn("sum", sequelize.col("installment")), "install"],
      [sequelize.fn("sum", sequelize.col("new_ref_fees")), "newref"],
      [sequelize.fn("sum", sequelize.col("prev_years_fee")), "prev"],
      [sequelize.fn("sum", sequelize.col("seperate_fees")), "seperate"],
    ],
    where: {
      canceled: 0,
    },
    group: ["safe_no"],
  };

  if (startDate && endDate) {
    const parsedStartDate = new Date(startDate);
    const parsedEndDate = new Date(endDate);
    parsedEndDate.setDate(parsedEndDate.getDate() + 1);

    queryOptions.where.member_order_date = {
      [Sequelize.Op.between]: [parsedStartDate, parsedEndDate],
    };
  }

  const result = await Memberships.findAll(queryOptions);

  res.json({ message: "Success", result });
});

const getGroupLabel = (group) => {
  if (Array.isArray(group)) {
    return `count_${group.join("_")}`;
  } else {
    return group.label;
  }
};

const createCountQuery = (group) => {
  // Start with the base part of the query
  const baseQuery = {
    distinct: true,
    col: "member_code",
  };

  // Define conditions based on the group
  if (Array.isArray(group) && group.length > 0) {
    baseQuery.where = { member_type: { [Op.in]: group } };
  } else if (group && group.memberTypes && group.memberTypes.length > 0) {
    baseQuery.where = {
      member_type: { [Op.in]: group.memberTypes },
      ...group.additionalFilters,
    };
  } else if (group && group.additionalFilters) {
    baseQuery.where = {
      ...group.additionalFilters,
    };
  }

  return baseQuery;
};

const createCountQueryRef = (group) => {
  // Start with the base part of the query
  const baseQuery = {
    distinct: false,
    col: "member_code",
  };

  // Define conditions based on the group
  const whereConditions = group.additionalFilters
    ? { ...group.additionalFilters }
    : {};
  if (Array.isArray(group) && group.length > 0) {
    baseQuery.where = { ...whereConditions, member_type: { [Op.in]: group } };
  } else if (group && group.memberTypes && group.memberTypes.length > 0) {
    baseQuery.where = {
      ...whereConditions,
      member_type: { [Op.in]: group.memberTypes },
      ...group.additionalFilters,
    };
  } else if (group && group.additionalFilters) {
    baseQuery.where = {
      ...whereConditions,
    };
  }

  return baseQuery;
};

const getMemberCounts = async (memberTypeGroups, model) => {
  const promises = memberTypeGroups.map(async (group) => {
    const countQuery = createCountQuery(group);
    const label = getGroupLabel(group);
    const count = await model.count(countQuery);
    return { label, count };
  });

  const results = await Promise.all(promises);
  return results.reduce((acc, { label, count }) => {
    acc[label] = count;
    return acc;
  }, {});
};

const getMemberRefCounts = async (memberTypeGroups, model) => {
  const promises = memberTypeGroups.map(async (group) => {
    const countQuery = createCountQueryRef(group);
    const label = getGroupLabel(group);
    const count = await model.count(countQuery);
    return { label, count };
  });

  const results = await Promise.all(promises);
  return results.reduce((acc, { label, count }) => {
    acc[label] = count;
    return acc;
  }, {});
};

const returnAllFIlterdData = catchError(async (req, res, next) => {
  const memberTypeGroups = [
    {
      memberTypes: [1, 5],
      label: "عدد الأعضاء عضو عامل(1,5)",
    },
    {
      memberTypes: [7],
      label: "عدد الأعضاء عضو عامل 7",
    },
    {
      memberTypes: [3],
      label: "عدد الأعضاء عضو منتسب 3",
    },
    {
      memberTypes: [9, 2, 1, 11, 6, 10, 0, 9, 5, 7],
      label: "عدد الأعضاء الكلي",
    },
    {
      memberTypes: [2, 4, 6, 26, 0, 9],
      label: "عدد الأعضاء غير (1,3,5,7)",
    },
    {
      memberTypes: [1],
      additionalFilters: {
        sex: 1,
      },
      label: "عدد الأعضاء عضو عامل(1) وذكور",
    },
    {
      memberTypes: [5],
      additionalFilters: {
        sex: 1,
      },
      label: "عدد الأعضاء عضو عامل(5) وذكور",
    },
    {
      memberTypes: [7],
      additionalFilters: {
        sex: 1,
      },
      label: "عدد الأعضاء عضو عامل(7) وذكور",
    },
    {
      memberTypes: [1],
      additionalFilters: {
        sex: 2,
      },
      label: "عدد الأعضاء عضو عامل(1) وإناث",
    },
    {
      memberTypes: [5],
      additionalFilters: {
        sex: 2,
      },
      label: "عدد الأعضاء عضو عامل(5) وإناث",
    },
    {
      memberTypes: [7],
      additionalFilters: {
        sex: 2,
      },
      label: "عدد الأعضاء عضو عامل(7) وإناث",
    },
    {
      memberTypes: [3],
      additionalFilters: {
        sex: 1,
      },
      label: "عدد الأعضاء عضو منتسب(3) وذكور",
    },
    {
      memberTypes: [3],
      additionalFilters: {
        sex: 2,
      },
      label: "عدد الأعضاء عضو منتسب(3) إناث",
    },
  ];

  const memberTypeGroupsRef = [
    {
      memberTypes: [1, 5],
      label: "عدد الأعضاء التابعين عضو عامل(1,5)",
    },
    {
      memberTypes: [7],
      label: "عدد الأعضاء التابعين عضو عامل 7",
    },
    {
      memberTypes: [],
      additionalFilters: {
        ref: { [Op.in]: [9, 10] },
      },
      label: "عدد الاعضاء التابعين (زوجات)",
    },
  ];

  const counts = await getMemberCounts(memberTypeGroups, Member);

  const countss = await getMemberRefCounts(memberTypeGroupsRef, MemberRef);

  // Sending the response with the counts
  res.json({ message: "Tested", counts, countss });
});

const FilterFamiliesWithEndDateAndType = catchError(async (req, res, next) => {
  const { member_type, startDate, endDate, PageLimit, PageNumber } = req.query;
  if (!member_type) return next(new AppError("Invalid member type", 404));

  let queryOptions = {
    distinct: true,
    col: "member_code",
    where: {
      // renew_fee: {
      //   [Op.gt]: 0,
      // },
      "$membersRef.member_code$": { [Op.ne]: null },
    },
    include: [
      {
        model: MemberRef,
        as: "membersRef",
        attributes: [],
      },
    ],
    limit: PageLimit ? parseInt(PageLimit) : undefined,
    offset: PageNumber ? parseInt(PageNumber) : undefined,
    // logging: console.log,

  };

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    queryOptions.where.end_date = {
      [Op.gte]: start,
      [Op.lte]: end,
    };
  } else if (endDate) {
    const parsedDate = new Date(endDate);
    queryOptions.where.end_date = {
      [Op.lte]: parsedDate,
    };
  }

  if (member_type) {
    queryOptions.include.push({
      model: Member,
      as: "members",
      where: {
        member_type: member_type.split(","),
      },
    });
  }

  const memberships = await Memberships.findAll(queryOptions);

  const uniqueMemberships = memberships.filter(
    (value, index, self) =>
      index === self.findIndex((t) => t.member_code === value.member_code)
  );

  res.json({
    count: uniqueMemberships.length,
    FilteredMembersDetails: uniqueMemberships,
  });
});
// const AddMultipleMemberships = catchError(async (req, res, next) => {
//   const { commonData, membershipsList } = req.body;
//   const { user_id } = req.query;

//   if (!membershipsList || !Array.isArray(membershipsList)) {
//     logger.warn("Invalid data: membershipsList should be an array");
//     return next(
//       new AppError("Invalid data: membershipsList should be an array", 400)
//     );
//   }

//   if (!user_id) {
//     logger.warn("Invalid data: user_id is required");
//     return next(new AppError("Invalid data: user_id is required", 400));
//   }

//   const existingUser = await User.findOne({
//     where: { id: user_id },
//   });

//   if (!existingUser) {
//     logger.warn(`Invalid user_id: User not found for id ${user_id}`);
//     return next(
//       new AppError(`Invalid user_id: User not found for id ${user_id}`, 400)
//     );
//   }

//   const newMemberships = [];
//   const invoices = [];
//   const errors = [];

//   for (const membershipData of membershipsList) {
//     // Merge `commonData` into `membershipData`, with `membershipData` taking precedence
//     const mergedData = { ...commonData, ...membershipData, user_id };

//     // Validate the presence of `commonData` values in `mergedData`
//     for (const key in commonData) {
//       if (!mergedData[key]) {
//         logger.warn(`Missing value for field: ${key} in membership data`);
//         errors.push({
//           member_code: membershipData.member_code || "Unknown",
//           error: `Missing value for field: ${key} in membership data`,
//         });
//         continue;
//       }
//     }

//     try {
//       const existingMember = await Member.findOne({
//         where: { member_code: mergedData.member_code },
//       });

//       if (!existingMember) {
//         logger.warn(
//           `Invalid member_code: Member not found for code ${mergedData.member_code}`
//         );
//         errors.push({
//           member_code: mergedData.member_code,
//           error: `Member not found for code ${mergedData.member_code}`,
//         });
//         continue;
//       }

//       // Create the membership
//       const newMembership = await Memberships.create(mergedData, {
//         fields: Object.keys(mergedData),
//       });
//       newMemberships.push(newMembership);

//       // Prepare transaction request for Invoice
//       const transactionRequest = {
//         safeNumber: existingUser.safe_no || null,
//         receiptNumber: newMembership.serial_no,
//         debit: {
//           totalPrice: mergedData.total_amount || 0,
//         },
//         Credits: [
//           { accountNumberId: process.env.membership_card_fee_ACCOUNT, money: mergedData.membership_card_fee || 0 },
//           { accountNumberId: process.env.maintenance_fee_ACCOUNT, money: mergedData.maintenance_fee || 0 },
//           { accountNumberId: process.env.renew_fee_ACCOUNT, money: mergedData.renew_fee || 0 },
//           { accountNumberId: process.env.delay_penalty_ACCOUNT, money: mergedData.delay_penalty || 0 },
//           { accountNumberId: process.env.swimming_ACCOUNT, money: mergedData.swimming || 0 },
//           { accountNumberId: process.env.value_added_tax_ACCOUNT, money: mergedData.value_added_tax || 0 },
//           { accountNumberId: process.env.join_fee_ACCOUNT, money: mergedData.join_fee || commonData.join_fee || 0 },
//           { accountNumberId: process.env.installment_ACCOUNT, money: mergedData.installment || 0 },
//           { accountNumberId: process.env.first_time_fee_ACCOUNT, money: commonData.first_time_fee || 0 },
//           { accountNumberId: process.env.prev_years_fee_ACCOUNT, money: mergedData.prev_years_fee || 0 },
//         ],
//       };
      

//       console.log(transactionRequest);

//       // Generate Invoice
//       const invoiceResult = await Invoice(transactionRequest, user_id);

//       if (invoiceResult.status === "error") {
//         errors.push({
//           membershipId: newMembership.id,
//           error: `Invoice creation failed: ${invoiceResult.message}`,
//         });
//       } else {
//         invoices.push(invoiceResult.data);
//       }

//       // Log history
//       const lastValues = Object.keys(mergedData).map((field) => ({
//         field: field,
//         value: { from: null, to: mergedData[field] },
//       }));

//       await createHistoryLogOnSubmit({
//         user_id: user_id,
//         action: "Add Membership",
//         member_id: existingMember.id,
//         changed_fields: Object.keys(mergedData),
//         last_values: lastValues,
//       });

//       logger.info(
//         `Membership and invoice created successfully for member_code ${mergedData.member_code}`
//       );
//     } catch (error) {
//       logger.error(
//         `Error processing membership for member_code ${membershipData.member_code}:`,
//         error
//       );
//       errors.push({
//         member_code: membershipData.member_code,
//         error: error.message,
//       });
//     }
//   }

//   logger.info("Multiple Memberships and invoices processed");
//   res.status(201).json({
//     message: "Memberships and invoices processed",
//     newMemberships,
//     invoices,
//     errors,
//   });
// });
// const { sequelize } = require('../dbConnection'); // Import your Sequelize instance

const AddMultipleMemberships = catchError(async (req, res, next) => {
  const { commonData, membershipsList } = req.body;
  const { user_id } = req.query;

  if (!membershipsList || !Array.isArray(membershipsList)) {
    logger.warn("Invalid data: membershipsList should be an array");
    return next(
      new AppError("Invalid data: membershipsList should be an array", 400)
    );
  }

  if (!user_id) {
    logger.warn("Invalid data: user_id is required");
    return next(new AppError("Invalid data: user_id is required", 400));
  }

  const transaction = await sequelize.transaction();

  try {
    const existingUser = await User.findOne({ where: { id: user_id } });
    if (!existingUser) {
      logger.warn(`Invalid user_id: User not found for id ${user_id}`);
      throw new AppError(`Invalid user_id: User not found for id ${user_id}`, 400);
    }

    const newMemberships = [];
    const invoices = [];
    const errors = [];

    for (const membershipData of membershipsList) {
      const mergedData = sanitizeMembershipData({
        ...commonData,
        ...membershipData,
        user_id,
      });
    
      const existingMember = await Member.findOne({
        where: { member_code: mergedData.member_code },
        transaction,
      });
    
      if (!existingMember) {
        logger.warn(
          `Invalid member_code: Member not found for code ${mergedData.member_code}`
        );
        errors.push({
          member_code: mergedData.member_code,
          error: `Member not found for code ${mergedData.member_code}`,
        });
        throw new Error(`Member not found for code ${mergedData.member_code}`); // Throw error to trigger rollback
      }
    
      const newMembership = await Memberships.create(mergedData, {
        fields: Object.keys(mergedData),
        transaction,
      });
      newMemberships.push(newMembership);
    
      const Credits = buildMembershipCredits(mergedData);
    
      const transactionRequest = {
        safeNumber: existingUser.safe_no || null,
        receiptNumber: newMembership.serial_no,
        debit: {
          totalPrice: mergedData.total_amount || 0,
        },
        Credits,
      };
    console.log(transactionRequest);
    
      const invoiceResult = await Invoice(transactionRequest, user_id, transaction);
    
      if (invoiceResult.status === "error") {
        logger.error(
          `Invoice creation failed for membership ${mergedData.member_code}: ${invoiceResult.message}`
        );
        errors.push({
          membershipId: newMembership.id,
          error: `Invoice creation failed: ${invoiceResult.message}`,
        });
        throw new Error(`Invoice creation failed: ${invoiceResult.message}`); // Throw error to rollback
      } else {
        invoices.push(invoiceResult.data);
      }
    
      const lastValues = Object.keys(mergedData).map((field) => ({
        field,
        value: { from: null, to: mergedData[field] },
      }));
    
      await createHistoryLogOnSubmit(
        {
          user_id: user_id,
          action: "Add Membership",
          member_id: existingMember.id,
          changed_fields: Object.keys(mergedData),
          last_values: lastValues,
        },
        { transaction }
      );
    
      logger.info(
        `Membership and invoice created successfully for member_code ${mergedData.member_code}`
      );
    }
    

    if (errors.length > 0) {
      await transaction.rollback();
      logger.error("Errors occurred while processing memberships and invoices");
      return res.status(400).json({
        message: "Some memberships and invoices failed to process",
        errors,
      });
    }

    await transaction.commit();

    logger.info("Multiple Memberships and invoices processed successfully");
    res.status(201).json({
      message: "Memberships and invoices processed successfully",
      newMemberships,
      invoices,
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();

    logger.error("Error processing memberships and invoices:", error);
    next(new AppError(error.message, 500));
  }
});




const GetAllEndedMemberships = catchError(async (req, res, next) => {
  const { start_date, end_date, PageNumber, PageLimit, exclude } = req.query;

  if (!start_date || !end_date) {
    logger.warn("Invalid data: start_date and end_date are required");
    return next(new AppError("Invalid data: start_date and end_date are required", 400));
  }

  const adjustedStartDate = new Date(start_date);
  adjustedStartDate.setDate(adjustedStartDate.getDate() + 1);
  const formattedStartDate = adjustedStartDate.toISOString().split("T")[0];

  const adjustedEndDate = new Date(end_date);
  adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);
  const formattedEndDate = adjustedEndDate.toISOString().split("T")[0];

  // Get all memberships matching the criteria
  const membersWithMemberships = await Memberships.findAll({
    attributes: ["member_code"],
    where: {
      start_date: {
        [Op.eq]: formattedStartDate,
      },
      end_date: {
        [Op.eq]: formattedEndDate,
      },
      canceled: 0,
    },
    group: ["member_code"],
  });

  const memberCodesWithMemberships = membersWithMemberships.map(
    (membership) => membership.member_code
  );

  let memberFilterCondition;

  // Apply filter based on the `exclude` flag
  if (exclude === "true") {
    // Exclude members who have memberships with the given dates
    memberFilterCondition = {
      member_code: {
        [Op.notIn]: memberCodesWithMemberships,
      },
    };
  } else {
    // Include only members who have memberships with the given dates
    memberFilterCondition = {
      member_code: {
        [Op.in]: memberCodesWithMemberships,
      },
    };
  }

  const offset = (parseInt(PageNumber) - 1) * parseInt(PageLimit);

  const totalMembers = await Member.count({
    where: memberFilterCondition,
  });

  const members = await Member.findAll({
    where: memberFilterCondition,
    limit: parseInt(PageLimit),
    offset: offset,
    include: [
      {
        model: Memberships,
        as: "memberships",
        attributes: ["start_date", "end_date", "member_order_time", "member_order_date"],
        where: exclude !== "true" // Only include memberships if not excluding
          ? {
              start_date: {
                [Op.eq]: formattedStartDate,
              },
              end_date: {
                [Op.eq]: formattedEndDate,
              },
              canceled: 0,
            }
          : undefined,
      },
      {
        model: LookupMemberType,
        as: "memberType",
        attributes: ["name"],
      },
    ],
  });

  logger.info(`Total Members: ${totalMembers}`);
  logger.info(`Members Retrieved: ${JSON.stringify(members)}`);

  res.status(200).json({
    message: "Success",
    count: totalMembers,
    PageNumber: parseInt(PageNumber),
    PageLimit: parseInt(PageLimit),
    members,
  });
});



const GetAllAddedRefMempership = catchError(async (req, res, next) => {
  const { startDate, endDate, PageLimit, PageNumber } = req.query;

  if (!startDate || !endDate) {
    logger.warn("Start date or end date is not provided");
    return next(new AppError("Start date and end date are required", 400));
  }

  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (isNaN(parsedStartDate) || isNaN(parsedEndDate)) {
    logger.warn("Invalid date format provided");
    return next(new AppError("Invalid date format", 400));
  }

  const limit = PageLimit ? parseInt(PageLimit) : 10;
  const page = PageNumber ? parseInt(PageNumber) : 1;
  const offset = (page - 1) * limit;

  const { count, rows: filteredMembers } = await MemberRef.findAndCountAll({
    where: {
      join_date: {
        [Op.between]: [parsedStartDate, parsedEndDate],
      },
      deleted: 0,
    },
    include: [
      { model: LookupMemberRef, as: "lookup_ref", attributes: ["name"] },
    ],
    limit,
    offset,
  });

  if (filteredMembers.length === 0) {
    logger.info("No members found within the specified date range");
    return res
      .status(200)
      .json({
        message: "No members found within the specified date range",
        count: 0,
        members: [],
      });
  }

  const totalPages = Math.ceil(count / limit);

  logger.info("Filtered members retrieved successfully");
  res.status(200).json({
    message: "Success",
    count: filteredMembers.length,
    totalRecords: count,
    totalPages,
    currentPage: page,
    members: filteredMembers,
  });
});


const GetFamiliesMembers = catchError(async (req, res, next) => {
  const { startDate, endDate, PageLimit, PageNumber } = req.query;

  if (!startDate || !endDate) {
    return next(new AppError("Invalid start date and end date", 404));
  }

  const pagination = getPagination(PageNumber, PageLimit);

  const queryOptions = {
    distinct: true,
    col: "member_code",
    where: {
      start_date: { [Sequelize.Op.gte]: new Date(startDate) },
      end_date: { [Sequelize.Op.lte]: new Date(endDate) },
    },
    include: [
      {

        model: MemberRef,  
        as: "membersRef",
        where: {
          member_code: { [Sequelize.Op.col]: 'memberships.member_code' }, 
        },
      },
    ],
    ...pagination,
    // logging: console.log,
  };

  const FilteredMemberships = await Memberships.findAndCountAll(queryOptions);

  res.json({
    FilteredMemberships,
  });
});

const GetMembershipReport = catchError(async (req, res, next) => {
  const {
    startDate,
    endDate,
    memberType,
    status,
    operationType,
    PageLimit,
    PageNumber,
  } = req.query;

  const limit = PageLimit ? parseInt(PageLimit, 10) : 20;
  const page = PageNumber ? parseInt(PageNumber, 10) : 1;
  const offset = (page - 1) * limit;
  const whereClause = {};

  if (startDate || endDate) {
    whereClause.member_order_date = {};
    if (startDate) {
      whereClause.member_order_date[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      const parsedEndDate = new Date(endDate);
      parsedEndDate.setHours(23, 59, 59, 999);
      whereClause.member_order_date[Op.lte] = parsedEndDate;
    }
  }

  if (status) {
    whereClause.status = Number(status);
  }

  const positiveAmount = (field) => ({ [field]: { [Op.gt]: 0 } });
  const zeroOrNull = (field) => ({
    [field]: { [Op.or]: [{ [Op.eq]: 0 }, { [Op.is]: null }] },
  });
  if (operationType === "new") {
    whereClause[Op.or] = [
      positiveAmount("join_fee"),
      positiveAmount("first_time_fee"),
    ];
  } else if (operationType === "renew") {
    whereClause[Op.and] = [
      {
        [Op.or]: [
          positiveAmount("renew_fee"),
          positiveAmount("prev_years_fee"),
          positiveAmount("delay_penalty"),
          positiveAmount("maintenance_fee"),
          positiveAmount("membership_card_fee"),
          positiveAmount("fellowship_fund_fee"),
          positiveAmount("transfer_separation_fee"),
        ],
      },
      zeroOrNull("join_fee"),
      zeroOrNull("first_time_fee"),
    ];
  } else if (operationType === "swimming") {
    whereClause[Op.and] = [
      positiveAmount("swimming"),
      zeroOrNull("join_fee"),
      zeroOrNull("first_time_fee"),
      zeroOrNull("renew_fee"),
      zeroOrNull("prev_years_fee"),
    ];
  }

  const memberWhere = {};
  if (memberType) {
    memberWhere.member_type = Number(memberType);
  }

  const { count, rows } = await Memberships.findAndCountAll({
    where: whereClause,
    distinct: true,
    include: [
      {
        model: Member,
        as: "members",
        attributes: ["member_code", "name", "member_type"],
        where: memberWhere,
        required: !!memberType,
        include: [
          {
            model: LookupMemberType,
            as: "memberType",
            attributes: ["name"],
          },
        ],
      },
    ],
    order: [["member_order_date", "DESC"], ["member_order_time", "DESC"]],
    limit,
    offset,
  });

  res.status(200).json({
    message: "Success",
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    rows,
  });
});

const GetReceiptItemsReport = catchError(async (req, res, next) => {
  const { whereSql, replacements } = buildReportFilters(req.query);
  const { limit, page, offset } = getReportPagination(req.query);
  const moneySelect = receiptReportFields
    .map((field) => `COALESCE(m.${field}, 0) AS ${field}`)
    .join(",\n      ");
  const totalSelect = receiptReportFields
    .map((field) => `COALESCE(SUM(m.${field}), 0) AS ${field}`)
    .join(",\n      ");

  const rows = await sequelize.query(
    `
    SELECT
      m.id,
      m.member_code,
      mem.name AS member_name,
      mem.member_type,
      lmt.name AS member_type_name,
      m.status,
      m.safe_no,
      m.serial_no,
      m.member_order_date,
      m.member_order_time,
      m.start_date,
      m.end_date,
      ${moneySelect}
    FROM memberships m
    LEFT JOIN members mem ON mem.member_code = m.member_code
    LEFT JOIN lookup_member_type lmt ON lmt.code = mem.member_type
    ${whereSql}
    ORDER BY m.member_order_date DESC, m.member_order_time DESC
    LIMIT :limit OFFSET :offset
    `,
    {
      replacements: { ...replacements, limit, offset },
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  const countRows = await sequelize.query(
    `
    SELECT COUNT(*)::int AS count
    FROM memberships m
    LEFT JOIN members mem ON mem.member_code = m.member_code
    ${whereSql}
    `,
    {
      replacements,
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  const totalsRows = await sequelize.query(
    `
    SELECT ${totalSelect}
    FROM memberships m
    LEFT JOIN members mem ON mem.member_code = m.member_code
    ${whereSql}
    `,
    {
      replacements,
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  const count = Number(countRows[0]?.count || 0);
  res.status(200).json({
    message: "Success",
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    totals: totalsRows[0] || {},
    rows,
  });
});

const GetSafeDailyReport = catchError(async (req, res, next) => {
  const { whereSql, replacements } = buildReportFilters(req.query);
  const { limit, page, offset } = getReportPagination(req.query);

  const rows = await sequelize.query(
    `
    SELECT
      m.id,
      m.safe_no,
      m.serial_no,
      m.member_code,
      mem.name AS member_name,
      lmt.name AS member_type_name,
      m.member_order_date,
      m.member_order_time,
      m.total_amount,
      m.delay_penalty,
      m.previous_penalties,
      m.maintenance_fee,
      m.membership_card_fee,
      m.fellowship_fund_fee,
      m.transfer_separation_fee,
      m.renew_fee,
      m.value_added_tax,
      m.swimming,
      m.first_time_fee,
      m.join_fee,
      m.installment,
      m.new_ref_fees,
      m.prev_years_fee,
      m.seperate_fees
    FROM memberships m
    LEFT JOIN members mem ON mem.member_code = m.member_code
    LEFT JOIN lookup_member_type lmt ON lmt.code = mem.member_type
    ${whereSql}
    ORDER BY m.member_order_date DESC, m.member_order_time DESC
    LIMIT :limit OFFSET :offset
    `,
    {
      replacements: { ...replacements, limit, offset },
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  const countRows = await sequelize.query(
    `
    SELECT COUNT(*)::int AS count
    FROM memberships m
    LEFT JOIN members mem ON mem.member_code = m.member_code
    ${whereSql}
    `,
    {
      replacements,
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  const safeTotals = await sequelize.query(
    `
    SELECT
      COALESCE(m.safe_no::text, 'خزينة الأدمن') AS safe_no,
      COUNT(*)::int AS receipt_count,
      COALESCE(SUM(m.total_amount), 0) AS total_amount,
      COALESCE(SUM(m.delay_penalty), 0) AS delay_penalty,
      COALESCE(SUM(m.previous_penalties), 0) AS previous_penalties,
      COALESCE(SUM(m.maintenance_fee), 0) AS maintenance_fee,
      COALESCE(SUM(m.membership_card_fee), 0) AS membership_card_fee,
      COALESCE(SUM(m.fellowship_fund_fee), 0) AS fellowship_fund_fee,
      COALESCE(SUM(m.transfer_separation_fee), 0) AS transfer_separation_fee,
      COALESCE(SUM(m.renew_fee), 0) AS renew_fee,
      COALESCE(SUM(m.value_added_tax), 0) AS value_added_tax,
      COALESCE(SUM(m.swimming), 0) AS swimming,
      COALESCE(SUM(m.first_time_fee), 0) AS first_time_fee,
      COALESCE(SUM(m.join_fee), 0) AS join_fee,
      COALESCE(SUM(m.installment), 0) AS installment,
      COALESCE(SUM(m.new_ref_fees), 0) AS new_ref_fees,
      COALESCE(SUM(m.prev_years_fee), 0) AS prev_years_fee,
      COALESCE(SUM(m.seperate_fees), 0) AS seperate_fees
    FROM memberships m
    LEFT JOIN members mem ON mem.member_code = m.member_code
    ${whereSql}
    GROUP BY COALESCE(m.safe_no::text, 'خزينة الأدمن')
    ORDER BY safe_no
    `,
    {
      replacements,
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  const count = Number(countRows[0]?.count || 0);
  res.status(200).json({
    message: "Success",
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    safeTotals,
    rows,
  });
});

const GetAccountingReviewReport = catchError(async (req, res, next) => {
  const hasReviewFilter = [
    "startDate",
    "endDate",
    "memberType",
    "status",
    "operationType",
    "safeNo",
    "serialNo",
    "memberCode",
  ].some((key) => req.query[key]);

  if (!hasReviewFilter) {
    return res.status(200).json({
      message: "Select at least one filter to review accounting entries",
      count: 0,
      totalPages: 1,
      currentPage: 1,
      summary: {},
      rows: [],
    });
  }

  const { whereSql, replacements } = buildReportFilters(req.query);
  const { limit, page, offset } = getReportPagination(req.query);
  const problemFilter = req.query.onlyProblems === "true"
    ? `WHERE review_status <> 'balanced'`
    : "";

  const baseQuery = `
    WITH review AS (
      SELECT
        m.id,
        m.member_code,
        mem.name AS member_name,
        lmt.name AS member_type_name,
        m.safe_no,
        m.serial_no,
        m.member_order_date,
        m.member_order_time,
        COALESCE(m.total_amount, 0)::numeric AS debit_total,
        t."Id" AS transaction_id,
        t."Canceled" AS transaction_canceled,
        COALESCE(SUM(ta."Money"), 0)::numeric AS credit_total,
        ROUND((COALESCE(m.total_amount, 0) - COALESCE(SUM(ta."Money"), 0))::numeric, 2) AS difference,
        CASE
          WHEN t."Id" IS NULL THEN 'missing_transaction'
          WHEN ROUND((COALESCE(m.total_amount, 0) - COALESCE(SUM(ta."Money"), 0))::numeric, 2) = 0 THEN 'balanced'
          ELSE 'difference'
        END AS review_status
      FROM memberships m
      LEFT JOIN members mem ON mem.member_code = m.member_code
      LEFT JOIN lookup_member_type lmt ON lmt.code = mem.member_type
      LEFT JOIN clubtheclub."Transactions" t ON t."ReceiptNumber" = m.serial_no
      LEFT JOIN clubtheclub."Transaction_AccountNumbers" ta ON ta."TransactionId" = t."Id"
      ${whereSql}
      GROUP BY
        m.id,
        m.member_code,
        mem.name,
        lmt.name,
        m.safe_no,
        m.serial_no,
        m.member_order_date,
        m.member_order_time,
        m.total_amount,
        t."Id",
        t."Canceled"
    )
  `;

  const rows = await sequelize.query(
    `
    ${baseQuery}
    SELECT *
    FROM review
    ${problemFilter}
    ORDER BY member_order_date DESC, member_order_time DESC
    LIMIT :limit OFFSET :offset
    `,
    {
      replacements: { ...replacements, limit, offset },
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  const countRows = await sequelize.query(
    `
    ${baseQuery}
    SELECT COUNT(*)::int AS count
    FROM review
    ${problemFilter}
    `,
    {
      replacements,
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  const summaryRows = await sequelize.query(
    `
    ${baseQuery}
    SELECT
      COUNT(*)::int AS receipt_count,
      COALESCE(SUM(debit_total), 0) AS debit_total,
      COALESCE(SUM(credit_total), 0) AS credit_total,
      COALESCE(SUM(difference), 0) AS difference,
      SUM(CASE WHEN review_status = 'balanced' THEN 1 ELSE 0 END)::int AS balanced_count,
      SUM(CASE WHEN review_status = 'missing_transaction' THEN 1 ELSE 0 END)::int AS missing_transaction_count,
      SUM(CASE WHEN review_status = 'difference' THEN 1 ELSE 0 END)::int AS difference_count
    FROM review
    `,
    {
      replacements,
      type: Sequelize.QueryTypes.SELECT,
    }
  );

  const count = Number(countRows[0]?.count || 0);
  res.status(200).json({
    message: "Success",
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
    summary: summaryRows[0] || {},
    rows,
  });
});

const GetExpiredMemberships = catchError(async (req, res, next) => {
  const { startDate, endDate, PageLimit, PageNumber } = req.query;

  if (!startDate || !endDate) {
    return next(new AppError("Invalid start date and end date", 404));
  }

  const pagination = getPagination(PageNumber, PageLimit);

  // First, get the latest `member_order_time` for each `member_code` where all have status = 2
  const latestMemberships = await Memberships.findAll({
    attributes: [
      'member_code',
      [Sequelize.fn('MAX', Sequelize.col('member_order_time')), 'latest_order_time']
    ],
    group: ['member_code'],
    having: Sequelize.literal(`
      COUNT(CASE WHEN status != 2 THEN 1 END) = 0
    `),
    raw: true,
    where: {
      member_code: { [Sequelize.Op.ne]: null }, // Exclude null member_code
    }
  });

  // Extract `member_code` and `latest_order_time` pairs
  const latestMembershipsMap = latestMemberships.reduce((map, item) => {
    map[item.member_code] = item.latest_order_time;
    return map;
  }, {});

  // Now, query the memberships that match the criteria
  const queryOptions = {
    where: {
      member_code: { 
        [Sequelize.Op.in]: Object.keys(latestMembershipsMap),
        [Sequelize.Op.ne]: null, // Exclude null member_code
      },
      member_order_date: { [Sequelize.Op.in]: Object.values(latestMembershipsMap) },
      status: 2,
      canceled: 0,
      start_date: { 
        [Sequelize.Op.gte]: new Date(startDate),
        [Sequelize.Op.ne]: null, // Exclude null start_date
      },
      end_date: { 
        [Op.eq]: new Date(endDate),
        [Sequelize.Op.ne]: null, // Exclude null end_date
      },
    },
    include: [
      {
        model: Member, // Assuming your `Members` model is named `Members`
        as: 'members',  // Adjust the alias based on your association
      },
    ],
    ...pagination,
    logging: console.log,
  };

  const ExpiredMemberships = await Memberships.findAndCountAll(queryOptions);

  res.json({
    ExpiredMemberships,
  });
});


const GetMembersByInstallmentType = catchError(async (req, res, next) => {
  const { installmentType, startDate, endDate, PageLimit, PageNumber } = req.query;

  if (!installmentType) {
    return next(new AppError("Invalid installment type", 400));
  }

  const limit = PageLimit ? parseInt(PageLimit) : 10;
  const page = PageNumber ? parseInt(PageNumber) : 1;
  const offset = (page - 1) * limit;

  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  const queryOptions = {
    where: {
      InstallmentType: installmentType,
      canceled: 0,
join_fee: { [Op.ne]: 0 }

    },
    include: [
      {
        model: Member,
        as: "members",
        attributes: ["member_code", "name", "sex", "birth_date"],
        where: {
          member_code: { [Sequelize.Op.col]: "memberships.member_code" },
        },
      },
    ],
    limit,
    offset,
  };

  if (start && end) {
    queryOptions.where.member_order_date = {
      [Op.between]: [start, end],
    };
  } else if (start) {
    queryOptions.where.member_order_date = {
      [Op.gte]: start,
    };
  } else if (end) {
    queryOptions.where.member_order_date = {
      [Op.lte]: end,
    };
  }

  const { count, rows: filteredMemberships } = await Memberships.findAndCountAll(queryOptions);

  if (filteredMemberships.length === 0) {
    logger.info("No members found with the specified installment type and date range");
    return res.status(200).json({
      message: "No members found with the specified installment type and date range",
      count: 0,
      members: [],
    });
  }

  const totalPages = Math.ceil(count / limit);

  logger.info("Filtered members retrieved successfully");
  res.status(200).json({
    message: "Success",
    count: filteredMemberships.length,
    totalRecords: count,
    totalPages,
    currentPage: page,
    members: filteredMemberships,
  });
});





module.exports = {
  GetSpecificMemberShip,
  AddMemberShips,
  GetAllMemberships,
  GetAllAddedRefMempership,
  GetAllAddedMempership,
  AddMultipleMemberships,
  GetTotalAmountOfAllFields,
  GetAllEndedMemberships,
  returnAllFIlterdData,
  FilterFamiliesWithEndDateAndType,
  GetFamiliesMembers,
  GetExpiredMemberships,
  GetMembersByInstallmentType,
  GetMembershipReport,
  GetReceiptItemsReport,
  GetSafeDailyReport,
  GetAccountingReviewReport
};
