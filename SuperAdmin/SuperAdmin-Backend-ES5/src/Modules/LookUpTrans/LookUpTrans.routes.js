const express = require('express');
const { GetAllMembersWithTransType } = require('./LookUpTrans.controller.js');

const lookupTransRouter = express.Router();

lookupTransRouter.post('/GetAllMembersWithTransType', GetAllMembersWithTransType);

module.exports = {
  lookupTransRouter: lookupTransRouter
};
