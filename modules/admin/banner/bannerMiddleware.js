const BannerModel = require('./bannerModel');
const Utils = require('../../../helper/utils');
const Joi = require('joi');
const validate = require('../../../helper/validateRequest');
const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();
const { cachedData } = require('../../../helper/enum');

const BannerMiddleware = {};
//validate add middleware
BannerMiddleware.validateAdd = async (req, res, next) => {
  const imageSchema = Joi.object().keys({
    en: Joi.string().required(),
    tu: Joi.string().required(),
  });
  const schema = Joi.object({
    url: Joi.string().required(),
    banner: imageSchema,
    mobile: imageSchema,
  });
  validate.validateRequest(req, res, next, schema);
};

// udpate validator
BannerMiddleware.validateUpdate = async (req, res, next) => {
  const imageSchema = Joi.object().keys({
    en: Joi.string(),
    tu: Joi.string(),
  });
  const schema = Joi.object({
    url: Joi.string(),
    banner: imageSchema,
    mobile: imageSchema,
    status: Joi.boolean(),
  });
  validate.validateRequest(req, res, next, schema);
};

// list banner for user
BannerMiddleware.listBanner = async (req, res, next) => {
  try {
    const checkCacheAvalaible = await client.get(cachedData.LIST_BANNER);

    if (checkCacheAvalaible && checkCacheAvalaible.length) {
      return res.status(200).json({
        message: req.t('BANNER_LIST'),
        status: true,
        data: JSON.parse(checkCacheAvalaible),
      });
    } else {
      return next();
    }
  } catch (err) {
    Utils.echoLog(`Error in banner middleware ${err}`);
  }
};

module.exports = BannerMiddleware;
