const { Op, Sequelize } = require("sequelize");

const { Memberships } = require("../../../Database/models/membership.js");
const { MemberRef } = require("../../../Database/models/member_ref.js");
const { catchError } = require("../../utils/Catch Error.js");
const { AppError } = require("../../utils/AppError.js");
const { logger } = require("../../utils/logger.js");
const History = require("../../../Database/models/history.js");

const GetAll = (model) => {
  return catchError(async (req, res, next) => {
    const { pageLimit, pageNumber } = req.query;
    const pagination = getPagination(pageNumber, pageLimit);
    const models = await model.findAndCountAll({
      order: [["id", "DESC"]], 
      ...pagination,
    });
    const modelName = model.name;

    res.status(200).json({ message: `success `, rows: models });
    logger.info("success");
  });
};
const GetAllWithInclude = (model) => {
  return catchError(async (req, res, next) => {
    const models = await model.findAll({
      include: [{ all: true }],
    });
    const modelName = model.name;

    res.status(200).json({ message: `success `, rows: models });
    logger.info("success");
  });
};
const UpdateByIdGeneric = (model) => {
  return catchError(async (req, res, next) => {
    const id = req.query.id; // Assuming 'id' is the common identifier
    const updateData = req.body;

    // Validate incoming data keys against model attributes
    const validKeys = Object.keys(model.rawAttributes);
    const validatedData = Object.keys(updateData)
      .filter((key) => validKeys.includes(key)) // Keep only valid keys
      .reduce((obj, key) => {
        obj[key] = updateData[key];
        return obj;
      }, {});

    const [updated] = await model.update(validatedData, { where: { id } });

    if (updated) {
      const updatedModel = await model.findByPk(id);
      res
        .status(200)
        .json({ message: `Successfully updated`, data: updatedModel });
      logger.info(`Successfully updated ${model.name}`);
    } else {
      next(new AppError(`${model.name} not found or not updated`, 404));
      logger.warn(`${model.name} with ID ${id} not found or not updated`);
    }
  });
};
const DeleteByIdGeneric = (model) => {
  return catchError(async (req, res, next) => {
    const id = req.query.id;

    if (!id || isNaN(Number(id))) {
      return next(new AppError(`Invalid ID provided for ${model.name}`, 400));
    }

    const deleted = await model.destroy({
      where: { id },
    });

    if (deleted) {
      res.status(200).json({ message: `${model.name} successfully deleted` });
      logger.info(`${model.name} with ID ${id} successfully deleted`);
    } else {
      next(new AppError(`${model.name} not found with ID ${id}`, 404));
      logger.warn(
        `${model.name} with ID ${id} not found or could not be deleted`
      );
    }
  });
};

const AddNewGeneric = (model) => {
  return catchError(async (req, res, next) => {
    const newData = req.body;

    const validKeys = Object.keys(model.rawAttributes);
    const validatedData = Object.keys(newData)
      .filter((key) => validKeys.includes(key))
      .reduce((obj, key) => {
        obj[key] = newData[key];
        return obj;
      }, {});

    try {
      const existingRecord = await model.findOne({ where: validatedData });
      if (existingRecord) {
        return res
          .status(400)
          .json({ message: `Record already exists`, data: existingRecord });
      }

      const createdModel = await model.create(validatedData);

      if (createdModel) {
        res
          .status(201)
          .json({ message: `Successfully added`, data: createdModel });
        logger.info(`Successfully added new ${model.name}`);
      } else {
        next(new AppError(`Failed to add new ${model.name}`, 400));
        logger.warn(`Failed to add new ${model.name}`);
      }
    } catch (error) {
      next(error); 
    }
  });
};

