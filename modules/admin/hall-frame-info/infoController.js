const InfoModel = require('./infoModel');
const Utils = require('../../../helper/utils');

const InfoCtr = {};

// add new hall of frame info
InfoCtr.addHallOfFrameInfo = async (req, res) => {
  try {
    const { url, banner, button_text, button_url, mobile } = req.body;
    if (button_text && !button_url) {
      return res.status(400).json({
        message: 'button_url is not given',
        status: false,
      });
    }
    const addHallOfFrameInfo = new InfoModel({
      url,
      banner,
      mobile,
      button_text,
      button_url,
    });
    const saveInfo = await addHallOfFrameInfo.save();

    return res.status(200).json({
      message: req.t('HALL_FRAME_INFO_ADDED_SUCCESSFULLY'),
      status: true,
      data: {
        details: {
          _id: saveInfo._id,
          url: saveInfo.url,
          banner: saveInfo.banner,
          button_text: saveInfo.button_text,
          button_url: saveInfo.button_url,
        },
      },
    });
  } catch (err) {
    Utils.echoLog(
      'error in      client.del(cachedData.LIST_INFO);creating new info ',
      err
    );
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// update hall of frame info
InfoCtr.updateHallOfFrameInfo = async (req, res) => {
  try {
    const fetchInfoDetails = await InfoModel.findOne({
      _id: req.params.id,
    });

    if (fetchInfoDetails) {
      if (req.body.url) {
        fetchInfoDetails.url = req.body.url;
      }
      if (req.body.banner) {
        fetchInfoDetails.banner = req.body.banner;
      }
      if (req.body.mobile) {
        fetchInfoDetails.mobile = req.body.mobile;
      }
      if (req.body.status) {
        fetchInfoDetails.isActive = req.body.status;
      }
      if (req.body.button_text) {
        fetchInfoDetails.button_text = req.body.button_text;
      }
      if (req.body.button_url) {
        fetchInfoDetails.button_url = req.body.button_url;
      }
      if (!req.body.status) {
        fetchInfoDetails.isActive = req.body.status;
      }

      if (req.body.button_text && !req.body.button_url) {
        return res.status(400).json({
          message: req.t('BUTTON_URL_NOT'),
          status: true,
        });
      }
      if (!req.body.button_text && req.body.button_url) {
        fetchInfoDetails.button_url = null;
      }

      await fetchInfoDetails.save();

      return res.status(200).json({
        message: req.t('HALL_FRAME_INFO_UPDATED_SUCCESSFULLY'),
        status: true,
      });
    } else {
      return res.status(400).json({
        message: req.t('HALL_FRAME_INVALID_INFO'),
        status: true,
      });
    }
  } catch (err) {
    Utils.echoLog('error in updating hall of frame info ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// delete hall of frame info
InfoCtr.deleteHallFrameInfo = async (req, res) => {
  try {
    const deleteInfo = await InfoModel.deleteOne({ _id: req.params.id });

    if (deleteInfo && deleteInfo.deletedCount > 0) {
      return res.status(200).json({
        message: req.t('HALL_FRAME_INFO_DELETED'),
        status: true,
      });
    } else {
      return res.status(400).json({
        message: req.t('HALL_FRAME_INVALID_INFO'),
        status: true,
      });
    }
  } catch (err) {
    Utils.echoLog('error in deleting hall of frame info ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// get hall of frame info details
InfoCtr.getHallFrameDetails = async (req, res) => {
  try {
    const getInfoDetails = await InfoModel.findOne({ _id: req.params.id });
    if (getInfoDetails) {
      return res.status(200).json({
        message: req.t('HALL_FRAME_INFO_DETAILS'),
        status: true,
        data: getInfoDetails,
      });
    } else {
      return res.status(400).json({
        message: req.t('HALL_FRAME_INVALID_INFO'),
        status: true,
      });
    }
  } catch (err) {
    Utils.echoLog('error in getting hall of frame info details ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// list info for admin
InfoCtr.listForAdmin = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const totalCount = await InfoModel.countDocuments({});
    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);
    const list = await InfoModel.find({})
      .sort({ createdAt: -1 })
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .limit(+process.env.LIMIT);

    return res.status(200).json({
      message: req.t('HALL_FRAME_INFO_LIST'),
      status: true,
      data: list,
      pagination: {
        pageNo: page,
        totalRecords: totalCount,
        totalPages: pageCount,
        limit: +process.env.LIMIT,
      },
    });
  } catch (err) {
    Utils.echoLog('error in listing hall of frame info for admin ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// list info for users
InfoCtr.list = async (req, res) => {
  try {
    const getList = await InfoModel.find(
      { isActive: true },
      { isActive: 0, createdAt: 0, updatedAt: 0 }
    );
    if (getList) {
      return res.status(200).json({
        message: req.t('HALL_FRAME_INFO_LIST'),
        status: true,
        data: getList,
      });
    }
  } catch (err) {
    Utils.echoLog('error in listing hall of frame info ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = InfoCtr;
