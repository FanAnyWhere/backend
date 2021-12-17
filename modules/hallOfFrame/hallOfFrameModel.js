const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    required: true,
  },
  totalBnb: {
    type: Number,
    default: null,
  },
});

const nftSchema = new Schema({
  nftId: {
    type: String,
    default: null,
  },
  totalBnb: {
    type: Number,
    default: null,
  },
});

const hallOFFrameSchema = new Schema(
  {
    artist: [userSchema],
    artwork: [nftSchema],
    collector: [userSchema],
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

module.exports = mongoose.model('hallFrame', hallOFFrameSchema);
