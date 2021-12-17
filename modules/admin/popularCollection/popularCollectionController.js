const PopularCollectionModel = require('./popularCollectionModel');
const Utils = require('../../../helper/utils');
// const LikeModel = require('../../like/likeModel');
const PopularCollectionCtr = {};

// add new popular nft
PopularCollectionCtr.addNewCollection = async (req, res) => {
  try {
    const { collectionId, ranking } = req.body;
    const addNewCollection = new PopularCollectionModel({
      collectionId,
      ranking: ranking ? ranking : 0,
    });
    const save = await addNewCollection.save();

    return res.status(200).json({
      message: req.t('POPULAR_ADDED_SUCCESSFULLY'),
      status: true,
      data: {
        details: {
          _id: save._id,
          isActive: save.isActive,
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

// update popular nft
PopularCollectionCtr.updatePopular = async (req, res) => {
  try {
    const fetchDetails = await PopularCollectionModel.findById(req.params.id);

    if (fetchDetails) {
      if (req.body.collectionId) {
        fetchDetails.collectionId = req.body.collectionId;
      }
      if (req.body.isActive) {
        fetchDetails.isActive = req.body.isActive;
      }

      if (req.body.isActive === false) {
        fetchDetails.isActive = false;
      }
      if (fetchDetails.ranking) {
        fetchDetails.ranking = req.body.ranking;
      }

      const updateDetails = await fetchDetails.save();

      return res.status(200).json({
        message: req.t('POPULAR_UPDATED_SUCCESSFULLY'),
        status: true,
        data: {
          _id: updateDetails._id,
          isActive: updateDetails.isActive,
        },
      });
    } else {
      return res.status(400).json({
        message: req.t('INVALID_ID'),
        status: false,
      });
    }
  } catch (err) {
    Utils.echoLog('error in  updating popular nft ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// delete from popular
PopularCollectionCtr.delete = async (req, res) => {
  try {
    const deletePopular = await PopularCollectionModel.deleteOne({
      _id: req.params.id,
    });

    if (deletePopular && deletePopular.deletedCount > 0) {
      return res.status(200).json({
        message: req.t('DELETED'),
        status: true,
      });
    }
  } catch (err) {
    Utils.echoLog('error in  deleteing popular collection ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// list popular nft for users

PopularCollectionCtr.list = async (req, res) => {
  try {
    const listPopular = JSON.parse(
      JSON.stringify(
        await PopularCollectionModel.find({ isActive: true })
          .populate({
            path: 'collectionId',

            populate: [
              {
                path: 'ownerId',
                select: { _id: 1, walletAddress: 1, username: 1, profile: 1 },
                model: 'users',
              },
            ],

            //   populate: {
            //     path: 'ownerId',
            //     select: { _id: 1, walletAddress: 1, username: 1, profile: 1 },
            //     model: 'users',
            //   },
            //   populate: {
            //     path: 'collectionId',
            //     select: { _id: 1, name: 1, description: 1 },
            //     model: 'collection',
            //   },
            //   populate: {
            //     path: 'category',
            //     select: { _id: 1, isActive: 1, image: 1, categoryName: 1 },
            //     model: 'categories',
            //   },
          })
          .sort({
            ranking: 1,
          })
      )
    );

    // if (req.userData && req.userData._id && listPopular.length) {
    //   for (let i = 0; i < listPopular.length; i++) {
    //     const checkIsLiked = await LikeModel.findOne({
    //       userId: req.userData._id,
    //       nftId: listPopular[i].nftId,
    //     });

    //     if (checkIsLiked) {
    //       listPopular[i].isLiked = true;
    //     } else {
    //       listPopular[i].isLiked = false;
    //     }
    //   }
    // }

    return res.status(200).json({
      message: req.t('POPULARLIST'),
      status: true,
      data: listPopular,
    });
  } catch (err) {
    Utils.echoLog('error in  listing new banner ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// listnfts for admin
PopularCollectionCtr.listForAdmin = async (req, res) => {
  try {
    const page = req.query.page || 1;

    const totalCount = await PopularCollectionModel.countDocuments();
    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);

    const listPopular = await PopularCollectionModel.find()
      .populate({
        path: 'collectionId',
      })
      .sort({
        ranking: 1,
      })
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .limit(+process.env.LIMIT);

    return res.status(200).json({
      message: req.t('POPULARLIST'),
      status: true,
      data: listPopular,
      pagination: {
        pageNo: page,
        totalRecords: totalCount,
        totalPages: pageCount,
        limit: +process.env.LIMIT,
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

// get perticular nft details
PopularCollectionCtr.getPerticularNftDetails = async (req, res) => {
  try {
    const getDetails = await PopularCollectionModel.find({
      _id: req.params.id,
    }).populate({
      path: 'collectionId',
    });

    return res.status(200).json({
      message: req.t('LIST'),
      status: true,
      data: getDetails,
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

module.exports = PopularCollectionCtr;
