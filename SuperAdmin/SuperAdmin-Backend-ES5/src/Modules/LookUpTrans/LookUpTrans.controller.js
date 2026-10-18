const { Op } = require('sequelize');
const { catchError } = require('../../utils/Catch Error.js');
const { AppError } = require('../../utils/AppError.js');
const lookupTrans = require('../../../Database/models/lookup_trans.js').lookupTrans;
const Memberships = require('../../../Database/models/membership.js').Memberships;


const GetAllMembersWithTransType = catchError((req, res, next) => {
  const { SeperateType, StartDate, EndDate } = req.body;

  if (SeperateType) {
    lookupTrans.findOne({
      where: {
        code: SeperateType,
        IsSeperated: true,
      },
    });
  } else {
    return next(new AppError("Seperate Type Is Not Valid", 400));
  }
  // const GetMembers = Memberships.findAll({
  //   where: {
  //     SeparateId: SeperateType,
  //     member_order_date: Op.gte(StartDate),
  //     member_order_date: Op.lte(EndDate),
  //   },
  //   include: [
  //     {
  //       model: Member,
  //       as: "Member",
  //     },
  //   ],
  // });
  res.status(200).json(GetMembers);
});

module.exports = {
  GetAllMembersWithTransType: GetAllMembersWithTransType
};
