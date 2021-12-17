const express = require("express");
const NotificationCtr = require("./notificationController");
const NotificationMiddleware = require("./notificationMiddleware");
const Auth = require("../../helper/auth");

const notificationRoute = express.Router();
// add new Nft
const addNewNotification = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  NotificationMiddleware.addNewNotificationValidator,
  NotificationCtr.addNewNotication,
];
notificationRoute.post("/addNotification", addNewNotification);

// list notification to user
const list = [Auth.isAuthenticatedUser, NotificationCtr.list];
notificationRoute.get("/list", list);

module.exports = notificationRoute;
