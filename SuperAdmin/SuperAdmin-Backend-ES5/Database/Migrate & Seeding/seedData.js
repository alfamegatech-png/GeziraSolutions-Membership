const { LookupRoles } = require("../models/LookupRoles.js");
const { LookupUserRoles } = require("../models/LookupUserRoles.js");
const { User } = require("../models/user.js");
const { seedDataRoles, seedSuperAdminUser, seedUserRole: initialUserRoles } = require("../seed-data.js");
const { synchronizeTables } = require("./migrate.js");

async function seedRoles() {
  try {
    const existingRecords = await LookupRoles.findAll();
    if (existingRecords.length === 0) {
      await LookupRoles.bulkCreate(seedDataRoles);
    }
  } catch (error) {
    console.error("Error seeding roles table:", error);
    console.error(error.stack);
  }
}

async function seedUsers() {
  try {
    const existingRecords = await User.findAll();
    if (existingRecords.length === 0) {
      await User.bulkCreate(seedSuperAdminUser);
    }
  } catch (error) {
    console.error("Error seeding users table:", error);
    console.error(error.stack);
  }
}

async function seedUserRole() {
  try {
    const existingRecords = await LookupUserRoles.findAll();
    if (existingRecords.length === 0) {
      await LookupUserRoles.bulkCreate(initialUserRoles);
    }
  } catch (error) {
    console.error("Error seeding user roles table:", error);
    console.error(error.stack);
  }
}

async function seedData() {
  try {
    await synchronizeTables();
    await seedRoles();
    await seedUsers();
    await seedUserRole();
  } catch (error) {
    console.error("Error seeding data:", error);
    console.error(error.stack);
  }
}

module.exports = {
  seedData: seedData,
  seedRoles: seedRoles,
  seedUsers: seedUsers,
  seedUserRole: seedUserRole
};
