const mongoose = require('mongoose');

const { Schema } = mongoose;

const historySchema = new Schema(
  {
    nftId: {
      type: Schema.Types.ObjectId,
      ref: 'nft',
      required: true,
    },
    editionNo: {
      type: Number,
      default: null,
    },
    text: {
      type: String,
      default: null,
    },
    buyPrice: {
      type: Number,
      default: 0,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    timeline: {
      type: Number,
      default: 0,
    },
    transactionId: {
      type: String,
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

module.exports = mongoose.model('history', historySchema);