const MembersFilter = (model) => {
  return catchError(async (req, res, next) => {
    const { member_type, sex, PageLimit, PageNumber } = req.query;
    const whereClause = {};

    if (member_type) {
      whereClause.member_type = member_type.split(",");
    }
    if (sex) {
      whereClause.sex = sex.split(",").map(Number);
    }

    const options = {
      where: whereClause,
      limit: PageLimit ? parseInt(PageLimit) : undefined,
      offset: PageNumber ? parseInt(PageNumber) : undefined,
    };

    const FilteredMembersCount = await model.count(options);

    const FilteredMembersDetails =
      PageLimit && PageNumber ? await model.findAll(options) : [];

    logger.info("Success");
    res.json({
      message: "Success",
      FilteredMembersCount,
      FilteredMembersDetails,
    });
  });
};
const MembersFilterV2 = (model) => {
  return catchError(async (req, res, next) => {
    const { tableName, filters } = req.body;
    const { PageNumber, PageLimit, Range } = req.query;

    const whereClauses = { [tableName]: {} };
    const includeAssociations = [];

    const processFilter = (filter) => {
      const isRangeFilter = Range === "true" && filter.value.includes(",");
      const isDateFilter = filter.type === "date";
      let from, to, condition;
      if (filter.value === "!0") {
        condition = { [Op.ne]: 0 };
      } else if (filter.value === "<0") {
        condition = { [Op.gt]: 0 };
      } else if (isRangeFilter) {
        [from, to] = filter.value
          .split(",")
          .map((val) =>
            isDateFilter ? new Date(val.trim()) : parseInt(val.trim())
          );
        condition =
          from && to
            ? { [Op.between]: [from, to] }
            : from
            ? { [Op.gte]: from }
            : { [Op.lte]: to };
      } else {
        condition = isDateFilter ? new Date(filter.value)+1 : filter.value;
      }

      return { condition, isRangeFilter };
    };

    filters.forEach((filter) => {
      const { condition } = processFilter(filter);

      if (filter.table === tableName) {
        whereClauses[tableName][filter.columnName] = condition;
      } else {
        const tableClause = whereClauses[filter.table] || {};
        tableClause[filter.columnName] = condition;
        whereClauses[filter.table] = tableClause;

        const association = model.associations[filter.table];
        if (association) {
          includeAssociations.push({
            model: association.target,
            as: filter.table,
            where: tableClause,
            required: true,
            attributes: [
              "member_code",
              "end_date",
              "member_order_date",
              "total_amount",
              "serial_no",
              "remark",
            ],

            raw: true,
          });
        }
      }
    });

    const queryOptions = {
      where: whereClauses[tableName],
      include: includeAssociations,
      // col: "member_code",
      // attributes: ["member_code", "name", "birth_date"],
      limit: PageLimit,
      offset: PageNumber,
      distinct: true,
      logging: console.log,
    };

    const isPaginationProvided = PageNumber && PageLimit;
    if (isPaginationProvided) {
      queryOptions.limit = parseInt(PageLimit);
      queryOptions.offset = (parseInt(PageNumber) - 1) * parseInt(PageLimit);
    }

    const count = await model.findAndCountAll(queryOptions);
    res.json({ message: "Success", count });
  });
};

