const NotificationModel = require("./notificationModel");
const Joi = require("joi");
const validate = require("../../helper/validateRequest");
const Utils = require("../../helper/utils");
const NotificationMiddleware = {};

NotificationMiddleware.addNewNotificationValidator = async (req, res, next) => {
  const schema = Joi.object({
    text: Joi.string().required(),
    userId: Joi.string(),
    notification_type: Joi.string()
  });
  validate.validateRequest(req, res, next, schema);
};

module.exports = NotificationMiddleware;
