const seedDataRoles = [
  { id: 1, name: "Super Admin" },
  { id: 2, name: "Admin" },
  { id: 3, name: "User" },
];

const seedSuperAdminUser = process.env.SUPERADMIN_INITIAL_PASSWORD ? [
  {
    id: "60d34866-f598-430f-a549-08c1611eb3b4",
    name: process.env.SUPERADMIN_INITIAL_EMAIL || "Admin@gmail.com",
    email: process.env.SUPERADMIN_INITIAL_EMAIL || "Admin@gmail.com",
    password: process.env.SUPERADMIN_INITIAL_PASSWORD,
    CreatedBy: "initial_seed",
    UpdatedBy: "initial_seed",
  },
]: [];

const seedUserRole = process.env.SUPERADMIN_INITIAL_PASSWORD ? [
  {
    UserID: "60d34866-f598-430f-a549-08c1611eb3b4",
    RoleId: 1,
  },
]: [];

module.exports = {
  seedDataRoles: seedDataRoles,
  seedSuperAdminUser: seedSuperAdminUser,
  seedUserRole: seedUserRole
};
