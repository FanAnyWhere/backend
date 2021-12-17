const Web3 = require('web3');
const mongoose = require('mongoose');
const ContractAbi = require('../abi/contract.json');
const NftModel = require('../modules/nft/nftModel');
const UserModel = require('../modules/user/userModal');
const EditionModel = require('../modules/edition/editonModel');
const RoleModel = require('../modules/roles/rolesModal');
const Utils = require('../helper/utils');
const PopularNftModel = require('../modules/admin/popular-nft/popularNftModel');

const fs = require('fs');
const { resolve } = require('path');

const cancelledEvent = {};

// transfer button
cancelledEvent.cancelTransfer = async (editionNo, tokenId, transactionHash) => {
  return new Promise(async (resolve, reject) => {
    try {
      const findNft = await NftModel.findOne({ tokenId: +tokenId });
      if (findNft) {
        const findEdition = await EditionModel.findOne({
          nftId: findNft._id,
          edition: +editionNo,
        });

        const saleType = {
          type: null,
          price: 0,
        };

        if (findEdition) {
          findEdition.isOpenForSale = false;
          findEdition.saleType = saleType;
          findEdition.transactionId = transactionHash;
          await findEdition.save();

          if (findNft.edition === 1 && findNft.nftSold === 0) {
            findNft.nftSold = findNft.nftSold + 1;
            findNft.saleState = 'SOLD';
            await findNft.save();
          } else {
            const getNftSold = +findNft.nftSold + 1;
            findNft.nftSold = getNftSold;

            if (getNftSold >= findNft.edition) {
              findNft.saleState = 'SOLD';
            } else {
              findNft.saleState = 'BUY';
            }

            await findNft.save();
          }
        } else {
          Utils.echoLog(
            `Edition not found for ${findNft._id} with edition no ${editionNo}`
          );
          resolve(true);
        }
      } else {
        // NFT not found
        Utils.echoLog(
          `NFt not found for ${tokenId} with edition no ${editionNo}`
        );
      }
      resolve(true);
    } catch (err) {
      Utils.echoLog(`Error in cancelTransfer event ${err} `);
      resolve(false);
    }
  });
};

module.exports = cancelledEvent;
