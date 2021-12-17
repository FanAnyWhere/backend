const FollowModel = require('./followModel');
const Utils = require('../../helper/utils');
const UserModel = require('../user/userModal');
const FollowCtr = {};

FollowCtr.toggle = async (req, res) => {
  try {
    const userId = req.userData.id.toLowerCase();
    const followId = req.params.userId.toLowerCase();

    if (userId.trim() === followId.trim()) {
      return res.status(400).json({
        message: req.t('USER_CANT_FOLLOW'),
        status: false,
      });
    } else {
      const fetchDetails = await FollowModel.findOne({
        userId: req.userData._id,
        follow: req.params.userId,
      });

      if (fetchDetails) {
        const fetchFollowUserDetails = await UserModel.findById(
          fetchDetails.follow
        );

        const fetchFollowingDetails = await UserModel.findById(
          fetchDetails.userId
        );

        await FollowModel.deleteOne({ _id: fetchDetails._id });

        fetchFollowUserDetails.followersCount =
          fetchFollowUserDetails.followersCount - 1;

        fetchFollowingDetails.followingCount =
          fetchFollowingDetails.followingCount - 1;

        await fetchFollowUserDetails.save();
        await fetchFollowingDetails.save();

        return res.status(200).json({
          message: req.t('USER_UNFOLLOW'),
          status: true,
        });
      } else {
        const fetchFollowUserDetails = await UserModel.findById(
          req.params.userId
        );

        const fetchFollowingDetails = await UserModel.findById(
          req.userData._id
        );

        const addNewLike = new FollowModel({
          userId: req.userData._id,
          follow: req.params.userId,
        });
        await addNewLike.save();

        fetchFollowUserDetails.followersCount =
          fetchFollowUserDetails.followersCount + 1;

        fetchFollowingDetails.followingCount =
          fetchFollowingDetails.followingCount + 1;

        await fetchFollowUserDetails.save();
        await fetchFollowingDetails.save();

        return res.status(200).json({
          message: req.t('USER_FOLLOW'),
          status: true,
        });
      }
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

FollowCtr.checkIsFollowed = async (req, res) => {
  try {
    if (req.userData && req.userData._id) {
      const checkIsFollowed = await FollowModel.findOne({
        userId: req.userData._id,
        follow: req.params.userId,
      });

      return res.status(200).json({
        status: true,
        data: {
          isFollowed: checkIsFollowed ? true : false,
        },
      });
    } else {
      return res.status(200).json({
        status: false,
        data: {
          isFollowed: false,
        },
      });
    }
  } catch (err) {
    Utils.echoLog('error in getting check is follwed');
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = FollowCtr;
