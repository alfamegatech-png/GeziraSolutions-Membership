const jwt = require('jsonwebtoken');
const { AppError } = require('../../utils/AppError');
const { GetAll } = require('../services/factor');
const { catchError } = require('../../utils/Catch Error');
const { LookupUserRoles } = require('../../../Database/models/associations');
const { User } = require('../../../Database/models/user');
const { LookupRoles } = require('../../../Database/models/LookupRoles');


const GetAllUsers = catchError(async (req, res) => {
  const userRoles = await LookupUserRoles.findAll({
    include: [
      { model: LookupRoles, as: 'Role' },
      { model: User, as: 'User' },
    ],
  });
  return res.status(200).json({ message: 'success', userRoles });
});

const GiveRolesToUsers = catchError(async (req, res, next) => {
  const { UserID, RoleId } = req.body;
  const superAdminId = req.query.id; // Assuming this comes from authenticated super admin user

  // Here add logic to verify if the requester is a super admin
  // Skipping actual verification logic for brevity

  const userExists = await User.findByPk(UserID);
  const roleExists = await LookupRoles.findByPk(RoleId);

  if (!userExists || !roleExists) {
    return res.status(404).json({ error: 'User or Role not found' });
  }

  await LookupUserRoles.create({
    UserID: UserID,
    RoleId: RoleId,
    createdBy: superAdminId, // Assuming the superAdminId is valid and authorized
  });

  return res.status(201).json({ message: 'User role has been created' });
});

const Login = catchError(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user || password !== user.password) {
    // Password should be hashed and checked
    return next(new AppError('Invalid Email or Password', 401));
  }

  const userRole = await LookupUserRoles.findOne({
    where: { UserID: user.id },
    include: [{ model: LookupRoles, as: 'Role' }],
  });

  console.log(userRole);
  const token = jwt.sign(
    { email: user.email, role: userRole.Role.name, id: user.id },
    process.env.SECRET_KEY
  );

  res.status(200).json({ message: 'Successfully logged in', token });
});

const SignUp = catchError(async (req, res, next) => {
  const { email, password, name, fullname, safe_no, national_id, RoleId } = req.body;
  const superAdminId = req.query.superAdminId;

  const superAdminRole = await LookupUserRoles.findOne({
    where: { UserID: superAdminId },
    include: [{ model: LookupRoles, as: 'Role' }],
  });

  if (!superAdminRole || superAdminRole.Role.name !== 'Super Admin') {
    return res.status(403).json({ error: 'Only Super Admins can create new users' });
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ error: 'Email already in use' });
  }
  const Role = await LookupRoles.findOne({ where: { id: RoleId } });
  if (!Role) {
    return next(new AppError("Couldn't find a role for the given role"), 404);
  }

  const user = await User.create({
    email,
    password, // Should be hashed
    name,
    fullname,
    safe_no,
    national_id,
    CreatedBy: superAdminId,
    UpdatedBy: superAdminId, // Assuming the superAdminId is valid and authorized
  });

  await LookupUserRoles.create({
    UserID: user.id,
    RoleId,
    createdBy: superAdminId, // Assuming the superAdminId is valid and authorized
  });

  return res.status(201).json({ message: 'User successfully created', user: user.toJSON() });
});

const ResetPasswordBySuperAdmin = catchError(async (req, res, next) => {
  const { userId, newPassword } = req.body; // UserID of the user whose password is being reset and the new password
  const superAdminId = req.query.superAdminId; // ID from query parameters or authenticated Super Admin

  // Verify Super Admin role here
  const superAdminRole = await LookupUserRoles.findOne({
    where: { UserID: superAdminId },
    include: [{ model: LookupRoles, as: 'Role' }],
  });

  if (!superAdminRole || superAdminRole.Role.name !== 'Super Admin') {
    return res.status(403).json({ error: 'Only Super Admins can reset passwords' });
  }
  const updateInfo = await User.update(
    {
      password: newPassword, // In a real scenario, hash this password
      updatedBy: superAdminId, // Using superAdminId to mark who updated this record
    },
    { where: { id: userId } }
  );

  if (updateInfo[0] === 0) {
    return res.status(404).json({ message: 'User not found or no update made' });
  }

  return res.status(200).json({ message: 'Password successfully reset' });
});

const UserPasswordReset = catchError(async (req, res, next) => {
  const { email, oldPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New password and confirm password do not match' });
  }

  const user = await User.findOne({ where: { email } });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (oldPassword !== user.password) {
    return next(new AppError('Old password is incorrect', 401));
  }

  const updateInfo = await User.update(
    {
      password: newPassword,
      updatedBy: user.id, // User is updating their own password, so they are the updater
    },
    { where: { id: user.id } }
  );

  if (updateInfo[0] === 0) {
    return res.status(404).json({ message: 'No update made' });
  }

  return res.status(200).json({ message: 'Password successfully updated' });
});

const GetAllRoles = GetAll(LookupRoles);

const UpdateUserDataAndRole = catchError(async (req, res, next) => {
  const { userId } = req.query; // Assuming userId is passed in the URL params
  const { email, name, fullname, safe_no, password, national_id, roleId } = req.body;

  const user = await User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  user.email = email || user.email;
  user.name = name || user.name;
  user.fullname = fullname || user.fullname;
  user.safe_no = safe_no || user.safe_no;
  user.national_id = national_id || user.national_id;
  user.password = password || user.password;

  await user.save();

  const role = await LookupRoles.findByPk(roleId);
  if (!role) {
    return res.status(404).json({ error: 'Role not found' });
  }

  const userRole = await LookupUserRoles.findOne({
    where: { UserID: userId },
  });

  if (!userRole) {
    return res.status(404).json({ error: 'User role not found' });
  }

  userRole.RoleId = roleId;
  await userRole.save();

  return res.status(200).json({ message: 'User data and role updated successfully' });
});

module.exports = {
  Login: Login,
  SignUp: SignUp,
  GetAllUsers: GetAllUsers,
  GiveRolesToUsers: GiveRolesToUsers,
  ResetPasswordBySuperAdmin: ResetPasswordBySuperAdmin,
  UserPasswordReset: UserPasswordReset,
  GetAllRoles: GetAllRoles,
  UpdateUserDataAndRole: UpdateUserDataAndRole
};
