const mongoose = require('mongoose');

const { Schema } = mongoose;

const PopularCollectionSchema = new Schema(
  {
    collectionId: {
      type: Schema.Types.ObjectId,
      ref: 'collection',
      required: true,
    },
    ranking: {
      type: Number,
      required: true,
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

module.exports = mongoose.model('popularCollection', PopularCollectionSchema);
