const utils = require('./utils');
const userModel = require('../modules/user/userModal');
const RoleModel = require('../modules/roles/rolesModal');
const AdminModel = require('../modules/admin/adminModel');
const errorUtil = require('./error');
const jwtUtil = require('./jwtUtils');

const auth = {};
// check authentication
auth.isAuthenticatedUser = async (req, res, next) => {
  let token = req.headers && req.headers['x-auth-token'];

  if (utils.empty(token)) {
    token = req.body && req.body['x-auth-token'];
  }
  const userTokenData = jwtUtil.decodeAuthToken(token);

  if (utils.empty(userTokenData)) {
    return errorUtil.notAuthenticated(res, req);
  }

  const fetchRole = await RoleModel.findById(userTokenData.role);

  if (fetchRole && fetchRole.roleName === 'ADMIN') {
    const fetchAdminDetails = await AdminModel.findById(userTokenData._id);

    if (fetchAdminDetails && fetchAdminDetails.isActive) {
      req.userData = fetchAdminDetails;
      req.role = fetchRole.roleName;
      return next();
    } else {
      return errorUtil.notAuthenticated(res, req);
    }
  } else {
    const fetchUserDetails = await userModel.findById(userTokenData._id);

    if (fetchUserDetails && fetchUserDetails.isActive) {
      const fetchUserRole = await RoleModel.findById(fetchUserDetails.role);
      req.userData = fetchUserDetails;
      req.role = fetchUserRole.roleName;
      return next();
    } else {
      return errorUtil.notAuthenticated(res, req);
    }
  }
  return errorUtil.notAuthenticated(res, req);
};

auth.isAdmin = async (req, res, next) => {
  if (req.role === 'ADMIN') {
    return next();
  } else {
    return errorUtil.notAuthenticated(res, req);
  }
};

auth.checkIsAutheticated = async (req, res, next) => {
  let token = req.headers && req.headers['x-auth-token'];

  if (utils.empty(token)) {
    token = req.body && req.body['x-auth-token'];
  }
  const userTokenData = jwtUtil.decodeAuthToken(token);

  if (utils.empty(userTokenData)) {
    return next();
  }

  const fetchRole = await RoleModel.findById(userTokenData.role);

  if (fetchRole && fetchRole.roleName === 'ADMIN') {
    const fetchAdminDetails = await AdminModel.findById(userTokenData._id);

    if (fetchAdminDetails && fetchAdminDetails.isActive) {
      req.userData = fetchAdminDetails;
      req.role = fetchRole.roleName;
      return next();
    } else {
      return errorUtil.notAuthenticated(res, req);
    }
  } else {
    const fetchUserDetails = await userModel.findById(userTokenData._id);

    if (fetchUserDetails && fetchUserDetails.isActive) {
      const fetchUserRole = await RoleModel.findById(fetchUserDetails.role);

      req.userData = fetchUserDetails;
      req.role = fetchUserRole.roleName;
      return next();
    } else {
      return errorUtil.notAuthenticated(res, req);
    }
  }
  return errorUtil.notAuthenticated(res, req);
};
module.exports = auth;
