const BannerModel = require('./bannerModel');
const Utils = require('../../../helper/utils');
const asyncRedis = require('async-redis');
const client = asyncRedis.createClient();
const { cachedData } = require('../../../helper/enum');
const BannerCtr = {};

// add new banner
BannerCtr.addNewBanner = async (req, res) => {
  try {
    const { url, banner, mobile } = req.body;
    const addNewBanner = new BannerModel({
      url,
      banner,
      mobile,
    });
    const saveBanner = await addNewBanner.save();

    client.del(cachedData.LIST_BANNER);
    return res.status(200).json({
      message: req.t('BANNER_ADDED_SUCCESSFULLY'),
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
    Utils.echoLog('error in  creating new banner ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// update banner
BannerCtr.updateBanner = async (req, res) => {
  try {
    const fetchBannerDetails = await BannerModel.findOne({
      _id: req.params.id,
    });

    if (fetchBannerDetails) {
      if (req.body.url) {
        fetchBannerDetails.url = req.body.url;
      }
      if (req.body.banner) {
        fetchBannerDetails.banner = req.body.banner;
      }
      if (req.body.mobile) {
        fetchBannerDetails.mobile = req.body.mobile;
      }
      if (req.body.status) {
        fetchBannerDetails.isActive = req.body.status;
      }
      if (!req.body.status) {
        fetchBannerDetails.isActive = req.body.status;
      }

      await fetchBannerDetails.save();

      client.del(cachedData.LIST_BANNER);

      return res.status(200).json({
        message: req.t('BANNER_UPDATED_SUCCESSFULLY'),
        status: true,
      });
    } else {
      return res.status(400).json({
        message: req.t('INVALID_BANNER'),
        status: true,
      });
    }
  } catch (err) {
    Utils.echoLog('error in  creating new banner ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};
// delete banner
BannerCtr.deleteBanner = async (req, res) => {
  try {
    const deleteBanner = await BannerModel.deleteOne({ _id: req.params.id });

    if (deleteBanner && deleteBanner.deletedCount > 0) {
      return res.status(200).json({
        message: req.t('BANNER_DELETED'),
        status: true,
      });
    } else {
      return res.status(400).json({
        message: req.t('INVALID_BANNER'),
        status: true,
      });
    }
  } catch (err) {
    Utils.echoLog('error in  creating deleting banner ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// list banner for users
BannerCtr.list = async (req, res) => {
  try {
    const getList = await BannerModel.find(
      { isActive: true },
      { isActive: 0, createdAt: 0, updatedAt: 0 }
    ).sort({ createdAt: -1 });
    if (getList) {
      await client.set('banner-list', JSON.stringify(getList), 'EX', 60 * 10);
      return res.status(200).json({
        message: req.t('BANNER_LIST'),
        status: true,
        data: getList,
      });
    }
  } catch (err) {
    Utils.echoLog('error in listing banner ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// list banner for admin
BannerCtr.listForAdmin = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const totalCount = await BannerModel.countDocuments({});
    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);
    const list = await BannerModel.find({})
      .sort({ createdAt: -1 })
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .limit(+process.env.LIMIT);

    return res.status(200).json({
      message: req.t('BANNER_LIST'),
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
    Utils.echoLog('error in listing banner for admin ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// get banner details
BannerCtr.getBannerDetails = async (req, res) => {
  try {
    const getBannerDetails = await BannerModel.findOne({ _id: req.params.id });
    if (getBannerDetails) {
      return res.status(200).json({
        message: req.t('BANNER_DETAILS'),
        status: true,
        data: getBannerDetails,
      });
    } else {
      return res.status(400).json({
        message: req.t('INVALID_BANNER'),
        status: true,
      });
    }
  } catch (err) {
    Utils.echoLog('error in listing banner ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = BannerCtr;
