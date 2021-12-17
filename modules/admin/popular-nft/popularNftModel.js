const mongoose = require("mongoose");

const { Schema } = mongoose;

const PopularNftSchema = new Schema(
  {
    nftId: {
      type: Schema.Types.ObjectId,
      ref: "nft",
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

module.exports = mongoose.model("popularNft", PopularNftSchema);
