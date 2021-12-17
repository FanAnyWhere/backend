const LogsModel = require('../modules/logs/logsModel');
const UserModel = require('../modules/user/userModal');
const RoleModel = require('../modules/roles/rolesModal');
const Utils = require('../helper/utils');
const axios = require('axios');

const getLogsHelper = {};

getLogsHelper.getLogs = async (transactionHash, nftId) => {
  await sleep(Math.floor(Math.random() * 5));
  return new Promise(async (resolve, reject) => {
    try {
      //   await sleep(10000);
      await addLogs(transactionHash, nftId);
    } catch (err) {
      Utils.echoLog(`Error in get logs ${err}`);
      reject(false);
    }
  });
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function addLogs(transactionHash, nftId) {
  return new Promise(async (resolve, reject) => {
    try {
      const config = {
        method: 'get',
        url: `https://api-testnet.bscscan.com/api?module=account&action=txlistinternal&txhash=${transactionHash}&apikey=${process.env.BSC_API_KEY}`,
        headers: {},
      };

      const getTransactionLogs = await axios(config);

      if (getTransactionLogs.status === 200) {
        const getRole = await RoleModel.findOne({ roleName: 'CREATOR' });

        if (+getTransactionLogs.data.status === 1) {
          const transactionData = getTransactionLogs.data.result;

          if (transactionData.length) {
            for (let i = 0; i < transactionData.length; i++) {
              const address = transactionData[i].to;
              if (
                address &&
                address.toLowerCase() !==
                  process.env.ADMIN_WALLET_ADDRESS.toLowerCase()
              ) {
                const getUser = await UserModel.findOne({
                  walletAddress: address.toLowerCase(),
                });

                if (
                  getUser &&
                  getUser.role.toString() === getRole._id.toString()
                ) {
                  const checkIsBlockAvalaible = await LogsModel.findOne({
                    blockNumber: +transactionData[i].blockNumber,
                  });

                  if (!checkIsBlockAvalaible) {
                    const addNewLogs = new LogsModel({
                      userId: getUser._id,
                      nftId: nftId,
                      bnbValue: Utils.convertToEther(
                        +transactionData[i]['value']
                      ),
                      blockNumber: +transactionData[i].blockNumber,
                      timestamp: +transactionData[i].timeStamp,
                    });

                    await addNewLogs.save();
                  }
                }
              } else {
                resolve(true);
              }
            }
            resolve(true);
          }
        } else {
          await sleep(10000);
          addLogs(transactionHash, nftId);
        }
      }
    } catch (err) {
      Utils.echoLog(`Err in fuciton getlogs ${err}`);
    }
  });
}

module.exports = getLogsHelper;
