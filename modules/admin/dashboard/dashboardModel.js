const mongoose = require('mongoose');
const Utils = require('../../../helper/utils');

const { Schema } = mongoose;
const setSlugText = (value) => {
  return value ? Utils.slugText(value) : null;
};

const dashboardSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slugText: {
      type: String,
      lowercase: true,
      set: setSlugText,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: false,
    },
    rank: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model('dashboard', dashboardSchema);
