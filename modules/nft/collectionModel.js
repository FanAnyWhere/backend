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

const collectionSchema = new Schema(
  {
    logo: {
      type: String,
      default: null,
      get: decryptProperty,
      required: false,
    },
    name: {
      type: String,
      required: true,
      lowercase: true,
    },
    slugText: {
      type: String,
      lowercase: true,
      set: setSlugText,
    },
    description: {
      type: String,
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    category: [
      {
        type: Schema.Types.ObjectId,
        ref: 'categories',
        required: false,
      },
    ],
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

module.exports = mongoose.model('collection', collectionSchema);
