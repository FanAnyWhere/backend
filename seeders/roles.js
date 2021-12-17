const RoleModel = require("../modules/roles/rolesModal");
const Utils = require("../helper/utils");
const Roles = {};

Roles.inializeRoles = async () => {
  try {
    await RoleModel.insertMany([
      { roleName: "CELEBRITY", isActive: true },
      { roleName: "COLLECTOR", isActive: true },
      { roleName: "ADMIN", isActive: false },
    ]);
  } catch (err) {
    Utils.echoLog("error in adding new roles");
  }
};

module.exports = Roles;
