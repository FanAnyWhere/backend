const InfoModel = require('./infoModel');
const Utils = require('../../../helper/utils');
const Joi = require('joi');
const validate = require('../../../helper/validateRequest');
const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();
const { cachedData } = require('../../../helper/enum');

const InfoMiddleware = {};

//validate add middleware
InfoMiddleware.validateAdd = async (req, res, next) => {
  const imageSchema = Joi.object().keys({
    en: Joi.string().required(),
    tu: Joi.string().required(),
  });

  const textSchema = Joi.object().keys({
    en: Joi.string().allow(null, ''),
    tu: Joi.string().allow(null, ''),
  });

  const schema = Joi.object({
    url: Joi.string().required(),
    banner: imageSchema,
    mobile: imageSchema,
    button_text: textSchema,
    button_url: Joi.string().allow(null, ''),
  });
  validate.validateRequest(req, res, next, schema);
};

// udpate validator
InfoMiddleware.validateUpdate = async (req, res, next) => {
  const imageSchema = Joi.object().keys({
    en: Joi.string(),
    tu: Joi.string(),
  });

  const textSchema = Joi.object().keys({
    en: Joi.string().allow(null, ''),
    tu: Joi.string().allow(null, ''),
  });

  const schema = Joi.object({
    url: Joi.string(),
    banner: imageSchema,
    mobile: imageSchema,
    status: Joi.boolean(),
    button_text: textSchema,
    button_url: Joi.string().allow(null, ''),
  });
  validate.validateRequest(req, res, next, schema);
};

// list info for user
InfoMiddleware.listInfo = async (req, res, next) => {
  try {
    const checkCacheAvalaible = await client.get(cachedData.LIST_INFO);

    if (checkCacheAvalaible && checkCacheAvalaible.length) {
      return res.status(200).json({
        message: req.t('HALL_FRAME_INFO_LIST'),
        status: true,
        data: JSON.parse(checkCacheAvalaible),
      });
    } else {
      return next();
    }
  } catch (err) {
    Utils.echoLog(`Error in hall of frame middleware ${err}`);
  }
};

module.exports = InfoMiddleware;
