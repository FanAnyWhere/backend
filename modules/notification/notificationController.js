const NotificationModel = require('./notificationModel');
const NotificationCtr = {};

NotificationCtr.addNewNotication = async (req, res) => {
  try {
    const addNewNotication = new NotificationModel({
      text: req.body.text,
      userId: req.body.userId,
    });

    await addNewNotication.save();

    return res.status(200).json({
      message: req.t('NOTIFICATION_ADDED'),
      status: true,
    });
  } catch (err) {
    Utils.echoLog('error in addNewNotication  ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

NotificationCtr.list = async (req, res) => {
  try {
    if (req.query.list === 'all') {
      const getNotification = await NotificationModel.find({
        userId: req.userData._id,
      }).sort({ createdAt: -1 });

      return res.status(200).json({
        message: req.t('NOTIFICATION_LIST'),
        status: true,
        data: getNotification,
      });
    } else {
      const getNotification = await NotificationModel.find({
        userId: req.userData._id,
      })
        .limit(100)
        .sort({ createdAt: -1 });

      return res.status(200).json({
        message: req.t('NOTIFICATION_LIST'),
        status: true,
        data: getNotification,
      });
    }
  } catch (err) {
    Utils.echoLog('error in list notification  ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = NotificationCtr;
