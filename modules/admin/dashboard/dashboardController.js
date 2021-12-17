DashboardModel = require('./dashboardModel');
const Utils = require('../../../helper/utils');
DashBoardCtr = {};

// add new dashbaord ctr
DashBoardCtr.add = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    const addNew = new DashboardModel({
      name,
      isActive,
    });

    await addNew.save();

    return res.status(200).json({
      message: req.t('BANNER_ADDED_SUCCESSFULLY'),
      status: true,
    });
  } catch (err) {
    Utils.echoLog('error in adding dashboard data ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// list
DashBoardCtr.list = async (req, res) => {
  try {
    const list = await DashboardModel.find({}).sort({ rank: 1 });

    return res.status(200).json({
      message: req.t('BANNER_ADDED_SUCCESSFULLY'),
      status: true,
      data: list,
    });
  } catch (err) {
    Utils.echoLog('error in listing dashboard data ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// update
DashBoardCtr.update = async (req, res) => {
  try {
    const fetchDetails = await DashboardModel.findOne({ _id: req.params.id });
    if (fetchDetails) {
      if (req.body.isActive) {
        fetchDetails.isActive = true;
      }

      if (req.body.isActive === false) {
        fetchDetails.isActive = false;
      }

      const saveDetails = await fetchDetails.save();
      return res.status(200).json({
        message: req.t('DASHBOARD_UPDATED'),
        status: true,
        data: saveDetails,
      });
    }
  } catch (err) {
    Utils.echoLog('error in updating dashboard data ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = DashBoardCtr;
