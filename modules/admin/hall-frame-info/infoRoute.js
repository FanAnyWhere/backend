const express = require("express");
const InfoCtr = require("./infoController");
const infoMiddleware = require("./infoMiddleware");
const Auth = require("../../../helper/auth");
const auth = require("../../../helper/auth");

const infoRoute = express.Router();


// add new hall of frame info
const addHallOfFrameInfo = [
    auth.isAuthenticatedUser,
    auth.isAdmin,
    infoMiddleware.validateAdd,
    InfoCtr.addHallOfFrameInfo,
];
infoRoute.post("/add", addHallOfFrameInfo);
  
// update banner
const updateHallOfFrameInfo = [
    auth.isAuthenticatedUser,
    auth.isAdmin,
    infoMiddleware.validateUpdate,
    InfoCtr.updateHallOfFrameInfo,
];
infoRoute.put("/update/:id", updateHallOfFrameInfo);
  
// delete hall of frame info
const deleteHallFrameInfo = [
    auth.isAuthenticatedUser,
    auth.isAdmin,
    InfoCtr.deleteHallFrameInfo,
];
infoRoute.delete("/delete/:id", deleteHallFrameInfo);

// list specfic hall of frame info
const getHallFrameDetails = [
    Auth.isAuthenticatedUser,
    Auth.isAdmin,
    InfoCtr.getHallFrameDetails,
];
infoRoute.get("/details/:id", getHallFrameDetails);

// list hall of frame info for users
const listInfoForUser = [InfoCtr.list];
infoRoute.get('/list', listInfoForUser);

// list hall of frame info for admin
const listInfoForAdmin = [
    Auth.isAuthenticatedUser,
    Auth.isAdmin,
    InfoCtr.listForAdmin,
];
infoRoute.get("/listForAdmin", listInfoForAdmin);


module.exports = infoRoute;
