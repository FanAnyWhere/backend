const EditionModel = require('../modules/edition/editonModel');
const NftModel = require('../modules/nft/nftModel');
const BidModel = require('../modules/bid/bidModel');
const UserModal = require('../modules/user/userModal');
const NotificationModel = require('../modules/notification/notificationModel');
const Utils = require('../helper/utils');

const bidPlaced = {};

bidPlaced.checkBid = async (result, order) => {
  try {
    const fetchNftDetails = await NftModel.findOne({
      tokenId: +order['tokenId'],
    });

    const fetchUser = await UserModal.findOne({
      walletAddress: result['buyer'].toLowerCase(),
    });

    const fetchSeller = await UserModal.findOne({
      walletAddress: order['seller'].toLowerCase(),
    });

    if (fetchNftDetails && fetchUser) {
      // check any bid is placed or not
      const checkBidAlreadyPlaced = await BidModel.findOne({
        nftId: fetchNftDetails._id,
        editionNo: result['editionNumber'],
      });

      //   if bid is already placed send notification to previous user that bid is cancelled
      if (checkBidAlreadyPlaced) {
        //   check notification already added otr not
        const checkNotificationAdded = await NotificationModel.findOne({
          userId: checkBidAlreadyPlaced.userId,
          bidId: checkBidAlreadyPlaced._id,
        });

        // if not add the notification
        if (!checkNotificationAdded) {
          const addNewNotification = new NotificationModel({
            text: {
              en: `Your Bid for ${fetchNftDetails.title} for edition No ${result['editionNumber']} is overbid`,
              tu: `${fetchNftDetails.title} eserinin ${result['editionNumber']} numaralı edisyonu için verdiğiniz teklif bir başka kullanıcı tarafından yükseltildi.`,
            },
            userId: checkBidAlreadyPlaced.userId,
            bidId: checkBidAlreadyPlaced._id,
            route: `/nftDetails/${fetchNftDetails._id}`,
          });

          if (+order['saleType'] === 3) {
            const notifySeller = new NotificationModel({
              text: {
                en: `A new Offer is received for ${fetchNftDetails.title}.Please go to your related NFT page to take action`,
                tu: `${fetchNftDetails.title} için yeni bir teklif aldınız. İşleme devam etmek için ilgili NFT sayfasına gidebilirsiniz.`,
              },
              userId: fetchSeller._id,
              route: `/nftDetails/${fetchNftDetails._id}`,
            });

            await notifySeller.save();
          }

          await addNewNotification.save();

          checkBidAlreadyPlaced.userId = fetchUser._id;
          checkBidAlreadyPlaced.saleType = +order['saleType'];
          checkBidAlreadyPlaced.timeline = +order['timeline']
            ? +order['timeline']
            : 0;

          await checkBidAlreadyPlaced.save();
        } else {
          checkBidAlreadyPlaced.userId = fetchUser._id;
          checkBidAlreadyPlaced.saleType = +order['saleType'];
          checkBidAlreadyPlaced.timeline = +order['timeline']
            ? +order['timeline']
            : 0;
          await checkBidAlreadyPlaced.save();
        }
      } else {
        //   add the new bid
        const addNewBid = new BidModel({
          userId: fetchUser._id,
          nftId: fetchNftDetails._id,
          editionNo: +result['editionNumber'],
          saleType: +order['saleType'],
          timeline: +order['timeline'] ? +order['timeline'] : 0,
        });
        await addNewBid.save();

        if (+order['saleType'] === 3) {
          const notifySeller = new NotificationModel({
            text: {
              en: `A new Offer is received for ${fetchNftDetails.title}.Please go to your related NFT page to take action.`,
              tu: `${fetchNftDetails.title} için yeni bir teklif aldınız. İşleme devam etmek için ilgili NFT sayfasına gidebilirsiniz.`,
            },
            userId: fetchSeller._id,
            route: `/nftDetails/${fetchNftDetails._id}`,
          });

          await notifySeller.save();
        }
      }
    }
  } catch (err) {
    Utils.echoLog(`Error in bid placed event ${err}`);
  }
};

// check bid ended
bidPlaced.checkBidEnded = async () => {
  try {
    var unix = Math.round(+new Date() / 1000);

    const fetchRecords = await BidModel.find({
      saleType: 1,
      timeline: { $lte: unix, $ne: 0 },
      isNotificationSent: false,
    });

    if (fetchRecords.length) {
      for (let i = 0; i < fetchRecords.length; i++) {
        const fetchNftDetails = await NftModel.findOne({
          _id: fetchRecords[i].nftId,
        });

        const fetchUser = await UserModal.findOne({
          _id: fetchRecords[i].userId,
        });

        const notifyBuyer = new NotificationModel({
          text: {
            en: `You won the bid for ${fetchNftDetails.title}.Please go & claim your NFT from the related NFT page.`,
            tu: `${fetchNftDetails.title} için müzayedeyi kazandınız! Lütfen ilgili NFT sayfasına giderek alım işleminizi sonlandırın.`,
          },
          userId: fetchRecords[i].userId,
          route: `/nftDetails/${fetchRecords[i].nftId}`,
        });

        // check edition added
        const checkEditionAlreadyAdded = await EditionModel.findOne({
          nftId: fetchNftDetails._id,
          edition: +fetchRecords[i].editionNo,
        });

        if (!checkEditionAlreadyAdded) {
          const addNewEdition = new EditionModel({
            nftId: fetchNftDetails._id,
            ownerId: fetchRecords[i].userId,
            edition: fetchRecords[i].editionNo,
            transactionId: '0x',
            price: 0,
            walletAddress: fetchUser.walletAddress,
            saleAction: 'AUCTION',
            nonce: null,
            isOpenForSale: false,
            timeline: 0,
          });
          await addNewEdition.save();
        }
        await notifyBuyer.save();

        const updateBidstatus = await BidModel.findOneAndUpdate(
          { _id: fetchRecords[i]._id },
          { isNotificationSent: true }
        );
      }
    }
  } catch (err) {
    console.log('error is :', err);
    Utils.echoLog(`Error in checkBidEnded  ${err}`);
  }
};

module.exports = bidPlaced;
