const Joi = require("joi");

const GetAllEndedMembershipsSchema = Joi.object({
    PageNumber: Joi.number().integer().min(1).optional(),
    PageLimit: Joi.number().integer().min(1).max(100).optional(),
    date: Joi.string().messages({
        'date.base': `"date" should be a valid date in ISO format`
    })
});

const MembersFilterV2Schema = Joi.object({
    PageNumber: Joi.number().integer().min(1).optional(),
    PageLimit: Joi.number().integer().min(1).max(100).optional(),
    Range: Joi.boolean().optional(),
    filters: Joi.array().optional,
});

const FilterOnlySwiming = Joi.object({
    PageNumber: Joi.number().integer().min(1).optional(),
    PageLimit: Joi.number().integer().min(1).max(100).optional(),
    Range: Joi.boolean().optional(),
    filters: Joi.array().optional,
});

module.exports = {
    GetAllEndedMembershipsSchema,
    MembersFilterV2Schema,
    FilterOnlySwiming
};
