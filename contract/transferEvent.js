const Web3 = require('web3');
const mongoose = require('mongoose');
const ContractAbi = require('../abi/contract.json');
const NftModel = require('../modules/nft/nftModel');
const NotificationModel = require('../modules/notification/notificationModel');
const UserModel = require('../modules/user/userModal');
const EditionModel = require('../modules/edition/editonModel');
const RoleModel = require('../modules/roles/rolesModal');
const Utils = require('../helper/utils');
const PopularNftModel = require('../modules/admin/popular-nft/popularNftModel');

const fs = require('fs');

const transferEvent = {};

// transfer button
transferEvent.setTransferEvent = async (data, transactionHash) => {
  return new Promise(async (resolve, reject) => {
    try {
      let findUser = await UserModel.findOne({
        walletAddress: data['to'].toLowerCase().trim(),
      });

      const findNft = await NftModel.findOne({ tokenId: data.id });

      // if user not in our datbase create a new use rwith creator role
      if (!findUser && findNft) {
        const getRoles = await RoleModel.findOne({ roleName: 'COLLECTOR' });
        const createUser = new UserModel({
          role: getRoles._id,
          walletAddress: data['to'].toLowerCase(),
        });

        const saveUser = await createUser.save();
        findUser = saveUser;
      }

      if (findUser && findNft) {
        const checkEditionAlreadyAdded = await EditionModel.findOne({
          nftId: findNft._id,
          edition: +data['edition'],
        });

        let userDetails = {};

        if (checkEditionAlreadyAdded) {
          userDetails = await UserModel.findOne({
            _id: checkEditionAlreadyAdded.ownerId,
          });

          checkEditionAlreadyAdded.ownerId = findUser._id;
          checkEditionAlreadyAdded.walletAddress = data['to'];
          checkEditionAlreadyAdded.transactionId = transactionHash;
          checkEditionAlreadyAdded.isOpenForSale = false;

          checkEditionAlreadyAdded.save();
        } else {
          const addNewEdition = new EditionModel({
            nftId: findNft._id,
            editionNo: data['edition'],
            ownerId: findUser._id,
            buyPrice: findNft.price,
            transactionId: transactionHash,
            timeline: 0,
          });

          await addNewEdition.save();
        }

        const userName = Object.keys(userDetails).length
          ? userDetails.username
            ? userDetails.username
            : userDetails.walletAddress
          : '';

        const addNewNotification = new NotificationModel({
          text: {
            en: `${userName} sent you this NFT  ${findNft.title}`,
            tu: `${userName} adlı kullanıcı size bir NFT gönderdi ${findNft.title}`,
          },
          userId: findUser._id,
          route: `/nftDetails/${findNft._id}`,
        });

        await addNewNotification.save();

        resolve(true);
      } else {
        console.log('NFT AND USER NOT FOUND', data);
        resolve(true);
      }
    } catch (err) {
      console.log('err in tranfer event', err);
      Utils.echoLog(`Erroir in transfer event ${err}`);
      resolve(false);
    }
  });
};

// burn NFt
transferEvent.burn = async (data, transactionHash) => {
  return new Promise(async (resolve, reject) => {
    try {
      // let findUser = await UserModel.findOne({
      //   walletAddress: data['to'].toLowerCase().trim(),
      // });

      const findNft = await NftModel.findOne({ tokenId: data.id });
      if (findNft) {
        // check number of edition
        if (+findNft.edition === 1) {
          const findEdition = await EditionModel.findOne({
            nftId: findNft._id,
          });

          if (findEdition) {
            const addNewNotification = new NotificationModel({
              text: {
                en: `You burned your ${findNft.title} titled NFT`,
                tu: `${findNft.title}  adlı NFT'nizi burn ettiniz.`,
              },
              userId: findEdition.ownerId,
            });

            await addNewNotification.save();
          }

          // delete the edition
          const deletEdition = await EditionModel.deleteOne({
            nftId: findNft._id,
          });
          // delete the nft
          const deleteNft = await NftModel.deleteOne({ _id: findNft._id });
          // delete if in popular
          const deletePopulat = await PopularNftModel.deleteOne({
            nftId: findNft._id,
          });
        }
        // if edition greate than 1
        if (+findNft.edition > 1) {
          const getEdition = await EditionModel.findOne({
            edition: +data['edition'],
            nftId: findNft._id,
          });

          const addNewNotification = new NotificationModel({
            text: {
              en: `You burned your ${findNft.title} titled NFT`,
              tu: `${findNft.title}  adlı NFT'nizi burn ettiniz.`,
            },
            userId: getEdition.ownerId,
          });

          await addNewNotification.save();

          // make pertilcuar edition to burn
          if (getEdition && !getEdition.isBurned) {
            getEdition.isBurned = true;
            getEdition.transactionId = transactionHash;
            await getEdition.save();

            // change in NFT
            // decrement the count of NFt
            // findNft.edition -= 1;
            if (findNft.nftSold > 1) {
              findNft.nftSold -= 1;
            }

            await findNft.save();
            resolve(true);
          } else {
            console.log('edition already burned');
            resolve(true);
          }
        }
        resolve(true);
      } else {
        Utils.echoLog(`NFT burned Not found ${data}`);
        resolve(true);
      }
    } catch (err) {
      console.log('err in burn', { err });
      Utils.echoLog(`Error in NFt Burn ${err}`);
      resolve(false);
    }
  });
};

module.exports = transferEvent;
