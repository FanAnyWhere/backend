const Web3 = require('web3');
const mongoose = require('mongoose');
const ContractAbi = require('../abi/contract.json');
const NftModel = require('../modules/nft/nftModel');
const UserModel = require('../modules/user/userModal');
const EditionModel = require('../modules/edition/editonModel');
const CancelledOrder = require('../contract/cancellerOrders');
const HistoryModel = require('../modules/history/historyModel');
const LogsHelper = require('../contract/getLogs');
const tokenContractJson = require('../abi/token.json');
const { statusObject } = require('./enum');
const Utils = require('./utils');
const NotificationModel = require('../modules/notification/notificationModel');
// const BlockJson = require('../result/blockNo.json');
// const OrderBlockJson = require('../result/orderBlock.json');
const TransferEvent = require('../contract/transferEvent');
const BlockModel = require('../modules/block/blockModel');
const fs = require('fs');
const bidPlaced = require('../contract/bidPlaced');

const webSocketProvider =
  process.env.NODE_ENV === 'development'
    ? 'wss://speedy-nodes-nyc.moralis.io/1a2b3c4d5e6f1a2b3c4d5e6f/polygon/mainnet/ws'
    : 'wss://speedy-nodes-nyc.moralis.io/1a2b3c4d5e6f1a2b3c4d5e6f/polygon/mainnet/ws';

const options = {
  timeout: 30000,
  clientConfig: {
    // Useful if requests are large
    maxReceivedFrameSize: 100000000, // bytes - default: 1MiB
    maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

    // Useful to keep a connection alive
    keepalive: true,
    keepaliveInterval: -1, // ms
  },
  reconnect: {
    auto: true,
    delay: 1000, // ms
    maxAttempts: 10,
    onTimeout: false,
  },
};

const provider =
  process.env.NODE_ENV === 'development'
    ? 'https://rpc-mumbai.maticvigil.com/'
    : 'https://rpc-mumbai.maticvigil.com/';

const getWeb3Event = {};
let lastReadBlock = 23835072;

getWeb3Event.getTransferEvent = async (req, res) => {
  try {
    // const web3 = new Web3(provider);
    const web3 = new Web3(
      new Web3(
        new Web3.providers.WebsocketProvider(
          'wss://speedy-nodes-nyc.moralis.io/99b46be4728d3ba4bcc6cbb2/polygon/mumbai/archive/ws',
          options
        )
      )
    );

    // order placed event

    const contract = new web3.eth.Contract(
      ContractAbi,
      process.env.ESCROW_ADDRESS
    );

    contract.events
      .OrderPlaced({
        // filter: {
        //   from: '0x0000000000000000000000000000000000000000', //,
        //   // to: "0x8c8Ea652DE618a30348dCce6df70C8d2925E6814"
        // },
        fromBlock: lastReadBlock,
      })
      .on('data', async (getPastEvents) => {
        const nonce = getPastEvents.returnValues.nonce;
        const result = getPastEvents.returnValues;
        const order = result['order'];
        const transactionHash = getPastEvents.transactionHash;
        checkMinting(result, order, nonce, transactionHash);
      });

    // // order bought events
    contract.events
      .OrderBought({
        fromBlock: lastReadBlock,

      })
      .on('data', async (getPastEvents) => {
        const result = getPastEvents.returnValues;
        const order = result['order'];
        const transactionHash = getPastEvents.transactionHash;

        await orderEvent(result, order, transactionHash, result.nonce);
      });

    //edition transferred events
    contract.events
      .EditionTransferred({
        fromBlock: lastReadBlock,
      })
      .on('data', async (transferred) => {
        const result = transferred.returnValues;
        const transactionhash = transferred.transactionHash;
        await TransferredEvent(transactionhash, result);
      });

    // order cancelled events
    contract.events
      .OrderCancelled({
        fromBlock: lastReadBlock,
      })
      .on('data', async (cancelledEvent) => {
        const editionNo = cancelledEvent.returnValues.editionNumber;
        const tokenId = cancelledEvent.returnValues.order['tokenId'];
        const transactionHash = cancelledEvent.transactionHash;

        await CancelledOrder.cancelTransfer(
          editionNo,
          tokenId,
          transactionHash
        );
      });

    // bid placed events
    contract.events
      .BidPlaced({
        fromBlock: lastReadBlock,
      })
      .on('data', async (bids) => {
        // console.log('bid is:', bids);
        const result = bids.returnValues;
        const order = result['order'];

        await bidPlaced.checkBid(result, order);
      });

    lastReadBlock = await web3.eth.getBlockNumber();
  } catch (err) {
    Utils.echoLog(`Error in web3 listner for mint :${err}`);
  }
};

