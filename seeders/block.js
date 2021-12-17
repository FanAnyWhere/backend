const BlockModel = require('../modules/block/blockModel');
const Utils = require('../helper/utils');
const Blocks = {};

Blocks.inializeBlock = async () => {
  try {
    const addNewBlock = new BlockModel({
      blockNo: 0,
      orderBlockNo: 0,
      transferBlockNo: 0,
      orderCancelled: 0,
    });
    await addNewBlock.save();
  } catch (err) {
    Utils.echoLog('error in adding new roles');
  }
};

module.exports = Blocks;
