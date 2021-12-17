const mongoose = require('mongoose');
const { roles } = require('../../helper/enum');

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    text: {
      en: {
        type: String,
        default: null,
      },
      tu: {
        type: String,
        default: null,
      },
    },
    route: {
      type: String,
      default: null,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    bidId: {
      type: Schema.Types.ObjectId,
      ref: 'bid',
      default: null,
    },
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model('notification', notificationSchema);
