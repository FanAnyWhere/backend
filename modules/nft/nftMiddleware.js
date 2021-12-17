const Joi = require('joi');
const validate = require('../../helper/validateRequest');
const NftModel = require('./nftModel');
const CollectionModel = require('./collectionModel');
const EditionModel = require('../edition/editonModel');
const Utils = require('../../helper/utils');

const NftMiddleware = {};
// validate add request body
NftMiddleware.validateAdd = async (req, res, next) => {
  const imageSchema = Joi.object().keys({
    original: Joi.string().required(),
    compressed: Joi.string().required(),
    format: Joi.string(),
  });

  const coCreatorSchema = Joi.object().keys({
    userId: Joi.string(),
    percentage: Joi.number(),
  });

  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().allow(null, ''),
    image: imageSchema,
    ownerId: Joi.string(),
    collectionId: Joi.string(),
    digitalKey: Joi.alternatives().conditional('unlockContent', {
      is: 1,
      then: Joi.string().required(),
      otherwise: Joi.string(),
    }),
    unlockContent: Joi.boolean().required(),
    coCreator: coCreatorSchema,
    price: Joi.number().required(),
    saleState: Joi.string().valid('BUY', 'AUCTION').required(),
    category: Joi.array().items(Joi.string()).required(),
    auctionTime: Joi.alternatives().conditional('saleState', {
      is: 'AUCTION',
      then: Joi.number().required(),
      otherwise: Joi.number(),
    }),
    edition: Joi.number().required(),
  });
  validate.validateRequest(req, res, next, schema);
};

// check collection id valid or not
NftMiddleware.checkCollection = async (req, res, next) => {
  try {
    if (req.body.collectionId && req.role !== 'ADMIN') {
      const checkCollection = await CollectionModel.findOne({
        _id: req.body.collectionId,
        ownerId: req.userData._id,
      });

      if (checkCollection) {
        return next();
      } else {
        return res.status(200).json({
          message: req.t('INVALID_COLLECTION'),
          status: false,
        });
      }
    } else if (req.role === 'ADMIN') {
      return next();
    } else {
      return next();
    }
  } catch (err) {
    Utils.echoLog('error in collection middleware', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// add new collection
NftMiddleware.validateAddCollection = async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().allow(null, ''),
    logo: Joi.string().required(),
    category: Joi.array().items(Joi.string()).required(),
  });
  validate.validateRequest(req, res, next, schema);
};

// check collection already avaliable or not
NftMiddleware.checkCollectionAlreadyAdded = async (req, res, next) => {
  try {
    const collectionName = Utils.slugText(req.body.name).toLowerCase();
    const checkAlreadyAvalaible = await CollectionModel.findOne({
      slugText: collectionName.trim(),
      ownerId: req.userData._id,
    });

    if (checkAlreadyAvalaible) {
      return res.status(400).json({
        message: req.t('COLLECTION_ALREADY'),
        status: false,
      });
    } else {
      return next();
    }
  } catch (err) {
    Utils.echoLog('error in checkCollectionAlreadyAdded middleware ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

//update Nft
NftMiddleware.validateNftUpdate = async (req, res, next) => {
  const imageSchema = Joi.object().keys({
    original: Joi.string(),
    compressed: Joi.string(),
    format: Joi.string(),
  });

  const coCreatorSchema = Joi.object().keys({
    userId: Joi.string(),
    percentage: Joi.number(),
  });

  const schema = Joi.object({
    title: Joi.string(),
    description: Joi.string().allow(null, ''),
    image: imageSchema,
    ownerId: Joi.string(),
    collectionId: Joi.string(),
    unlockContent: Joi.boolean(),
    coCreator: coCreatorSchema,
    price: Joi.number(),
    saleState: Joi.string().valid('BUY', 'AUCTION'),
    category: Joi.array().items(Joi.string()),
    auctionTime: Joi.number(),
    digitalKey: Joi.alternatives().conditional('unlockContent', {
      is: 1,
      then: Joi.string().required(),
      otherwise: Joi.string(),
    }),
    edition: Joi.number(),
  });

  validate.validateRequest(req, res, next, schema);
};

// update Collection
NftMiddleware.validateCollectionUpdate = async (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string(),
    description: Joi.string().allow(null, ''),
    logo: Joi.string(),
    nftId: Joi.array(),
    category: Joi.array().items(Joi.string()),
  });

  validate.validateRequest(req, res, next, schema);
};

// check can update
NftMiddleware.canUpdateNft = async (req, res, next) => {
  try {
    const getNftDetails = await NftModel.findById(req.params.id);

    if (
      getNftDetails &&
      getNftDetails.ownerId.toString() === req.userData._id.toString() &&
      getNftDetails.status === 'NOT_MINTED'
    ) {
      return next();
    } else if (req.role === 'ADMIN') {
      return next();
    } else if (
      getNftDetails &&
      getNftDetails.ownerId.toString() === req.userData._id.toString() &&
      (getNftDetails.status === 'APPROVED' ||
        getNftDetails.status === 'PENDING')
    ) {
      return res.status(400).json({
        message: req.t('NFT_CANT'),
        status: false,
      });
    } else {
      return res.status(403).json({
        message: req.t('NOT_AUTHROZIED'),
        status: false,
      });
    }
  } catch (err) {
    Utils.echoLog('error in can update middleware', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// check can update collection
NftMiddleware.canUpdateCollection = async (req, res, next) => {
  try {
    const getCollectionDetails = await CollectionModel.findById(req.params.id);

    if (
      getCollectionDetails &&
      getCollectionDetails.ownerId.toString() === req.userData._id.toString()
    ) {
      return next();
    } else if (req.role === 'ADMIN') {
      return next();
    } else {
      return res.status(403).json({
        message: req.t('NOT_AUTHROZIED'),
        status: false,
      });
    }
  } catch (err) {
    Utils.echoLog('error in can update middleware', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// can add nft
NftMiddleware.canAddNft = async (req, res, next) => {
  if (req.role === 'ADMIN') {
    return next();
  } else if (
    req.role === 'CREATOR' &&
    req.userData &&
    req.userData.acceptedByAdmin
  ) {
    return next();
  } else {
    return res.status(403).json({
      message: req.t('NOT_AUTHROZIED'),
      status: false,
    });
  }
};

//validate input for edition update
NftMiddleware.EditionUpdate = async (req, res, next) => {
  const schema = Joi.object({
    editionId: Joi.string().required(),
    saleType: Joi.string().valid('BUY', 'OFFER'),
    price: Joi.number(),
  });
  validate.validateRequest(req, res, next, schema);
};

// check user is owner of edition or not
NftMiddleware.checkEditionOwner = async (req, res, next) => {
  try {
    const fetchEdition = await EditionModel.findOne({
      _id: req.body.editionId,
      ownerId: req.userData._id,
    });

    if (!fetchEdition) {
      return res.status(400).json({
        message: req.t('YOU_ARE_NOT_OWNER'),
        status: false,
      });
    }

    return next();
  } catch (err) {
    Utils.echoLog(`Error in checkEditionOwner ${err}`);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};
module.exports = NftMiddleware;
