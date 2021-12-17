const express = require('express');
const InfoCtr = require('./infoController');
const InfoMiddleware = require('./infoMiddleware');
const Auth = require('../../../helper/auth');

const infoRoute = express.Router();

// add new info
const addNewInfo = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  InfoMiddleware.validateAdd,
  InfoCtr.addNewInfo,
];
infoRoute.post('/add', addNewInfo);

// update info
const updateInfo = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  InfoMiddleware.validateUpdate,
  InfoCtr.updateInfo,
];
infoRoute.put('/update/:id', updateInfo);

// delete info
const deleteInfo = [Auth.isAuthenticatedUser, Auth.isAdmin, InfoCtr.deleteInfo];
infoRoute.delete('/delete/:id', deleteInfo);

// list specfic info
const getDetails = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  InfoCtr.getInfoDetails,
];
infoRoute.get('/details/:id', getDetails);

// list info for admin
const listInfoForAdmin = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  InfoCtr.listForAdmin,
];
infoRoute.get('/listForAdmin', listInfoForAdmin);

// list info for users
const listInfoForUser = [InfoCtr.list];
infoRoute.get('/list', listInfoForUser);

module.exports = infoRoute;
