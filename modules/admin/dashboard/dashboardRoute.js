const express = require("express");
const DashboardCtr = require("./dashboardController");
const Auth = require("../../../helper/auth");

const dashboardRoute = express.Router();

// list dashboard
const list = [DashBoardCtr.list];
dashboardRoute.get("/list", list);

// update Dashbaord
const updateDashboard = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  DashBoardCtr.update,
];
dashboardRoute.put("/update/:id", updateDashboard);

module.exports = dashboardRoute;
