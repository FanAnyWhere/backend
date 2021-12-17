const mongoose = require('mongoose');
const Utils = require('../../helper/utils');

const { Schema } = mongoose;
const setSlugText = (value) => {
  return value ? Utils.slugText(value) : null;
};

const decryptProperty = function (value) {
  if (value) {
    return `${process.env.IPFSURL}/${value}`;
  } else {
    return null;
  }
};

const categorySchema = new Schema(
  {
    categoryName: {
      tu: {
        type: String,
        required: false,
        default: null,
      },
      en: {
        type: String,
        required: false,
        default: null,
      },
    },

    slugText: {
      type: String,
      lowercase: true,
      set: setSlugText,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: null,
      get: decryptProperty,
    },
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model('categories', categorySchema);
