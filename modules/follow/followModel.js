const mongoose = require('mongoose');

const { Schema } = mongoose;

const followSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    follow: {
      type: Schema.Types.ObjectId,
      ref: 'users',
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

module.exports = mongoose.model('follow', followSchema);
