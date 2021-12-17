const Joi = require('joi');
const validate = require('../../helper/validateRequest');
const CategoryModel = require('./categoryModel');
const Utils = require('../../helper/utils');
const { slugText } = require('../../helper/utils');

const CategoryMiddleware = {};

CategoryMiddleware.validateAddMiddleware = (req, res, next) => {
  const nameSchema = Joi.object().keys({
    tu: Joi.string().required(),
    en: Joi.string().required(),
  });

  const schema = Joi.object({
    name: nameSchema,
    image: Joi.string(),
  });
  validate.validateRequest(req, res, next, schema);
};

CategoryMiddleware.checkCategoryAlreadyAdded = async (req, res, next) => {
  try {
    const slugify = Utils.slugText(req.body.name.en).toLowerCase();
    const checkAlreadyAvalaible = await CategoryModel.findOne({
      slugText: slugify.trim(),
    });

    if (checkAlreadyAvalaible) {
      return res.status(400).json({
        message: req.t('CATEGORY_ALREADY_ADDED'),
        status: false,
      });
    } else {
      return next();
    }
  } catch (err) {
    Utils.echoLog('error in can checkCategoryAlreadyAdded middleware', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

CategoryMiddleware.validateUpdate = (req, res, next) => {
  const nameSchema = Joi.object().keys({
    tu: Joi.string(),
    en: Joi.string(),
  });

  const schema = Joi.object({
    categoryName: nameSchema,
    status: Joi.boolean(),
    image: Joi.string(),
  });
  validate.validateRequest(req, res, next, schema);
};

CategoryMiddleware.checkCategoryAlreadyAddedForUpdate = async (
  req,
  res,
  next
) => {
  try {
    if (req.body.name && req.body.name.en) {
      const slugify = Utils.slugText(req.body.name.en).toLowerCase();
      const checkAlreadyAvalaible = await CategoryModel.findOne({
        slugText: slugify.trim(),
        _id: { $ne: req.params.id },
      });

      if (checkAlreadyAvalaible) {
        return res.status(400).json({
          message: req.t('CATEGORY_ALREADY_ADDED'),
          status: false,
        });
      } else {
        return next();
      }
    } else {
      return next();
    }
  } catch (err) {
    Utils.echoLog(
      'error in can checkCategoryAlreadyAddedForUpdate middleware',
      err
    );
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = CategoryMiddleware;
