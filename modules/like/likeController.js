const LikeModel = require('./likeModel');
const Utils = require('../../helper/utils');
const LikeCtr = {};

LikeCtr.toggle = async (req, res) => {
  try {
    const fetchDetails = await LikeModel.findOne({
      userId: req.userData._id,
      nftId: req.params.nftId,
    });

    if (fetchDetails) {
      await LikeModel.deleteOne({ _id: fetchDetails._id });

      return res.status(200).json({
        message: req.t('SUCCESS'),
        status: true,
      });
    } else {
      const addNewLike = new LikeModel({
        userId: req.userData._id,
        nftId: req.params.nftId,
      });
      await addNewLike.save();
      return res.status(200).json({
        message: req.t('SUCCESS'),
        status: true,
      });
    }
  } catch (err) {
    Utils.echoLog('error in toggle liking   ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// like ctr details

LikeCtr.checkIsLiked = async (req, res) => {
  try {
    if (req.userData && req.userData._id) {
      const checkIsLiked = await LikeModel.findOne({
        userId: req.userData._id,
        nftId: req.params.nftId,
      });
      return res.status(200).json({
        message: 'LIKE_STATUS',
        status: true,
        data: {
          isFollowed: checkIsLiked ? true : false,
        },
      });
    } else {
      return res.status(200).json({
        message: 'LIKE_STATUS',
        status: true,
        data: {
          isFollowed: false,
        },
      });
    }
  } catch (err) {
    Utils.echoLog(`error in checkIsLiked  ${err}`);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// get likes count
LikeCtr.getLikesCount = async (req, res) => {
  try {
    const getLikesCount = await LikeModel.countDocuments({
      nftId: req.params.nftId,
    });

    return res.status(200).json({
      message: 'LIKE_COUNT',
      status: true,
      data: {
        count: getLikesCount,
      },
    });
  } catch (err) {
    Utils.echoLog(`error in getLikesCount  ${err}`);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};
module.exports = LikeCtr;
