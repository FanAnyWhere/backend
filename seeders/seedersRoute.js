const express = require('express');
const seeders = require('./seeders');

const seedersRoute = express.Router();
// initialize
const initializeSeeders = [seeders.inializeProject];
seedersRoute.get('/initialize', initializeSeeders);

// initialize dashbaord
const initializeDashboard = [seeders.initializeDashboard];
seedersRoute.get('/initializeDashboard', initializeDashboard);

// initilize blocks
const initializeBlocks = [seeders.inializeBlocks];
seedersRoute.get('/initializeBlocks', initializeBlocks);

module.exports = seedersRoute;
