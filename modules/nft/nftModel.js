const mongoose = require('mongoose');

const { Schema } = mongoose;
const { roles, nftStatus } = require('../../helper/enum');

const decryptProperty = function (value) {
  if (value) {
    return `${process.env.IPFSURL}/${value}`;
  } else {
    return value;
  }
};

const imageSchmea = new Schema({
  original: {
    type: String,
    default: null,
    get: decryptProperty,
  },
  compressed: {
    type: String,
    default: null,
    get: decryptProperty,
  },
  format: {
    type: String,
    default: null,
  },
  extra: { _id: false },
});

const nftSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
      default: null,
    },
    tokenId: {
      type: String,
      unique: true,
      lowercase: true,
      default: undefined,
      sparse: true,
      required: false,
    },
    image: imageSchmea,
    category: [
      {
        type: Schema.Types.ObjectId,
        ref: 'categories',
        required: false,
      },
    ],
    collectionId: {
      type: Schema.Types.ObjectId,
      ref: 'collection',
      required: false,
      default: null,
    },
    isActive: { type: Boolean, default: true },

    approvedByAdmin: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      required: true,
      enum: nftStatus,
      default: 'NOT_MINTED',
    },

    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
    digitalKey: {
      type: String,
      default: null,
    },
    unlockContent: {
      type: Boolean,
      default: false,
    },
    price: {
      type: Number,
      required: true,
    },
    saleState: {
      type: String,
      enum: ['BUY', 'AUCTION', 'SOLD'],
      required: true,
    },
    auctionTime: {
      type: Number,
      default: 0,
    },
    edition: {
      type: Number,
      default: 1,
    },
    nonce: {
      type: Number,
      default: null,
    },
    auctionStartDate: {
      type: Number,
      default: null,
    },

    auctionEndDate: {
      type: Number,
      default: null,
    },
    nftSold: {
      type: Number,
      default: 0,
    },
    coCreator: {
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: null,
      },
      percentage: {
        type: Number,
        default: null,
      },
    },
  },

  {
    timestamps: true,
    toJSON: {
      getters: true,
    },
  }
);

imageSchmea.set('toObject', { getters: true });
imageSchmea.set('toJSON', { getters: true });
module.exports = mongoose.model('nft', nftSchema);
