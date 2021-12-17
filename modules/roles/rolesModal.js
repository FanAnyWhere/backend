const mongoose = require("mongoose");
const { roles } = require("../../helper/enum");

const { Schema } = mongoose;

const rolesSchema = new Schema(
  {
    roleName: {
      type: String,
      required: false,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model("roles", rolesSchema);
