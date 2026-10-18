const express = require('express');

const { authorizeRole, verifyToken } = require('../../middleware/Authorization.js');
const { GiveRolesToUsers,Login, GetAllRoles, GetAllUsers, SignUp, ResetPasswordBySuperAdmin, UserPasswordReset, UpdateUserDataAndRole } = require('./Login.js');

const SignInRouter = express.Router();

SignInRouter.post('/login', Login);
SignInRouter.post('/SignUp', verifyToken, authorizeRole('Super Admin'), SignUp);
SignInRouter.get('/GetAllUsers', GetAllUsers);
SignInRouter.get('/GetAllRoles', GetAllRoles);
SignInRouter.post('/GiveRolesToUsers', GiveRolesToUsers);
SignInRouter.post('/ResetPasswordBySuperAdmin', ResetPasswordBySuperAdmin);
SignInRouter.post('/UserPasswordReset', UserPasswordReset);
SignInRouter.put('/UpdateUserDataAndRole', UpdateUserDataAndRole);


module.exports = {
  SignInRouter: SignInRouter
};
