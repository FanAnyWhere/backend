const mongoose = require('mongoose');

const { Schema } = mongoose;

const logsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    nftId: {
      type: Schema.Types.ObjectId,
      ref: 'nft',
      required: true,
    },
    bnbValue: {
      type: Number,
      required: true,
    },
    blockNumber: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Number,
      required: true,
    },
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model('logs', logsSchema);
