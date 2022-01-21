const NftModel = require('./nftModel');
const CollectionModel = require('./collectionModel');
const LikeModel = require('../like/likeModel');
const Utils = require('../../helper/utils');
const EditionModel = require('../edition/editonModel');
const HistoryModel = require('../history/historyModel');
// const EditionModel = require('../edition/editonModel');
const PopularNftModel = require('../admin/popular-nft/popularNftModel')
const { statusObject } = require('../../helper/enum');
const { query } = require('winston');
const { filter } = require('bluebird');

const nftCtr = {};
// add a new NFT
nftCtr.addNewNft = async (req, res) => {
  try {
    const {
      title,
      description,
      image,
      collectionId,
      digitalKey,
      unlockContent,
      coCreator,
      category,
    } = req.body;

    const createNewNft = new NftModel({
      title: title,
      description: description ? description : null,
      image: image,
      ownerId: req.role === 'ADMIN' ? req.body.ownerId : req.userData._id,
      category: category,
      collectionId: collectionId ? collectionId : null,
      digitalKey: digitalKey,
      unlockContent: unlockContent ? unlockContent : false,
      coCreator: coCreator ? req.body.coCreator : null,
      price: +req.body.price,
      saleState: req.body.saleState,
      auctionTime: req.body.auctionTime ? req.body.auctionTime : 0,
      edition: req.body.edition ? req.body.edition : 1,
    });

    const saveNft = await createNewNft.save();

    return res.status(200).json({
      message: req.t('ADD_NEW_NFT'),
      status: true,
      data: {
        _id: saveNft._id,
      },
    });
  } catch (err) {
    Utils.echoLog('error in nft create', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// add a new collection
nftCtr.addNewCollection = async (req, res) => {
  try {
    const { logo, name, description, category } = req.body;

    const addNewCollection = new CollectionModel({
      logo,
      name,
      slugText: name,
      description,
      category,
      ownerId: req.role === 'ADMIN' ? req.body.ownerId : req.userData._id,
    });

    await addNewCollection.save();

    return res.status(200).json({
      message: req.t('COLLECTION_ADDED'),
      status: true,
    });
  } catch (err) {
    Utils.echoLog('error in adding new collection', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// update the collection
nftCtr.updateCollection = async (req, res) => {
  try {
    const fetchCollection = await CollectionModel.findById(req.params.id);

    if (fetchCollection) {
      if (req.body.logo) {
        fetchCollection.logo = req.body.logo;
      }
      if (req.body.name) {
        fetchCollection.name = req.body.name;
        fetchCollection.slugText = req.body.name;
      }
      if (req.body.description) {
        fetchCollection.description = req.body.description;
      }

      if (req.body.category && req.body.category.length) {
        fetchCollection.category = req.body.category;
      }
      // remove nft from collection
      if (req.body.nftId && req.body.nftId.length) {
        // find the nft of that user only

        const query = { _id: { $in: req.body.nftId } };

        if (req.role !== 'ADMIN') {
          query.ownerId = req.userData._id;
        }

        const findNftAndUpdate = await NftModel.find(query);

        if (findNftAndUpdate && findNftAndUpdate.length) {
          for (let i = 0; i < findNftAndUpdate.length; i++) {
            const update = await NftModel.update(
              { _id: findNftAndUpdate[i]._id },
              { $set: { collectionId: null } },
              { upsert: true }
            );
          }
        }
      }

      await fetchCollection.save();

      return res.status(200).json({
        message: req.t('COLLECTION_UPDATED'),
        status: true,
      });
    }
  } catch (err) {
    Utils.echoLog('error in updating the collection ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// update nft
nftCtr.updateNft = async (req, res) => {
  try {
    const fetchNftDetails = await NftModel.findById(req.params.id);

    if (fetchNftDetails) {
      if (req.body.title) {
        fetchNftDetails.title = req.body.title;
      }
      if (req.body.category && req.body.category.length) {
        fetchNftDetails.category = req.body.category;
      }
      if (req.body.description) {
        fetchNftDetails.description = req.body.description;
      }
      if (req.body.image && Object.keys(req.body.image).length) {
        fetchNftDetails.image = req.body.image;
      }
      if (req.body.unlockContent) {
        fetchNftDetails.unlockContent = true;
        fetchNftDetails.digitalKey = req.body.digitalKey;
      }
      if (req.body.coCreator && Object.keys(req.body.coCreator).length) {
        fetchNftDetails.coCreator = req.body.coCreator;
      }
      if (req.body.price) {
        fetchNftDetails.price = req.body.price;
      }
      if (req.body.saleState) {
        fetchNftDetails.saleState = req.body.saleState;
      }

      if (req.body.auctionTime) {
        fetchNftDetails.auctionTime = req.body.auctionTime;
      }

      if (req.body.edition) {
        fetchNftDetails.edition = req.body.edition;
      }

      if (req.body.isActive === false) {
        fetchNftDetails.isActive = false;
      }

      if (req.body.collectionId) {
        fetchNftDetails.collectionId = req.body.collectionId;
      }

      if (req.body.isActive) {
        fetchNftDetails.isActive = true;
      }
      await fetchNftDetails.save();
      return res.status(200).json({
        message: req.t('NFT_UPDATED'),
        status: true,
      });
    } else {
      return res.status(400).json({
        message: req.t('INVALID_NFT'),
        status: false,
      });
    }
  } catch (err) {
    Utils.echoLog('error in updating NFT ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// list collection
nftCtr.getCollectionByUsers = async (req, res) => {
  try {
    const userId = req.params.id ? req.params.id : req.userData._id;

    const getCollectionByUser = await CollectionModel.find(
      {
        ownerId: userId,
        isActive: 1,
      },
      { isActive: 0, createdAt: 0, updatedAt: 0 }
    )
      .populate({
        path: 'ownerId',
        select: { _id: 1, walletAddress: 1, username: 1, profile: 1, name: 1 },
      })
      .populate({
        path: 'category',
        select: { createdAt: 0, updatedAt: 0 },
      });

    return res.status(200).json({
      message: req.t('COLLECTION_LIST'),
      status: true,
      data: getCollectionByUser,
    });
  } catch (err) {
    Utils.echoLog('error in getting  collection list', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// get single collection details
nftCtr.getSingleCollectionDetails = async (req, res) => {
  try {
    const fetchCollectionDetails = await CollectionModel.findById(
      req.params.id
    ).populate({
      path: 'category',
      select: { createdAt: 0, updatedAt: 0 },
    });

    return res.status(200).json({
      message: req.t('COLLECTION_DETAILS'),
      status: true,
      data: fetchCollectionDetails,
    });
  } catch (err) {
    Utils.echoLog('error in collection details list', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// get list for admin
nftCtr.getListOfCollectionForAdmin = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const totalCount = await CollectionModel.countDocuments({ isActive: true });

    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);

    const getCollectionList = await CollectionModel.find({
      isActive: true,
    })
      .populate({
        path: 'ownerId',
        select: { _id: 1, walletAddress: 1 , name: 1},
      })
      .populate({
        path: 'category',
        select: { createdAt: 0, updatedAt: 0 },
      })
      .sort({ createdAt: -1 })
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .limit(+process.env.LIMIT);

    return res.status(200).json({
      message: req.t('COLLECTION_LIST'),
      status: true,
      data: getCollectionList,
      pagination: {
        pageNo: page,
        totalRecords: totalCount,
        totalPages: pageCount,
        limit: +process.env.LIMIT,
      },
    });
  } catch (err) {
    Utils.echoLog('error in getting  collection list for admin', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// get NFT By user
nftCtr.getUserNftDetails = async (req, res) => {
  try {
    const query = { ownerId: req.userData._id };

    if (req.query.collectionId) {
      query.collectionId = req.query.collectionId;
    }

    const getAllNftsByUser = await NftModel.find(query).populate({
      path: 'collectionId',
      select: { name: 1, logo: 1 },
    });

    return res.status(200).json({
      message: req.t('NFT_LIST'),
      status: true,
      data: getAllNftsByUser,
    });
  } catch (err) {
    Utils.echoLog('error in getting nft list ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// mint the nft
nftCtr.mintNft = async (req, res) => {
  try {
    const getNftDetails = await NftModel.findById(req.params.id);
    if (getNftDetails) {
      const currentDate = new Date();
      const hours =
        getNftDetails.saleState === 'AUCTION'
          ? getNftDetails.auctionTime + 24
          : 0;
      const addHours =
        getNftDetails.saleState === 'AUCTION' ? new Date().addHours(hours) : 0;

      getNftDetails.status = statusObject.APPROVED;
      getNftDetails.autionStartDate =
        getNftDetails.saleState === 'AUCTION' ? +currentDate : 0;
      getNftDetails.auctionEndDate =
        getNftDetails.saleState === 'AUCTION' ? +addHours : 0;

      await getNftDetails.save();

      return res.status(200).json({
        message: req.t('TOKEN_MINTED_ADDED'),
        status: true,
        data: getAllNftsByUser,
      });
    } else {
      return res.status(400).json({
        message: req.t('INVALID_NFT_ID'),
        status: false,
      });
    }
  } catch (err) {
    Utils.echoLog('error in mintNft nft  ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// list user NFT
nftCtr.listUsersNft = async (req, res) => {
  try {
    let query = { status: 'APPROVED' };

    if (req.query.filter === 'draft') {
      query.status = 'NOT_MINTED';
    }

    if (req.query.status) {
      if (req.query.status === 'SOLD') {
        query.saleState = 'SOLD';
      }
      if (req.query.status === 'AUCTION') {
        query.saleState = 'AUCTION';
        query.auctionEndDate = { $gte: Math.floor(Date.now() / 1000) };
        // query.expr = { $lt: ['nftSold', 'edition'] };
      }
      if (req.query.status === 'BUY') {
        query = {
          $or: [
            { auctionEndDate: { $lt: Math.floor(Date.now() / 1000) } },
            { saleState: 'BUY' },
          ],
        };

        query.status = 'APPROVED';
        // query.expr = { $lt: ['nftSold', 'edition'] };
      }
    }

    if (req.userData && req.userData.role !== 'ADMIN' && !req.params.userId) {
      query.ownerId = req.userData._id;
    }

    if (req.params.userId) {
      query.ownerId = req.params.userId;
    }

    const list = await NftModel.find(query, {
      approvedByAdmin: 0,
      unlockContent: 0,
    })
      .populate({
        path: 'collectionId',
        select: { slugText: 0, ownerId: 0, createdAt: 0, updatedAt: 0 },
      })
      .populate({
        path: 'category',
        select: { createdAt: 0, updatedAt: 0 },
      })
      .populate({
        path: 'ownerId',
        select: { name: 1, username: 1, profile: 1, name: 1 },
      })
      .sort({ createdAt: -1 });
    
    const nftList = await Promise.all(list.map( async (nft) => ({ 
        ...nft._doc, 
        likes: await LikeModel.countDocuments({ nftId: nft.id }),
        popular: await PopularNftModel.countDocuments({ nftId: nft._id })
      })))

    return res.status(200).json({
      message: req.t('USER_NFT_LIST'),
      status: true,
      data: nftList,
    });
  } catch (err) {
    Utils.echoLog('error in listing user  nft  ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// list nft for admin
nftCtr.listNftForAdmin = async (req, res) => {
  try {
    const query = { status: 'APPROVED' };

    if (req.query.filter === 'draft') {
      query.status = 'NOT_MINTED';
    }

    if (req.params.id) {
      query.ownerId = req.params.id;
    }

    const page = req.query.page || 1;
    const totalCount = await NftModel.countDocuments(query);

    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);

    const list = await NftModel.find(query, { approvedByAdmin: 0 })
      .populate({
        path: 'collectionId',
        select: { slugText: 0, ownerId: 0, createdAt: 0, updatedAt: 0 },
      })
      .populate({
        path: 'category',
        select: { createdAt: 0, updatedAt: 0 },
      })
      .populate({
        path: 'ownerId',
        select: { name: 1, username: 1, name: 1 },
      })
      .sort({ createdAt: -1 })
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .limit(+process.env.LIMIT);

    return res.status(200).json({
      message: req.t('NFT_LIST'),
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
    Utils.echoLog('error in listing admin nft  ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// get single nft details
nftCtr.getSingleNftDetails = async (req, res) => {
  try {
    const getNftDetails = JSON.parse(
      JSON.stringify(
        await NftModel.findById(req.params.id)
          .populate({
            path: 'collectionId',
            select: { slugText: 0, ownerId: 0, createdAt: 0, updatedAt: 0 },
          })
          .populate({
            path: 'category',
            select: { createdAt: 0, updatedAt: 0 },
          })
          .populate({
            path: 'ownerId',
            select: { name: 1, username: 1, profile: 1, name: 1 },
          })
          .populate({
            path: 'coCreator.userId',
            select: { username: 1, _id: 1, profile: 1 },
          })
      )
    );

    const getEditionDetails = await EditionModel.find({
      nftId: getNftDetails._id,
    })
      .populate({
        path: 'ownerId',
        select: { name: 1, username: 1, profile: 1, name: 1 },
      })
      .sort({
        updatedAt: -1
      });

    getNftDetails.editions = getEditionDetails;

    // check is Liked
    if (req.userData && req.userData._id) {
      const checkIsLiked = await LikeModel.findOne({
        nftId: getNftDetails._id,
        userId: req.userData._id,
      });

      if (checkIsLiked) {
        getNftDetails.isLiked = true;
      } else {
        getNftDetails.isLiked = false;
      }

      // check isOwner
      const checkIsOwnerOfNft = await NftModel.findOne({
        _id: req.params.id,
        ownerId: req.userData._id,
      });

      // check whether any edition buyed
      const checkEditionBuyed = await EditionModel.findOne({
        nftId: getNftDetails._id,
        ownerId: req.userData._id,
      });

      if (!checkIsOwnerOfNft && !checkEditionBuyed) {
        getNftDetails.digitalKey = null;
      }
    } else {
      getNftDetails.isLiked = false;
      getNftDetails.digitalKey = null;
    }

    return res.status(200).json({
      message: req.t('SINGLE_NFT'),
      status: true,
      data: getNftDetails,
    });
  } catch (err) {
    Utils.echoLog('error in getSingleNftDetails  ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// get nft details
nftCtr.getNftUri = async (req, res) => {
  try {
    const getDetails = await NftModel.findById(req.params.id, {
      title: 1,
      description: 1,
      image: 1,
    });

    if (getDetails) {
      return res.status(200).json({
        image: getDetails.image,
        description: getDetails.description,
        title: getDetails.title,
      });
    }
  } catch (err) {
    Utils.echoLog('error in getNftUri  ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// get nfts under collection
nftCtr.listCollectionNft = async (req, res) => {
  try {
    const getCollectionDetails = JSON.parse(
      JSON.stringify(
        await CollectionModel.findById(req.params.collectionId)
          .populate({
            path: 'ownerId',
            select: {
              _id: 1,
              walletAddress: 1,
              username: 1,
              followersCount: 1,
              followingCount: 1,
              name: 1,
              profile: 1,
              cover: 1,
            },
          })
          .populate({
            path: 'category',
            select: { createdAt: 0, updatedAt: 0 },
          })
      )
    );

    // get nft details
    const getNftDetails = await NftModel.find(
      {
        collectionId: getCollectionDetails._id,
        isActive: true,
        status: statusObject.APPROVED,
      },
      { digitalKey: 0, createdAt: 0, updatedAt: 0 }
    )
      .populate({
        path: 'category',
        select: { _id: 1, isActive: 1, image: 1 },
      })
      .populate({
        path: 'ownerId',
        select: {
          _id: 1,
          walletAddress: 1,
          username: 1,
          followersCount: 1,
          followingCount: 1,
          name: 1,
          profile: 1,
          cover: 1,
        },
      });

    getCollectionDetails.nft = getNftDetails;
    getCollectionDetails.isOwner = false;

    if (
      req.userData &&
      req.userData._id &&
      getCollectionDetails &&
      getCollectionDetails.ownerId
    ) {
      if (
        req.userData._id.toString().toLowerCase() ===
        getCollectionDetails.ownerId._id.toString().toLowerCase()
      ) {
        getCollectionDetails.isOwner = true;
      } else {
        getCollectionDetails.isOwner = false;
      }
    }

    // const getCollectionNfts = await NftModel.find(
    //   {
    //     collectionId: req.params.collectionId,
    //     isActive: true,
    //   },
    //   { digitalKey: 0, createdAt: 0, updatedAt: 0 }
    // )
    //   .populate({
    //     path: 'ownerId',
    //     select: {
    //       _id: 1,
    //       walletAddress: 1,
    //       username: 1,
    //       followersCount: 1,
    //       followingCount: 1,
    //     },
    //   })
    //   .populate({
    //     path: 'category',
    //     select: { _id: 1, isActive: 1, image: 1 },
    //   })
    //   .populate({
    //     path: 'collectionId',
    //     select: { _id: 1, logo: 1, name: 1, description: 1 },
    //   });

    return res.status(200).json({
      message: req.t('COLLECTION_NFT'),
      status: true,
      data: getCollectionDetails,
    });
  } catch (err) {
    Utils.echoLog('error in listCollectionNft  ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// live auctionmarket place api
nftCtr.liveAuctionList = async (req, res) => {
  try {
    const page = req.body.page || 1;
    let query = { isActive: true, status: statusObject.APPROVED };

    if (req.body.category && req.body.category.length) {
      query.category = { $in: req.body.category };
    }

    let filterQuery = [];
    filterQuery.push({
      saleState: 'AUCTION',
      auctionEndDate: { $gte: Math.floor(Date.now() / 1000) },
    })

    // if (req.body.filter && req.body.filter.length) {
    //   // query.saleState = { $in: req.body.filter };
    //   let filterQuery = [];
    //   for (let i = 0; i < req.body.filter.length; i++) {
    //     if (req.body.filter[i] === 'BUYNOW') {
    //       filterQuery.push({
    //         $or: [
    //           { auctionEndDate: { $lt: Math.floor(Date.now() / 1000) } },
    //           { saleState: 'BUY' },
    //         ],
    //       });
    //     }
    //     if (req.body.filter[i] === 'AUCTION') {
    //       filterQuery.push({
    //         saleState: 'AUCTION',
    //         auctionEndDate: { $gte: Math.floor(Date.now() / 1000) },
    //       });
    //     }

    //     if (req.body.filter[i] === 'SOLD') {
    //       filterQuery.push({ saleState: 'SOLD' });
    //     }
    //   }

    //   const prevQuery = query;

    //   query = {
    //     $or: filterQuery,
    //     ...prevQuery,
    //   };
    // }

    if (req.body.search) {
      query.title = {
        $regex: `${req.body.search.toLowerCase()}.*`,
        $options: 'i',
      };
    }

    const totalCount = await NftModel.countDocuments(query);
    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);

    const listNftForMarketPlace = await NftModel.find(query, {
      approvedByAdmin: 0,
      status: 0,
      digitalKey: 0,
    })
      .populate({
        path: 'ownerId',
        select: { _id: 1, walletAddress: 1, username: 1, profile: 1, name: 1 },
      })
      .populate({
        path: 'category',
        select: { _id: 1, isActive: 1, image: 1 },
      })
      .populate({
        path: 'collectionId',
        select: { _id: 1, name: 1, description: 1 },
      })
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .sort({ updatedAt: -1 })
      .limit(+process.env.LIMIT);

    const nftList = await Promise.all(listNftForMarketPlace.map( async (nft) => ({ 
        ...nft._doc, 
        likes: await LikeModel.countDocuments({ nftId: nft.id }),
        popular: await PopularNftModel.countDocuments({ nftId: nft._id })
      })))

    return res.status(200).json({
      message: 'NFT_MARKET_PLACE_LIST',
      status: true,
      data: nftList,
      pagination: {
        pageNo: page,
        totalRecords: totalCount,
        totalPages: pageCount,
        limit: +process.env.LIMIT,
      },
    });
  } catch (err) {
    Utils.echoLog(`Error inlist nft for market place`);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// market place api
nftCtr.marketPlace = async (req, res) => {
  try {
    const page = req.body.page || 1;
    let query = { isActive: true, status: statusObject.APPROVED };
    let sort = { updatedAt: -1 };

    if (req.body.category && req.body.category.length) {
      query.category = { $in: req.body.category };
    }

    if (req.body.collection && req.body.collection.length) {
      // query.collectionId = req.body.collection
      query.collectionId = { $in: req.body.collection };
    }

    if (req.body.filter && req.body.filter.length) {
      // query.saleState = { $in: req.body.filter };
      let filterQuery = [];
      for (let i = 0; i < req.body.filter.length; i++) {
        if (req.body.filter[i] === 'BUYNOW') {
          filterQuery.push({
            $or: [
              { auctionEndDate: { $gt: Math.floor(Date.now() / 1000) } },
              { saleState: 'BUY' },
            ],
          });
        }
        if (req.body.filter[i] === 'AUCTION') {
          filterQuery.push({
            saleState: 'AUCTION',
            auctionEndDate: { $lte: Math.floor(Date.now() / 1000) },
          });
        }

        if (req.body.filter[i] === 'SOLD') {
          filterQuery.push({ saleState: 'SOLD' });
        }
      }

      let sortQuery = {};
      if (req.body.filter ) {
        if (req.body.filter === 'lowToHigh') {
          sortQuery.price = -1
        }

        if (req.body.filter === 'highToLow') {
          sortQuery.price = 1
        }
      }

      const prevQuery = query;
      
      if (filterQuery.length) query = { $or: filterQuery, ...prevQuery, };
      if (sortQuery) sort = sortQuery

    }

    if (req.body.search) {
      query.title = {
        $regex: `${req.body.search.toLowerCase()}.*`,
        $options: 'i',
      };
    }

    const totalCount = await NftModel.countDocuments(query);
    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);

    const listNftForMarketPlace = await NftModel.find(query, {
      approvedByAdmin: 0,
      status: 0,
      digitalKey: 0,
    })
      .populate({
        path: 'ownerId',
        select: { _id: 1, walletAddress: 1, username: 1, profile: 1, name: 1 },
      })
      .populate({
        path: 'category',
        select: { _id: 1, isActive: 1, image: 1 },
      })
      .populate({
        path: 'collectionId',
        select: { _id: 1, name: 1, description: 1 },
      })
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .sort(sort)
      .limit(+process.env.LIMIT);

    const nftList = await Promise.all(listNftForMarketPlace.map( async (nft) => ({ 
        ...nft._doc, 
        likes: await LikeModel.countDocuments({ nftId: nft.id }),
        popular: await PopularNftModel.countDocuments({ nftId: nft._id })
      })))

    return res.status(200).json({
      message: 'NFT_MARKET_PLACE_LIST',
      status: true,
      data: nftList,
      pagination: {
        pageNo: page,
        totalRecords: totalCount,
        totalPages: pageCount,
        limit: +process.env.LIMIT,
      },
    });
  } catch (err) {
    Utils.echoLog(`Error inlist nft for market place`);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// get all collections to get listed in collection tab
nftCtr.getCollectionsList = async (req, res) => {
  try {
    const page = req.body.page || 1;
    const query = { isActive: true };
    if (req.body.search) {
      query.name = {
        $regex: `${req.body.search.toLowerCase()}.*`,
        $options: 'i',
      };
    }

    if (req.body.category && req.body.category.length) {
      query.category = { $in: req.body.category };
    }

    const totalCount = await CollectionModel.countDocuments(query);
    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);

    const getCollections = await CollectionModel.find(query)
      .populate({
        path: 'ownerId',
        select: { _id: 1, walletAddress: 1, username: 1, profile: 1, name: 1 },
      })
      .populate({
        path: 'category',
        select: { createdAt: 0, updatedAt: 0 },
      })
      .sort({ createdAt: -1 })
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .limit(+process.env.LIMIT);

    return res.status(200).json({
      message: req.t('COLLECTION_LIST'),
      status: true,
      data: getCollections,
      pagination: {
        pageNo: page,
        totalRecords: totalCount,
        totalPages: pageCount,
        limit: +process.env.LIMIT,
      },
    });
  } catch (err) {
    Utils.echoLog(`Error in getCollectionsList ${err}`);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// get nft history
nftCtr.getNftHistory = async (req, res) => {
  try {
    const id = req.params.nftId;
    // const edition = req.params.edition;
    const nft = await NftModel.findOne({ _id: id })
    var nftEditions = []
    for (i = 1; i <= nft.edition; i++) {
      nftEditions.push(i)
    }

    const fetchNftCreated = await HistoryModel.findOne({
      nftId: id,
      editionNo: null,
    }).populate({
      path: 'ownerId',
      select: { _id: 1, walletAddress: 1, username: 1, profile: 1, name: 1 },
    });

    const fetchNftHistory = JSON.parse(
      JSON.stringify(
        await HistoryModel.find({
          nftId: id,
          editionNo:  { $in: nftEditions } ,
        })
          .populate({
            path: 'ownerId',
            select: { _id: 1, walletAddress: 1, username: 1, profile: 1, name: 1 },
          })
          .sort({ createdAt: -1 })
      )
    );

    var result;
    if (fetchNftCreated) {
      result = fetchNftHistory.concat(fetchNftCreated);
    } else {
      result = fetchNftCreated
    }

    return res.status(200).json({
      message: req.t('NFT_HISTORY'),
      status: true,
      data: result,
    });
  } catch (err) {
    Utils.echoLog(`Error inlist nft for market place`);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// get liked nfts by user
nftCtr.getLikedNfts = async (req, res) => {
  try {
    let query = {};
    if (req.params.userId) {
      query.userId = req.params.userId;
    } else {
      query.userId = req.userData._id;
    }
    const getLikedNfts = await LikeModel.find(query);

    const nftIds = [];
    if (getLikedNfts.length) {
      for (let i = 0; i < getLikedNfts.length; i++) {
        nftIds.push(getLikedNfts[i].nftId);
      }

      const nfts = await NftModel.find(
        { _id: { $in: nftIds } },
        { digitalKey: 0, createdAt: 0, updatedAt: 0 }
      )
        .populate({
          path: 'collectionId',
          select: { slugText: 0, ownerId: 0, createdAt: 0, updatedAt: 0 },
        })
        .populate({
          path: 'category',
          select: { createdAt: 0, updatedAt: 0 },
        })
        .populate({
          path: 'ownerId',
          select: { name: 1, username: 1, profile: 1, name: 1 },
        });
      
      const nftList = await Promise.all(nfts.map( async (nft) => ({ 
          ...nft._doc, 
          likes: await LikeModel.countDocuments({ nftId: nft.id }),
          popular: await PopularNftModel.countDocuments({ nftId: nft._id })
        })))

      return res.status(200).json({
        message: 'LIKED_NFT',
        status: true,
        data: nftList,
      });
    } else {
      return res.status(200).json({
        message: 'LIKED_NFT',
        status: true,
        data: [],
      });
    }
  } catch (err) {
    Utils.echoLog(`Error in list liked nfts `);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// get buyed Nfts
nftCtr.getUserBuyedNfts = async (req, res) => {
  try {
    let query = { isBurned: false };
    if (req.params.userId) {
      query.ownerId = req.params.userId;
      query.transactionId = { $ne: '0x' };
    } else {
      query.ownerId = req.userData._id;
      query.transactionId = { $ne: '0x' };
    }

    const editions = await EditionModel.find(query);
    const userNfts = [];

    if (editions.length) {
      for (let i = 0; i < editions.length; i++) {
        userNfts.push(editions[i].nftId);
      }

      const fetchUserNft = await NftModel.find(
        { _id: { $in: userNfts } },
        { digitalKey: 0, createdAt: 0, updatedAt: 0 }
      )
        .populate({
          path: 'collectionId',
          select: { slugText: 0, ownerId: 0, createdAt: 0, updatedAt: 0 },
        })
        .populate({
          path: 'category',
          select: { createdAt: 0, updatedAt: 0 },
        })
        .populate({
          path: 'ownerId',
          select: { name: 1, username: 1, profile: 1, name: 1 },
        });
      
      const nftList = await Promise.all(fetchUserNft.map( async (nft) => ({ 
          ...nft._doc, 
          buyEdition: await EditionModel.countDocuments({ ownerId:req.params.userId, nftId: nft.id }),
          buyEditions: await EditionModel.find({ ownerId:req.params.userId, nftId: nft.id }),
          likes: await LikeModel.countDocuments({ nftId: nft.id }),
        })))
      
      return res.status(200).json({
        message: 'USER_OWNED_NFT',
        status: true,
        data: nftList,
      });
    } else {
      return res.status(200).json({
        message: 'USER_OWNED_NFT',
        status: true,
        data: [],
      });
    }
  } catch (err) {
    Utils.echoLog(`Error in list user buyed nfts `);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// // add nft to second hand sales
nftCtr.addNftToSecondHandSales = async (req, res) => {
  try {
    const fetchEditionDetails = await EditionModel.findOne({
      _id: req.body.editionId,
    });

    if (fetchEditionDetails) {
      if (req.body.saleType === 'BUY') {
        fetchEditionDetails.saleType.type = 'BUY';
        fetchEditionDetails.saleAction = 'SECOND_HAND';
        fetchEditionDetails.saleType.price = +req.body.price;
        fetchEditionDetails.isOpenForSale = true;
      }
      if (req.body.saleType === 'OFFER') {
        fetchEditionDetails.saleType.type = 'OFFER';
        fetchEditionDetails.saleAction = 'SECOND_HAND';
        fetchEditionDetails.saleType.price = 0;
        fetchEditionDetails.isOpenForSale = true;
      }

      await fetchEditionDetails.save();

      return res.status(200).json({
        message: req.t('EDITION_UPDATED'),
        status: true,
      });
    } else {
      return res.status(400).json({
        message: req.t('INVALID_EDITION_DETAILS'),
        status: false,
      });
    }
  } catch (err) {
    Utils.echoLog(`Err in addNftToSecondHandSales ${err}`);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = nftCtr;
