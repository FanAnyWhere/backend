const mongoose = require('mongoose');

const { Schema } = mongoose;

const likeSchema = new Schema(
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
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model('likes', likeSchema);
