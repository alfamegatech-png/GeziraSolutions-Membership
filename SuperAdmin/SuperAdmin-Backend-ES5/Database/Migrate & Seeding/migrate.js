const { LookupRoles } = require("../models/LookupRoles");
const { LookupUserRoles } = require("../models/LookupUserRoles");
const { User } = require("../models/user");


async function synchronizeTables() {
  try {
    await LookupRoles.sync({ force: false });
    await User.sync({ force: false });

    await LookupUserRoles.sync({ force: false });
  } catch (error) {
    console.error("Error creating/synchronizing the Tables:", error);
    console.error(error.stack);
  }
}

module.exports = {
  synchronizeTables
};
