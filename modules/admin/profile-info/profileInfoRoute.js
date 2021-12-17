const express = require("express");
const ProfileInfoCtr = require("./profileInfoController");
const ProfileInfoMiddleware = require("./profileInfoMiddleware");
const Auth = require("../../../helper/auth");
const auth = require("../../../helper/auth");

const profileInfoRoute = express.Router();

// add new profile info
const addNewProfileInfo = [
    auth.isAuthenticatedUser,
    auth.isAdmin,
    ProfileInfoMiddleware.validateAdd,
    ProfileInfoCtr.addNewProfileInfo,
];
profileInfoRoute.post("/add", addNewProfileInfo);

// update profile info
const updateProfileInfo = [
    auth.isAuthenticatedUser,
    auth.isAdmin,
    ProfileInfoMiddleware.validateUpdate,
    ProfileInfoCtr.updateProfileInfo,
];
profileInfoRoute.put("/update/:id", updateProfileInfo);

// delete profile info
const deleteProfileInfo = [
    auth.isAuthenticatedUser,
    auth.isAdmin,
    ProfileInfoCtr.deleteProfileInfo,
];
profileInfoRoute.delete("/delete/:id", deleteProfileInfo);

// list specfic profile info
const getDetails = [
    Auth.isAuthenticatedUser,
    Auth.isAdmin,
    ProfileInfoCtr.getProfileInfoDetails,
];
profileInfoRoute.get("/details/:id", getDetails);

// list profile info for admin
const listProfileInfoForAdmin = [
    Auth.isAuthenticatedUser,
    Auth.isAdmin,
    ProfileInfoCtr.listForAdmin,
];
profileInfoRoute.get("/listForAdmin", listProfileInfoForAdmin);

// list banner for users
const listProfileInfoForUser = [
    ProfileInfoMiddleware.listProfileInfo,
    ProfileInfoCtr.list
];
profileInfoRoute.get("/list", listProfileInfoForUser);


module.exports = profileInfoRoute;