const MembersFilterV2CountOnly = (model) => {
  return catchError(async (req, res, next) => {
    const { tableName, filters } = req.body;
    const { PageNumber, PageLimit, Range } = req.query;

    // Initialize where clauses and include associations outside of the loop for efficiency
    const whereClauses = { [tableName]: {} };
    const includeAssociations = [];

    // Function to process each filter
    const processFilter = (filter) => {
      const isRangeFilter = Range === "true" && filter.value.includes(",");
      const isDateFilter = filter.type === "date";
      let from, to, condition;
      if (filter.value === "!0") {
        condition = { [Op.ne]: 0 }; // Handle special case where value is not equal to 0
      } else if (filter.value === "=0") {
        condition = { [Op.eq]: 0 }; // Handle special case where value is not equal to 0
      } else if (isRangeFilter) {
        [from, to] = filter.value
          .split(",")
          .map((val) =>
            isDateFilter ? new Date(val.trim()) : parseInt(val.trim())
          );
        condition =
          from && to
            ? { [Op.between]: [from, to] }
            : from
            ? { [Op.gte]: from }
            : { [Op.lte]: to };
      } else {
        condition = isDateFilter ? new Date(filter.value) : filter.value;
      }

      return { condition, isRangeFilter };
    };

    filters.forEach((filter) => {
      const { condition } = processFilter(filter);

      if (filter.table === tableName) {
        whereClauses[tableName][filter.columnName] = condition;
      } else {
        // Ensure initialization of nested where clause for associated tables
        const tableClause = whereClauses[filter.table] || {};
        tableClause[filter.columnName] = condition;
        whereClauses[filter.table] = tableClause;

        const association = model.associations[filter.table];
        if (association) {
          includeAssociations.push({
            model: association.target,
            as: filter.table,
            where: tableClause,
            required: true,
            // attributes: ["member_code"], // Specify only member_code to be returned
            // group:["memberships.member_code","Member.id"]
            raw: true, //
          });
        }
      }
    });

    const queryOptions = {
      where: whereClauses[tableName],
      include: includeAssociations,
      // attributes: ["member_code", "name"], // Specify only member_code to be returned
      // limit: PageLimit,
      // offset: PageNumber,
      distinct: true,
      //logging: console.log,
      // group:["Member.member_code","Member.id","Member.name","memberships.member_code","memberships.end_date","memberships.member_order_date"],
      // raw: true
    };

    // Adjust pagination if provided
    // const isPaginationProvided = PageNumber && PageLimit;
    // if (isPaginationProvided) {
    //   queryOptions.limit = parseInt(PageLimit);
    //   queryOptions.offset = (parseInt(PageNumber) - 1) * parseInt(PageLimit);
    // }

    // const countOptions = { ...queryOptions };
    // delete countOptions.limit;
    // delete countOptions.offset;

    // const count = await model.findAndCountAll(queryOptions);
    const count = await model.count(queryOptions);

    res.json({ message: "Success", count });
    // Execute findAll if pagination is applied
  });
};
const CountMembers = (model) => {
  return catchError(async (req, res, next) => {
    const filters = req.body;

    if (!Array.isArray(filters) || filters.length === 0) {
      logger.warn("Invalid input format");
      throw new AppError("Input must be an array of filter objects", 400);
    }

    const counts = await Promise.all(
      filters.map(async (filter, index) => {
        const whereClause = {};

        if (filter.member_type) {
          whereClause.member_type = { [Op.in]: filter.member_type };
        }

        if (filter.sex) {
          whereClause.sex = { [Op.in]: filter.sex };
        }

        const count = await model.count({ where: whereClause ,
          logging:console.log
        });
        console.log(count);
        
        return {
          filter: `Filter ${index + 1}`,
          // criteria: filter,
          count: count,
        };
      })
    );

    res.json({ counts });
  });
};
const getPagination = (pageNumber, pageLimit) => {
  const limit = pageLimit ? parseInt(pageLimit, 10) : undefined;
  const offset = pageNumber
    ? (parseInt(pageNumber, 10) - 1) * limit
    : undefined;
  return {
    limit: limit,
    offset: offset,
  };
};

async function createHistoryLogOnSubmit({
  user_id,
  action,
  member_id,
  changed_fields,
  last_values,
}) {
  try {
    const historyEntry = await History.create({
      user_id,
      action,
      member_id,
      changed_fields,
      last_values,
    });
    return historyEntry;
  } catch (error) {
    console.error("Error creating history log:", error);
    throw error;
  }
}

















module.exports = {
  GetAll,
  MembersFilter,
  MembersFilterV2,
  MembersFilterV2CountOnly,
  CountMembers,
  UpdateByIdGeneric,
  AddNewGeneric,
  getPagination,
  DeleteByIdGeneric,
  createHistoryLogOnSubmit,
};





