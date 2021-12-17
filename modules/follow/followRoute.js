const express = require('express');
const FollowCtr = require('./followCtr');
const Auth = require('../../helper/auth');
const auth = require('../../helper/auth');

const followRoute = express.Router();

// add New category
const toggle = [Auth.isAuthenticatedUser, FollowCtr.toggle];
followRoute.get('/toggle/:userId', toggle);

// check is followed
const isFollowed = [auth.isAuthenticatedUser, FollowCtr.checkIsFollowed];
followRoute.get('/checkIsFollowed/:userId', isFollowed);

module.exports = followRoute;
