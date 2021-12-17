const mongoose = require('mongoose');

const { Schema } = mongoose;

const decryptProperty = function (value) {
  if (value) {
    return `${process.env.IPFSURL}/${value}`;
  } else {
    return null;
  }
};

const imageSchema = new Schema({
  en: {
    type: String,
    default: null,
    get: decryptProperty,
  },
  tu: {
    type: String,
    default: null,
    get: decryptProperty,
  },
  extra: { _id: false },
});

const infoSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
    },
    banner: imageSchema,
    mobile: imageSchema,

    button_text: {
      en: { type: String, required: false, default: null },
      tu: {
        type: String,
        required: false,
        default: null,
      },
    },
    button_url: {
      type: String,
      required: false,
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

imageSchema.set('toObject', { getters: true });
imageSchema.set('toJSON', { getters: true });

module.exports = mongoose.model('info', infoSchema);
