const AsyncRedis = require('async-redis');
const Client = AsyncRedis.createClient();

const hallOfFrameMiddleware = {};

hallOfFrameMiddleware.checkRedis = async (req, res, next) => {
  try {
    const type = req.params.type ? req.params.type.toLowerCase().trim() : null;

    const fetchRedisData = await Client.get(type);
    if (fetchRedisData) {
      let resMessage = null;

      if (type === 'artist') {
        resMessage = 'TOP_ARTIST';
      } else if (type === 'collector') {
        resMessage = 'TOP_COLLECTOR';
      } else {
        resMessage = 'TOP_ARTWORK';
      }
      return res.status(200).json({
        message: req.t(resMessage),
        status: true,
        data: JSON.parse(fetchRedisData),
      });
    } else {
      return next();
    }
  } catch (err) {
    Utils.echoLog(`Error in listinh Hall of frame ${err}`);

    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = hallOfFrameMiddleware;
