const HallOfFrameModel = require('./hallOfFrameModel');
const UserModel = require('../user/userModal');
const NftModel = require('../nft/nftModel');
const Utils = require('../../helper/utils');
const AsyncRedis = require('async-redis');
const Client = AsyncRedis.createClient();

const hallOfFrameCtr = {};

hallOfFrameCtr.listHallOfFrame = async (req, res) => {
  try {
    const type = req.params.type ? req.params.type.toLowerCase().trim() : null;

    if (type === 'artist') {
      const findArtist = await HallOfFrameModel.findOne({}, { artist: 1 });
      const artist = [];
      if (findArtist && findArtist.artist && findArtist.artist.length) {
        for (let i = 0; i < findArtist.artist.length; i++) {
          const getUserDetails = await UserModel.findOne({
            _id: findArtist.artist[i].userId,
          });

          const user = {
            username: getUserDetails['username'],
            profile: getUserDetails['profile'],
            name: getUserDetails['name'],
            _id: getUserDetails['_id'],
            totalSale: findArtist.artist[i].totalBnb,
          };

          artist.push(user);
        }

        await Client.set(type, JSON.stringify(artist), 'EX', 1 * 60 * 60);

        return res.status(200).json({
          message: req.t('TOP_ARTIST'),
          status: true,
          data: artist,
        });
      } else {
        return res.status(200).json({
          message: req.t('TOP_ARTIST'),
          status: true,
          data: [],
        });
      }
    } else if (type === 'collector') {
      const findCollector = await HallOfFrameModel.findOne(
        {},
        { collector: 1 }
      );

      const collector = [];
      if (
        findCollector &&
        findCollector.collector &&
        findCollector.collector.length
      ) {
        for (let i = 0; i < findCollector.collector.length; i++) {
          const getUserDetails = await UserModel.findOne({
            _id: findCollector.collector[i].userId,
          });

          if (getUserDetails) {
            const user = {
              username: getUserDetails['username']
                ? getUserDetails['username']
                : null,
              profile: getUserDetails['profile']
                ? getUserDetails['profile']
                : null,
              name: getUserDetails['name'] ? getUserDetails['name'] : null,
              _id: getUserDetails['_id'],
              totalSale: findCollector.collector[i].totalBnb,
            };

            collector.push(user);
          }
        }

        await Client.set(type, JSON.stringify(collector), 'EX', 1 * 60 * 60);

        return res.status(200).json({
          message: req.t('TOP_COLLECTOR'),
          status: true,
          data: collector,
        });
      } else {
        return res.status(200).json({
          message: req.t('TOP_COLLECTOR'),
          status: true,
          data: [],
        });
      }
    } else if (type === 'artwork') {
      const artWorks = [];
      const findArtWork = await HallOfFrameModel.findOne({}, { artwork: 1 });

      if (findArtWork && findArtWork.artwork.length) {
        for (let i = 0; i < findArtWork.artwork.length; i++) {
          const findNfts = await NftModel.findOne({
            _id: findArtWork.artwork[i].nftId,
          });

          const nfts = {
            _id: findNfts._id,
            image: findNfts['image'],
            totalSale: findArtWork.artwork[i].totalBnb,
            title: findNfts['title'],
          };

          artWorks.push(nfts);
        }
        await Client.set(type, JSON.stringify(artWorks), 'EX', 1 * 60 * 60);

        return res.status(200).json({
          message: req.t('TOP_ARTWORK'),
          status: true,
          data: artWorks,
        });
      } else {
        return res.status(200).json({
          message: req.t('TOP_ARTWORK'),
          status: true,
          data: [],
        });
      }
    } else {
      return res.status(400).json({
        message: req.t('INAVLID_TYPE'),
        status: false,
      });
    }
  } catch (err) {
    // console.log('err is:', err);
    Utils.echoLog(`Error in listinh Hall of frame ${err}`);

    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = hallOfFrameCtr;
