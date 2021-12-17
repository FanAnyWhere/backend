const express = require('express');
const HallOfFrameHelper = require('../../cron/hallOfFrame');
const HallCtr = require('./hallOfFrameController');
const HallMiddleware = require('./hallOfFrameMiddleware');

// const Auth = require('../../helper/auth');
// const auth = require('../../helper/auth');

const hallOfFrameRoute = express.Router();

// add top art works
const topArt = [HallOfFrameHelper.getArtWorks];
hallOfFrameRoute.get('/topArts', topArt);

// get top collectors
const topCollectors = [HallOfFrameHelper.getTopBuyers];
hallOfFrameRoute.get('/topCollector', topCollectors);

// get top creators
const getTopCreators = [HallOfFrameHelper.getTopCreators];
hallOfFrameRoute.get('/topCreator', getTopCreators);
// get hall of frame list
const listHallOfFrame = [HallMiddleware.checkRedis, HallCtr.listHallOfFrame];
hallOfFrameRoute.get('/list/:type', listHallOfFrame);
module.exports = hallOfFrameRoute;
