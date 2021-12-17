const express = require("express");
const BannerCtr = require("./bannerController");
const BannerMiddleware = require("./bannerMiddleware");
const Auth = require("../../../helper/auth");
const auth = require("../../../helper/auth");

const bannerRoute = express.Router();

// add new banner
const addNewBanner = [
  auth.isAuthenticatedUser,
  auth.isAdmin,
  BannerMiddleware.validateAdd,
  BannerCtr.addNewBanner,
];
bannerRoute.post("/add", addNewBanner);

// update banner
const updateBanner = [
  auth.isAuthenticatedUser,
  auth.isAdmin,
  BannerMiddleware.validateUpdate,
  BannerCtr.updateBanner,
];
bannerRoute.put("/update/:id", updateBanner);

// delete banner
const deleteBanner = [
  auth.isAuthenticatedUser,
  auth.isAdmin,
  BannerCtr.deleteBanner,
];
bannerRoute.delete("/delete/:id", deleteBanner);

// list banner for users

const listBannerForUser = [BannerMiddleware.listBanner, BannerCtr.list];
bannerRoute.get("/list", listBannerForUser);

// list banners for admin

const listBannerForAdmin = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  BannerCtr.listForAdmin,
];
bannerRoute.get("/listForAdmin", listBannerForAdmin);

// list specfic banner

const getDetails = [
  Auth.isAuthenticatedUser,
  Auth.isAdmin,
  BannerCtr.getBannerDetails,
];
bannerRoute.get("/details/:id", getDetails);

module.exports = bannerRoute;
