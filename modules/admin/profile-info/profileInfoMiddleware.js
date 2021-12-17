const Utils = require('../../../helper/utils');
const Joi = require('joi');
const validate = require('../../../helper/validateRequest');
const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();
const { cachedData } = require('../../../helper/enum');

const ProfileInfoMiddleware = {};

//validate add middleware
ProfileInfoMiddleware.validateAdd = async (req, res, next) => {
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
ProfileInfoMiddleware.validateUpdate = async (req, res, next) => {
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
ProfileInfoMiddleware.listProfileInfo = async (req, res, next) => {
  try {
    const checkCacheAvalaible = await client.get(cachedData.LIST_PROFILE_INFO);

    if (checkCacheAvalaible && checkCacheAvalaible.length) {
      return res.status(200).json({
        message: req.t('PROFILE_INFO_LIST'),
        status: true,
        data: JSON.parse(checkCacheAvalaible),
      });
    } else {
      return next();
    }
  } catch (err) {
    Utils.echoLog(`Error in profile info middleware ${err}`);
  }
};

module.exports = ProfileInfoMiddleware;
