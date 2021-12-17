const mongoose = require('mongoose');
const { roles, status } = require('../../helper/enum');

const { Schema } = mongoose;
const decryptProperty = function (value) {
  if (value) {
    return `${process.env.IPFSURL}/${value}`;
  } else {
    return null;
  }
};

const portFolioSchema = new Schema({
  username: {
    type: String,
    default: null,
  },
  url: {
    type: String,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
});

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: false,
      default: null,
      lowercase: true,
    },
    email: {
      type: String,
      required: false,
      default: null,
    },
    username: {
      type: String,
      unique: true,
      lowercase: true,
      default: undefined,
      sparse: true,
      required: false,
    },

    bio: {
      type: String,
      required: false,
    },

    portfolio: {
      instagarm: portFolioSchema,
      facebook: portFolioSchema,
      github: portFolioSchema,
      twitter: portFolioSchema,
      website: portFolioSchema,
      discord: portFolioSchema,
      youtube: portFolioSchema,
      twitch: portFolioSchema,
      tiktok: portFolioSchema,
      snapchat: portFolioSchema,
    },
    profile: {
      type: String,
      // lowercase: true,
      default: null,
      get: decryptProperty,
    },

    cover: {
      type: String,
      default: null,
      get: decryptProperty,
    },

    role: {
      type: Schema.Types.ObjectId,
      ref: 'roles',
      required: true,
    },
    walletAddress: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: [
      {
        type: Schema.Types.ObjectId,
        ref: 'categories',
        required: false,
      },
    ],
    acceptedByAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    status: {
      type: String,
      required: true,
      enum: status,
      default: 'PENDING',
    },
    stage: {
      createdOn: {
        type: String,
        default: null,
      },
      approved: {
        type: String,
        default: null,
      },
      rejected: {
        type: String,
        default: null,
      },
    },
    transactionId: {
      type: String,
      default: null,
    },
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    nftCreated: {
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
// coinSchema.index({ address: 1 }, { unique: true });
module.exports = mongoose.model('users', userSchema);
