const express = require('express');
const UserCtr = require('./userController');
const UserMiddleware = require('./userMiddleware');
const Auth = require('../../helper/auth');
const auth = require('../../helper/auth');

const userRoute = express.Router();
// get roles
const getAllRoles = [UserCtr.getAllRoles];
userRoute.get('/getRoles', getAllRoles);

// update user
const updateUserDetails = [
  Auth.isAuthenticatedUser,
  UserMiddleware.signUpValidator,
  UserMiddleware.checkUsernameAlreadyAdded,
  UserCtr.updateUserDetails,
];
userRoute.put('/update', updateUserDetails);

// update user details by admin
const updateUserDetailsByAdmin = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  UserMiddleware.signUpValidator,
  UserCtr.updateUserDetailsByAdmin,
];
userRoute.put('/update/:userId', updateUserDetailsByAdmin);

// login user
const login = [UserMiddleware.loginCheck, UserCtr.login];
userRoute.post('/login', login);

// list all user for admin only

const list = [auth.isAuthenticatedUser, auth.isAdmin, UserCtr.list];
userRoute.get('/list', list);

// get user details
const getDetails = [auth.isAuthenticatedUser, UserCtr.getUserDetails];
userRoute.get('/userDetails', getDetails);

// approve user as creator
const approveAsCreator = [
  auth.isAuthenticatedUser,
  auth.isAdmin,
  UserMiddleware.ValidateApproveAsCreator,
  UserCtr.approveAsCreator,
];
userRoute.post('/aprrove', approveAsCreator);

// enable and disable user

const disableUser = [
  auth.isAuthenticatedUser,
  auth.isAdmin,
  UserMiddleware.disbaleEnableValidator,
  UserCtr.disableUser,
];
userRoute.post('/disableUser', disableUser);

// add new user by admin
const addUserAsCreatorByAdmin = [
  auth.isAuthenticatedUser,
  auth.isAdmin,
  UserMiddleware.addNewUserByAdmin,
  UserMiddleware.checkUsernameAlreadyAdded,
  UserMiddleware.checkAddressAlreadyRegistered,
  UserCtr.addUserByAdmin,
];
userRoute.post('/addNewUserByAdmin', addUserAsCreatorByAdmin);

// genrate nonce
const genrateNonce = [UserCtr.genrateNonce];
userRoute.get('/genrateNonce/:address', genrateNonce);

// search creator
const searchCreator = [auth.isAuthenticatedUser, UserCtr.searchCreator];
userRoute.get('/searchCreator/:name', searchCreator);

// list active creator
const listActiveCreator = [UserCtr.listActiveCreator];
userRoute.post('/listVerifiefCreator', listActiveCreator);

// get single user Details

const getSingleUserDetails = [
  Auth.checkIsAutheticated,
  UserCtr.getSingleUserDetails,
];
userRoute.get('/getSingleUser/:userId', getSingleUserDetails);

// validate instagrm account
const validateInstagramAccount = [
  Auth.isAuthenticatedUser,
  UserMiddleware.validateInstagram,
  UserCtr.verifyInstagramAccount,
];
userRoute.post('/validateInstagram', validateInstagramAccount);

// genrate acces token
const genrateAccessToken = [
  Auth.isAuthenticatedUser,
  UserCtr.genrateAccessTokenForTwitter,
];
userRoute.get('/twitter/access_token', genrateAccessToken);

// verify twitter
const validateTwitterAccount = [
  Auth.isAuthenticatedUser,
  UserMiddleware.validateTwitter,
  UserCtr.verifyTwitterAccount,
];
userRoute.post('/validateTwitter', validateTwitterAccount);
module.exports = userRoute;
