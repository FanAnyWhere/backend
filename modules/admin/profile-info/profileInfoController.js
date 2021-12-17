const profileInfoModel = require('./profileInfoModel');
const Utils = require('../../../helper/utils');
const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();
const { cachedData } = require('../../../helper/enum');
const ProfileInfoCtr = {};

// add new profile info
ProfileInfoCtr.addNewProfileInfo = async (req, res) => {
  try {
    const { url, banner, mobile } = req.body;
    const addNewProfileInfo = new profileInfoModel({
      url,
      banner,
      mobile,
    });
    const saveBanner = await addNewProfileInfo.save();

    client.del(cachedData.LIST_PROFILE_INFO);
    return res.status(200).json({
      message: req.t('PROFILE_INFO_ADDED_SUCCESSFULLY'),
      status: true,
      data: {
        details: {
          _id: saveBanner._id,
          url: saveBanner.url,
          image: saveBanner.image,
        },
      },
    });
  } catch (err) {
    Utils.echoLog('error in adding new profile info ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// update profile info
ProfileInfoCtr.updateProfileInfo = async (req, res) => {
  try {
    const fetchProfileDetails = await profileInfoModel.findOne({
      _id: req.params.id,
    });

    if (fetchProfileDetails) {
      if (req.body.url) {
        fetchProfileDetails.url = req.body.url;
      }
      if (req.body.banner) {
        fetchProfileDetails.banner = req.body.banner;
      }
      if (req.body.mobile) {
        fetchProfileDetails.mobile = req.body.mobile;
      }
      if (req.body.status) {
        fetchProfileDetails.isActive = req.body.status;
      }
      if (!req.body.status) {
        fetchProfileDetails.isActive = req.body.status;
      }

      await fetchProfileDetails.save();

      client.del(cachedData.LIST_PROFILE_INFO);

      return res.status(200).json({
        message: req.t('PROFILE_INFO_UPDATED_SUCCESSFULLY'),
        status: true,
      });
    } else {
      return res.status(400).json({
        message: req.t('INVALID_PROFILE_INFO'),
        status: true,
      });
    }
  } catch (err) {
    Utils.echoLog('error in updating profile info ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// delete profile info
ProfileInfoCtr.deleteProfileInfo = async (req, res) => {
  try {
    const deleteProfileInfo = await profileInfoModel.deleteOne({
      _id: req.params.id,
    });

    if (deleteProfileInfo && deleteProfileInfo.deletedCount > 0) {
      return res.status(200).json({
        message: req.t('PROFILE_INFO_DELETED'),
        status: true,
      });
    } else {
      return res.status(400).json({
        message: req.t('INVALID_PROFILE_INFO'),
        status: true,
      });
    }
  } catch (err) {
    Utils.echoLog('error in deleting profile info ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// list profile info for users
ProfileInfoCtr.list = async (req, res) => {
  try {
    const getList = await profileInfoModel.find(
      { isActive: true },
      { isActive: 0, createdAt: 0, updatedAt: 0 }
    );
    if (getList) {
      await client.set(
        'profile-info-list',
        JSON.stringify(getList),
        'EX',
        60 * 10
      );
      return res.status(200).json({
        message: req.t('PROFILE_INFO_LIST'),
        status: true,
        data: getList,
      });
    }
  } catch (err) {
    Utils.echoLog('error in listing profile info ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// get profile info details
ProfileInfoCtr.getProfileInfoDetails = async (req, res) => {
  try {
    const getProfileInfoDetails = await profileInfoModel.findOne({
      _id: req.params.id,
    });
    if (getProfileInfoDetails) {
      return res.status(200).json({
        message: req.t('PROFILE_INFO_DETAILS'),
        status: true,
        data: getProfileInfoDetails,
      });
    } else {
      return res.status(400).json({
        message: req.t('INVALID_PROFILE_INFO'),
        status: true,
      });
    }
  } catch (err) {
    Utils.echoLog('error in getting profile info details ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// list banner for admin
ProfileInfoCtr.listForAdmin = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const totalCount = await profileInfoModel.countDocuments({});
    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);
    const list = await profileInfoModel
      .find({})
      .sort({ createdAt: -1 })
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .limit(+process.env.LIMIT);

    return res.status(200).json({
      message: req.t('PROFILE_INFO_LIST'),
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
    Utils.echoLog('error in listing profile info for admin ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = ProfileInfoCtr;
