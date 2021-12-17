const express = require('express');
const LikeCtr = require('./likeController');
const Auth = require('../../helper/auth');

const likeRoute = express.Router();

// add New category
const toggle = [Auth.isAuthenticatedUser, LikeCtr.toggle];
likeRoute.get('/toggle/:nftId', toggle);

// get like sttaus
const getIsLiked = [Auth.checkIsAutheticated, LikeCtr.checkIsLiked];
likeRoute.get('/isLiked/:nftId', getIsLiked);

// get likes count
const getLikesCount = [LikeCtr.getLikesCount];
likeRoute.get('/getLikesCount/:nftId', getLikesCount);

module.exports = likeRoute;
