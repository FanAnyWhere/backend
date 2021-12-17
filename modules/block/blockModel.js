const mongoose = require('mongoose');

const { Schema } = mongoose;

const blockSchema = new Schema(
  {
    blockNo: {
      type: Number,
      default: 0,
    },
    orderBlockNo: {
      type: Number,
      default: 0,
    },
    transferBlockNo: {
      type: Number,
      default: 0,
    },
    orderCancelled: {
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

module.exports = mongoose.model('blocks', blockSchema);
