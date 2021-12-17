const AdminModel = require("./adminModel");
const RoleModel = require("../roles/rolesModal");
const bcrypt = require("bcryptjs");
const jwtUtil = require("../../helper/jwtUtils");
const Utils = require("../../helper/utils");

const AdminCtr = {};

AdminCtr.addNewAdmin = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    const fetchRole = await RoleModel.findOne({ roleName: "ADMIN" });

    const AddNewAdmin = new AdminModel({
      email,
      username,
      password: bcrypt.hashSync(password, 10),
      role: fetchRole._id,
    });

    await AddNewAdmin.save();

    return res.status(200).json({
      message: req.t("ADMIN_ADDED_SUCCESSFULLY"),
      status: true,
    });
  } catch (err) {
    Utils.echoLog("error in creating user ", err);
    return res.status(500).json({
      message: req.t("DB_ERROR"),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

AdminCtr.login = async (req, res) => {
  try {
    const query = {};

    if (req.body.email) {
      query.email = query;
    }
    if (req.body.username) {
      query.username = req.body.username;
    }

    const fetchUser = await AdminModel.findOne(query);

    if (fetchUser) {
      if (bcrypt.compareSync(req.body.password, fetchUser.password)) {
        const token = jwtUtil.getAuthToken({
          _id: fetchUser._id,
          role: fetchUser.role,
          walletAddress: null,
        });
        return res.status(200).json({
          message: req.t("SUCCESS"),
          status: true,
          data: {
            token,
          },
        });
      } else {
        return res.status(400).json({
          message: req.t("INCORRECT_EMAIL_PASSWORD"),
          status: false,
        });
      }
    } else {
      return res.status(400).json({
        message: req.t("INCORRECT_EMAIL_PASSWORD"),
        status: false,
      });
    }
  } catch (err) {
    Utils.echoLog("error in login in admin  ", err);
    return res.status(500).json({
      message: req.t("DB_ERROR"),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = AdminCtr;
