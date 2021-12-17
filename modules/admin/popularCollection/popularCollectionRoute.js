const express = require('express');
const PopularCollectionCtr = require('./popularCollectionController');
const PopularCollectionMiddleware = require('./popularCollectionMiddleware');
const Auth = require('../../../helper/auth');

const popularCollectionRoute = express.Router();
// get roles
const addNewEntry = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  PopularCollectionMiddleware.ValidateAdd,
  PopularCollectionMiddleware.checkAlreadyAdded,
  PopularCollectionCtr.addNewCollection,
];
popularCollectionRoute.post('/add', addNewEntry);

// update
const updatePopularCollection = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  PopularCollectionMiddleware.ValidateUpdate,
  PopularCollectionMiddleware.checkAlreadyAdded,
  PopularCollectionCtr.updatePopular,
];
popularCollectionRoute.put('/update/:id', updatePopularCollection);

// delete
const deletePopular = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  PopularCollectionCtr.delete,
];
popularCollectionRoute.delete('/delete/:id', deletePopular);

// list popular for users
const listPopular = [Auth.checkIsAutheticated, PopularCollectionCtr.list];
popularCollectionRoute.get('/list', listPopular);

// list popular for admin
const listPopularforAdmin = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  PopularCollectionCtr.listForAdmin,
];
popularCollectionRoute.get('/listForAdmin', listPopularforAdmin);

// list perticular populr nft
const listPopularDetails = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  PopularCollectionCtr.getPerticularNftDetails,
];
popularCollectionRoute.get('/listPopularDetails/:id', listPopularDetails);

module.exports = popularCollectionRoute;
