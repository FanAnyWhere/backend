const express = require('express');
const PopularCtr = require('./popularController');
const PopularMiddleware = require('./popularMiddleware');
const Auth = require('../../../helper/auth');

const popularRoute = express.Router();
// get roles
const addNewEntry = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  PopularMiddleware.ValidateAdd,
  PopularMiddleware.checkAlreadyAdded,
  PopularCtr.addNewNft,
];
popularRoute.post('/add', addNewEntry);

// update
const updatePopular = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  PopularMiddleware.ValidateUpdate,
  PopularMiddleware.checkAlreadyAdded,
  PopularCtr.updatePopular,
];
popularRoute.put('/update/:id', updatePopular);

// delete
const deletePopular = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  PopularCtr.delete,
];
popularRoute.delete('/delete/:id', deletePopular);

// list popular for users
const listPopular = [Auth.checkIsAutheticated, PopularCtr.list];
popularRoute.get('/list', listPopular);

// list popular for admin
const listPopularforAdmin = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  PopularCtr.listForAdmin,
];
popularRoute.get('/listForAdmin', listPopularforAdmin);

// list perticular populr nft
const listPopularDetails = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  PopularCtr.getPerticularNftDetails,
];
popularRoute.get('/listPopularDetails/:id', listPopularDetails);

module.exports = popularRoute;