async function TransferredEvent(hash, result) {
  // console.log('transactionHash', transactionHash);
  return new Promise(async (resolve, reject) => {
    if (result['to'].trim() === '0x0000000000000000000000000000000000000000') {
      await TransferEvent.burn(result, hash);
      resolve(true);
    } else {
      await TransferEvent.setTransferEvent(result, hash);
      resolve(true);
    }
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function checkMinting(result, order, nonce, transactionhash) {
  try {
    const checkIsBuy = +order['saleType'] === 2 ? true : false;
    const checkIsOffer = +order['saleType'] === 3 ? true : false;

    const isSecondHand = checkIsBuy || checkIsOffer ? true : false;

    if (isSecondHand) {
      await orderPlacedForSecondHand(result, order, transactionhash, nonce);
    } else {
      const web3 = new Web3(provider);
      await sleep(1000);
      const tokenContract = new web3.eth.Contract(
        tokenContractJson,
        process.env.TOKEN_ADDRESS
      );
      // check valid mongoose id
      const getTokenUri = await tokenContract.methods
        .tokenURI(order.tokenId)
        .call();

      // if we get token uri from token contract
      if (getTokenUri) {
        // console.log('token uri is:', getTokenUri);
        // check token id is valid mongoose object id
        const checkIsValid = mongoose.isValidObjectId(getTokenUri);

        if (checkIsValid) {
          // find the nft and allocate the token id to it
          const findNft = await NftModel.findOne({ _id: getTokenUri });
          if (findNft && !findNft.tokenId) {
            findNft.tokenId = order.tokenId;
            findNft.status = statusObject.APPROVED;
            findNft.nonce = +nonce;

            if (+order.saleType === 1) {
              findNft.auctionStartDate = result.timestamp;
              findNft.auctionEndDate = order.timeline;
            } else {
              findNft.auctionStartDate = order.timeline;
            }
            const saveNft = await findNft.save();

            const findUser = await UserModel.findById(saveNft.ownerId);
            if (findUser) {
              findUser.nftCreated = findUser.nftCreated + 1;
              await findUser.save();

              const addNewHistory = new HistoryModel({
                nftId: saveNft._id,
                editionNo: null,
                ownerId: findUser._id,
                text: 'Minted by ',
                buyPrice: saveNft.price,
                timeline: Math.floor(Date.now() / 1000),
              });

              addNewHistory.save();
            }
          } else if (findNft && findNft.tokenId) {
            Utils.echoLog(`token already minted ${findNft.tokenId}  `);
          } else {
            Utils.echoLog(`Token Uri not found in database ${getTokenUri}`);
          }
        } else {
          Utils.echoLog(`Not a cvalid token uri ${getTokenUri}`);
        }
      } else {
        Utils.echoLog(`Invalid token Uri ${getTokenUri}`);
      }
    }
  } catch (err) {
    Utils.echoLog(`Error in check minting ${err}`);
  }
}

getWeb3Event.getPastEvents = async (req, res) => {
  try {
    const web3 = new Web3(provider);
    const latestBlockNo = await web3.eth.getBlockNumber();

    const contract = new web3.eth.Contract(
      ContractAbi,
      process.env.ESCROW_ADDRESS
    );
    // get last block synced

    const getLastBlock = await BlockModel.findOne({}, { blockNo: 1 });
    // const orderBlockFile = fs.readFileSync('./result/blockNo.json', 'utf-8');
    // const orderBlock = JSON.parse(orderBlockFile);

    const getPastEvents = await contract.getPastEvents('OrderPlaced', {
      fromBlock: +getLastBlock.blockNo,
      toBlock: latestBlockNo,
    });

    // console.log('past event is:', getPastEvents);

    if (getPastEvents.length) {
      const itreateEvents = async (i) => {
        if (i < getPastEvents.length) {
          const nonce = getPastEvents[i].returnValues.nonce;
          const result = getPastEvents[i].returnValues;
          const order = result['order'];
          const transactionHash = getPastEvents[i].transactionHash;

          checkMinting(result, order, nonce, transactionHash);
          itreateEvents(i + 1);
        } else {
          //   let object = {
          //     endBlock: latestBlockNo,
          //   };
          //  let data = JSON.stringify(object);
          //   fs.writeFileSync('./result/blockNo.json', data);

          // store last block in database
          getLastBlock.blockNo = latestBlockNo;
          await getLastBlock.save();
          Utils.echoLog('Cron fired successfully for fetching events');
        }
      };
      itreateEvents(0);
    } else {
      // let object = {
      //   endBlock: latestBlockNo,
      // };

      // let data = JSON.stringify(object);
      // fs.writeFileSync('./result/blockNo.json', data);

      getLastBlock.blockNo = latestBlockNo;
      await getLastBlock.save();
    }
  } catch (err) {
    Utils.echoLog('Err is:', err);
  }
};

getWeb3Event.orderBuyedEvent = async (req, res) => {
  try {
    const web3 = new Web3(provider);
    const latestBlockNo = await web3.eth.getBlockNumber();
    // console.log('latest block no is for order:', latestBlockNo);
    const contract = new web3.eth.Contract(
      ContractAbi,
      process.env.ESCROW_ADDRESS
    );
    // const orderBlockFile = fs.readFileSync('./result/orderBlock.json', 'utf-8');
    // const orderBlock = JSON.parse(orderBlockFile);

    const getLastBlock = await BlockModel.findOne({}, { orderBlockNo: 1 });

    const getBuyedEvents = await contract.getPastEvents('OrderBought', {
      fromBlock: getLastBlock.orderBlockNo,
      toBlock: latestBlockNo,
    });

    if (getBuyedEvents.length) {
      getBuyedEvents.sort((a, b) => +a.blockNumber - +b.blockNumber);

      // const itreateEvents = async (i) => {
      for (let i = 0; i < getBuyedEvents.length; i++) {
        const result = getBuyedEvents[i].returnValues;
        const order = result['order'];
        const transactionHash = getBuyedEvents[i].transactionHash;

        await orderEvent(result, order, transactionHash, result.nonce);
        // itreateEvents(i + 1);
        // Utils.echoLog('Cron fired successfully for fetching events');
      }

      Utils.echoLog(`Cron fired Successfully for orderBuyedEvent`);

      getLastBlock.orderBlockNo = latestBlockNo;
      await getLastBlock.save();
    } else {
      getLastBlock.orderBlockNo = latestBlockNo;
      await getLastBlock.save();
    }
  } catch (err) {
    Utils.echoLog(`orderBuyedEvent ${err}`);
  }
};

async function orderEvent(result, order, transactionId, nonce) {
  return new Promise(async (resolve, reject) => {
    // console.log('Order is:', +result['amount']);
    try {
      const getNftDetails = await NftModel.findOne({
        tokenId: order['tokenId'],
      });
      const getUserDetails = await UserModel.findOne({
        walletAddress: result['buyer'].toLowerCase().trim(),
      });

      const saleType =
        +order['saleType'] === 0
          ? 'BUY'
          : +order['saleType'] === 1
            ? 'AUCTION'
            : 'SECOND_HAND';

      const checkIsBuy = +order['saleType'] === 2 ? true : false;
      const checkIsOffer = +order['saleType'] === 3 ? true : false;

      const isSecondHand = checkIsBuy || checkIsOffer ? true : false;

      const saleTypes = { type: null, price: 0 };

      console.log(
        `Edition ${+result['editionNumber']}:${+order['pricePerNFT']}`
      );

      // if second hand buy
      if (checkIsBuy) {
        saleTypes.type = 'BUY';
        saleTypes.price = Utils.convertToEther(+order['pricePerNFT']);
      }

      // if second hand offer
      if (checkIsOffer) {
        saleTypes.type = 'OFFER';
        saleTypes.price = 0;
      }

      if (getNftDetails && getUserDetails) {
        const checkEditionAlreadyAdded = await EditionModel.findOne({
          nftId: getNftDetails._id,
          edition: +result['editionNumber'],
        });

        // check edition added
        if (checkEditionAlreadyAdded) {
          let isNew = false;

          if (
            checkEditionAlreadyAdded.transactionId.toLowerCase() !==
            transactionId.toLowerCase()
          ) {
            isNew = true;
          }
          let previousOwner = checkEditionAlreadyAdded.ownerId;
          // check it is second hand sale
          checkEditionAlreadyAdded.transactionId = transactionId;
          checkEditionAlreadyAdded.ownerId = getUserDetails._id;
          checkEditionAlreadyAdded.nonce = nonce;
          checkEditionAlreadyAdded.isOpenForSale = false;
          checkEditionAlreadyAdded.price = Utils.convertToEther(
            +order['pricePerNFT']
          );
          checkEditionAlreadyAdded.walletAddress = result['buyer'];
          checkEditionAlreadyAdded.saleAction = saleType;
          checkEditionAlreadyAdded.timeline = order['timeline'];
          checkEditionAlreadyAdded.isOpenForSale = false;
          checkEditionAlreadyAdded.saleType = saleTypes;

          await checkEditionAlreadyAdded.save();

          // if (
          //   checkEditionAlreadyAdded.transactionId.toLowerCase() !==
          //   transactionId.toLowerCase()
          // ) {

          //   resolve(true);
          // }

          if (isNew) {
            const getNftSold = +getNftDetails.nftSold + 1;
            getNftDetails.nftSold = getNftSold;

            if (getNftSold >= getNftDetails.edition) {
              getNftDetails.saleState = 'SOLD';
            }

            await getNftDetails.save();

            const addNewHistory = new HistoryModel({
              nftId: getNftDetails._id,
              editionNo: +result['editionNumber'],
              ownerId: getUserDetails._id,
              text: '1 edition bought by ',
              buyPrice: Utils.convertToEther(+order['pricePerNFT']),
              timeline: order['timeline'],
            });

            await addNewHistory.save();
            resolve(true);
          }

          const addNewNotification = await new NotificationModel({
            text: {
              en: `Your Nft named ${getNftDetails.title}for edition ${+result[
                'editionNumber'
              ]} is sold `,

              tu: `${getNftDetails.title} eserinizin ${+result[
                'editionNumber'
              ]} numaralı edisyonu satıldı.`,
            },
            route: `/nftDetails/${getNftDetails._id}`,
            userId: previousOwner,
            notification_type: 'sold_nft'
          });

          await addNewNotification.save();

          const addNewNotificationForBuyer = await new NotificationModel({
            text: {
              en: `You bought  ${getNftDetails.title}.`,
              tu: `${getNftDetails.title} adlı eseri aldınız.`,
            },
            route: `/nftDetails/${getNftDetails._id}`,
            userId: getUserDetails._id,
            notification_type: 'bought_nft'
          });

          await addNewNotificationForBuyer.save();

          await addNewNotification.save();

          await LogsHelper.getLogs(transactionId, getNftDetails._id);
          resolve(true);
        } else {
          const addNewEdition = new EditionModel({
            nftId: getNftDetails._id,
            ownerId: getUserDetails._id,
            edition: +result['editionNumber'],
            transactionId: transactionId,
            price: Utils.convertToEther(+order['pricePerNFT']),
            walletAddress: result['buyer'],
            saleAction: saleType,
            nonce: nonce,
            isOpenForSale: false,
            timeline: order['timeline'],
            saleType: saleTypes,
          });

          const addNewHistory = new HistoryModel({
            nftId: getNftDetails._id,
            editionNo: +result['editionNumber'],
            ownerId: getUserDetails._id,
            text: '1 edition bought by ',
            buyPrice: Utils.convertToEther(+order['pricePerNFT']),
            timeline: order['timeline'],
          });

          await addNewEdition.save();
          const addHistory = await addNewHistory.save();

          const getNftSold = +getNftDetails.nftSold + 1;
          getNftDetails.nftSold = getNftSold;

          if (getNftSold >= getNftDetails.edition) {
            getNftDetails.saleState = 'SOLD';
          }

          await getNftDetails.save();

          const addNewNotification = await new NotificationModel({
            text: {
              en: `Your Nft named ${getNftDetails.title}for edition ${+result[
                'editionNumber'
              ]} is sold`,

              tu: `${getNftDetails.title} eserinizin ${+result[
                'editionNumber'
              ]} numaralı edisyonu satıldı.`,
            },
            route: `/nftDetails/${getNftDetails._id}`,
            userId: getNftDetails['ownerId'],
            notification_type: 'sold_nft'
          });

          await addNewNotification.save();

          const addNewNotificationForBuyer = await new NotificationModel({
            text: {
              en: `You bought  ${getNftDetails.title}`,
              tu: `${getNftDetails.title} adlı eseri aldınız.`,
            },
            route: `/nftDetails/${getNftDetails._id}`,
            userId: getUserDetails._id,
            notification_type: 'bought_nft'
          });

          await addNewNotificationForBuyer.save();

          await LogsHelper.getLogs(transactionId, getNftDetails._id);

          resolve(true);
        }
      } else {
        // console.log('NFT DETAILS NO TFOUND ', order['tokenId']);
        resolve(true);
      }
    } catch (err) {
      // console.log('error in functin', err);
      Utils.echoLog(`Error in check orderEvent ${err}`);
      resolve(false);
    }
  });
}

// get nft transfer event
getWeb3Event.getTransferEventFromContract = async (req, res) => {
  try {
    const web3 = new Web3(provider);
    const latestBlockNo = await web3.eth.getBlockNumber();

    const getLastBlock = await BlockModel.findOne({}, { transferBlockNo: 1 });

    const contract = new web3.eth.Contract(
      ContractAbi,
      process.env.ESCROW_ADDRESS
    );

    const transferEvent = await contract.getPastEvents('EditionTransferred', {
      fromBlock: getLastBlock.transferBlockNo,
      toBlock: latestBlockNo,
    });

    if (transferEvent.length) {
      transferEvent.sort((a, b) => +a.blockNumber - +b.blockNumber);
      for (let i = 0; i < transferEvent.length; i++) {
        const result = transferEvent[i].returnValues;
        const transactionhash = transferEvent[i].transactionHash;

        if (
          result['to'].trim() === '0x0000000000000000000000000000000000000000'
        ) {
          TransferEvent.burn(result, transactionhash);
        } else {
          TransferEvent.setTransferEvent(result, transactionhash);
        }
      }
      getLastBlock.transferBlockNo = latestBlockNo;
      await getLastBlock.save();
    } else {
      getLastBlock.transferBlockNo = latestBlockNo;
      await getLastBlock.save();
    }
  } catch (err) {
    // console.log('err is:', err);
    Utils.echoLog(`orderBuyedEvent ${err}`);
  }
};

// seconf hand order buy

async function orderPlacedForSecondHand(result, order, transactionId, nonce) {
  return new Promise(async (resolve, reject) => {
    try {
      const web3 = new Web3(provider);

      const tokenContract = new web3.eth.Contract(
        ContractAbi,
        process.env.ESCROW_ADDRESS
      );
      // check valid mongoose id
      const getEdition = await tokenContract.methods
        .secondHandOrder(order['seller'], nonce)
        .call();

      const getNftDetails = await NftModel.findOne({
        tokenId: order['tokenId'],
      });
      const getUserDetails = await UserModel.findOne({
        walletAddress: order['seller'].toLowerCase().trim(),
      });

      const saleType =
        +order['saleType'] === 0
          ? 'BUY'
          : +order['saleType'] === 1
            ? 'AUCTION'
            : 'SECOND_HAND';

      // console.log('sale Type is', +order['saleType']);

      const checkIsBuy = +order['saleType'] === 2 ? true : false;
      const checkIsOffer = +order['saleType'] === 3 ? true : false;

      const isSecondHand = checkIsBuy || checkIsOffer ? true : false;

      // console.log('Is seond hand is:', isSecondHand);

      console.log(
        `Edition ${+result['editionNumber']}:${+order['pricePerNFT']}`
      );

      const saleTypes = { type: null, price: 0 };

      // if second hand buy
      if (checkIsBuy) {
        saleTypes.type = 'BUY';
        saleTypes.price = Utils.convertToEther(+order['pricePerNFT']);
      }

      // if second hand offer
      if (checkIsOffer) {
        saleTypes.type = 'OFFER';
        saleTypes.price = Utils.convertToEther(+order['pricePerNFT']);
      }

      if (getNftDetails && getUserDetails) {
        const checkEditionAlreadyAdded = await EditionModel.findOne({
          nftId: getNftDetails._id,
          edition: +result['editionNumber'],
        });

        // check edition added
        if (checkEditionAlreadyAdded) {
          // check it is second hand sale
          checkEditionAlreadyAdded.transactionId = transactionId;
          checkEditionAlreadyAdded.ownerId = getUserDetails._id;
          checkEditionAlreadyAdded.nonce = nonce;
          checkEditionAlreadyAdded.isOpenForSale = isSecondHand;
          // checkEditionAlreadyAdded.price = Utils.convertToEther(
          //   +order['pricePerNFT']
          // );
          checkEditionAlreadyAdded.walletAddress = order['seller'];
          checkEditionAlreadyAdded.saleAction = saleType;
          checkEditionAlreadyAdded.timeline = order['timeline'];
          checkEditionAlreadyAdded.isOpenForSale = isSecondHand;
          checkEditionAlreadyAdded.saleType = saleTypes;

          await checkEditionAlreadyAdded.save();

          if (getNftDetails.edition === getNftDetails.nftSold) {
            getNftDetails.saleState = 'BUY';
            getNftDetails.nftSold = getNftDetails.nftSold - 1;
            await getNftDetails.save();
          } else {
            if (isSecondHand) {
              getNftDetails.saleState = 'BUY';
              getNftDetails.nftSold = getNftDetails.nftSold - 1;
              await getNftDetails.save();
            }
          }

          resolve(true);
        } else {
          const addNewEdition = new EditionModel({
            nftId: getNftDetails._id,
            ownerId: getUserDetails._id,
            edition: +result['editionNumber'],
            transactionId: transactionId,
            price: Utils.convertToEther(+order['pricePerNFT']),
            walletAddress: order['seller'],
            saleAction: saleType,
            nonce: nonce,
            isOpenForSale: isSecondHand,
            timeline: order['timeline'],
            saleType: saleTypes,
          });

          await addNewEdition.save();

          if (getNftDetails.edition === getNftDetails.nftSold) {
            getNftDetails.saleState = 'BUY';
            getNftDetails.nftSold = getNftDetails.nftSold - 1;
            await getNftDetails.save();
          } else {
            if (isSecondHand) {
              getNftDetails.saleState = 'BUY';
              getNftDetails.nftSold = getNftDetails.nftSold - 1;
              await getNftDetails.save();
            }
          }

          resolve(true);
        }
      } else {
        // console.log('NFT DETAILS NO TFOUND ', order['tokenId']);
        resolve(true);
      }
    } catch (err) {
      // console.log('error in functin', err);
      Utils.echoLog(`Error in check orderEvent ${err}`);
      resolve(false);
    }
  });
}

// get cancelled Events
getWeb3Event.getCancelledEvents = async (req, res) => {
  try {
    const web3 = new Web3(provider);
    const latestBlockNo = await web3.eth.getBlockNumber();

    const getLastBlock = await BlockModel.findOne({}, { orderCancelled: 1 });

    const contract = new web3.eth.Contract(
      ContractAbi,
      process.env.ESCROW_ADDRESS
    );

    const cancelledEvent = await contract.getPastEvents('OrderCancelled', {
      fromBlock: getLastBlock.orderCancelled,
      toBlock: latestBlockNo,
    });

    if (cancelledEvent && cancelledEvent.length) {
      // console.log('cancelled event is:', cancelledEvent[0].returnValues);
      for (let i = 0; i < cancelledEvent.length; i++) {
        const editionNo = cancelledEvent[i].returnValues.editionNumber;
        const tokenId = cancelledEvent[i].returnValues.order['tokenId'];
        const transactionHash = cancelledEvent[i].transactionHash;

        await CancelledOrder.cancelTransfer(
          editionNo,
          tokenId,
          transactionHash
        );
      }

      getLastBlock.orderCancelled = latestBlockNo;
      await getLastBlock.save();
    } else {
      getLastBlock.orderCancelled = latestBlockNo;
      await getLastBlock.save();
    }
  } catch (err) {
    Utils.echoLog(`Error in cancelled events ${err}`);
  }
};

module.exports = getWeb3Event;
