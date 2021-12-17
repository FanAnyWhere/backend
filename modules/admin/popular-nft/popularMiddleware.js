const PopularNftModel = require('./popularNftModel');
const Utils = require('../../../helper/utils');
const Joi = require('joi');
const validate = require('../../../helper/validateRequest');
const PopularMiddleware = {};

// validate add
PopularMiddleware.ValidateAdd = async (req, res, next) => {
  const schema = Joi.object({
    nftId: Joi.string().required(),
    ranking: Joi.number().required(),
  });
  validate.validateRequest(req, res, next, schema);
};
// validate update
PopularMiddleware.ValidateUpdate = async (req, res, next) => {
  const schema = Joi.object({
    nftId: Joi.string(),
    ranking: Joi.number(),
  });
  validate.validateRequest(req, res, next, schema);
};

// check perticular nft already added or not
PopularMiddleware.checkAlreadyAdded = async (req, res, next) => {
  try {
    if (req.body.nftId) {
      const checkAlreadyAdded = await PopularNftModel.findOne({
        nftId: req.body.nftId,
      });
      if (checkAlreadyAdded) {
        return res.status(400).json({
          message: req.t('ALREADY_ADDED_POPULAR'),
          status: false,
        });
      }
      return next();
    } else {
      return next();
    }
  } catch (err) {
    Utils.echoLog('error in checkAlreadyAdded ', checkAlreadyAdded);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = PopularMiddleware;
