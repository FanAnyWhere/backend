const UserModel = require('./userModal');
const RoleModel = require('../roles/rolesModal');
const Utils = require('../../helper/utils');
const jwtUtil = require('../../helper/jwtUtils');
const NotificationModel = require('../notification/notificationModel');
const crypto = require('crypto');
const { statusObject } = require('../../helper/enum');
const Web3 = require('web3');
const asyncRedis = require('async-redis');
const FollowModel = require('../follow/followModel');
const axios = require('axios');
var OAuth = require('oauth');
const qs = require('qs');
const client = asyncRedis.createClient();

const UserCtr = {};

function consumer() {
  return new OAuth.OAuth(
    'https://twitter.com/oauth/request_token',
    'https://twitter.com/oauth/access_token',
    process.env.TWITTER_CONSUMER,
    process.env.TWITTER_CONSUMER_SECRET,
    '1.0A',
    'https://avangrat.52.28.101.213.nip.io/user/edit-profile/',
    'HMAC-SHA1'
  );
}

// update user details
UserCtr.updateUserDetails = async (req, res) => {
  try {
    const {
      name,
      email,
      username,
      portfolio,
      profile,
      cover,
      isCreator,
      bio,
      category,
    } = req.body;

    const fetchUserDetails = await UserModel.findById(req.userData._id);

    if (fetchUserDetails) {
      if (name) {
        fetchUserDetails.name = name;
      }
      if (cover) {
        fetchUserDetails.cover = cover;
      }
      if (bio) {
        fetchUserDetails.bio = bio;
      }
      if (email) {
        fetchUserDetails.email = email;
      }
      if (portfolio && Object.keys(portfolio).length) {
        fetchUserDetails.portfolio = portfolio;
      }
      if (profile) {
        fetchUserDetails.profile = profile;
      }
      if (username) {
        fetchUserDetails.username = username;
      }
      if (isCreator) {
        const fetchRole = await RoleModel.findOne({ roleName: 'CELEBRITY' });
        fetchUserDetails.role = fetchRole._id;
      }
      if (category && category.length) {
        fetchUserDetails.category = category;
      }

      const saveUser = await fetchUserDetails.save();
      return res.status(200).json({
        message: req.t('USER_UPDATED_SUCCESSFULLY'),
        status: true,
        data: {
          details: {
            name: saveUser.name,
            surname: saveUser.surname,
            status: saveUser.status,
            profile: saveUser.profile,
            portfolio: saveUser.portfolio,
            email: saveUser.email,
            bio: saveUser.bio,
          },
        },
      });
    }
  } catch (err) {
    Utils.echoLog('error in creating user ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// get all active roles
UserCtr.getAllRoles = async (req, res) => {
  try {
    const getRoles = await RoleModel.find({ isActive: true });

    return res.status(200).json({
      message: req.t('ROLES'),
      status: true,
      data: getRoles,
    });
  } catch (err) {
    Utils.echoLog('error in gettting  user roles ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};
// login initally
UserCtr.login = async (req, res) => {
  try {
    const { nonce, signature } = req.body;
    const web3 = new Web3(
      new Web3.providers.HttpProvider('https://bsc-dataseed.binance.org/')
    );

    const signer = await web3.eth.accounts.recover(nonce, signature);

    if (signer) {
      const fetchRedisData = await client.get(nonce);

      if (fetchRedisData) {
        const parsedRedisData = JSON.parse(fetchRedisData);

        const checkAddressMatched =
          parsedRedisData.walletAddress.toLowerCase() === signer.toLowerCase();

        if (checkAddressMatched) {
          const checkAddressAvalaible = await UserModel.findOne(
            {
              walletAddress: signer.toLowerCase().trim(),
            },
            { acceptedByAdmin: 0, stage: 0 }
          ).populate({
            path: 'role',
            select: { _id: 1, roleName: 1 },
          });

          if (checkAddressAvalaible) {
            // create the token and sent i tin response
            const token = jwtUtil.getAuthToken({
              _id: checkAddressAvalaible._id,
              role: checkAddressAvalaible.role,
              walletAddress: checkAddressAvalaible.walletAddress,
            });

            return res.status(200).json({
              message: req.t('SUCCESS'),
              status: true,
              data: {
                token,
                details: checkAddressAvalaible,
              },
            });
          } else {
            const getRoles = await RoleModel.findOne({ roleName: 'COLLECTOR' });
            const createUser = new UserModel({
              role: getRoles._id,
              walletAddress: parsedRedisData.walletAddress.toLowerCase(),
            });

            const saveUser = await createUser.save();

            const token = jwtUtil.getAuthToken({
              _id: saveUser._id,
              role: saveUser.role,
              walletAddress: saveUser.walletAddress,
            });

            return res.status(200).json({
              message: req.t('SUCCESS'),
              status: true,
              data: {
                token,
                details: {
                  name: saveUser.name,
                  surname: saveUser.surname,
                  status: saveUser.status,
                  profile: saveUser.profile,
                  portfolio: saveUser.portfolio,
                  role: {
                    roleName: 'COLLECTOR',
                    _id: saveUser.role,
                  },
                },
              },
            });
          }
        } else {
          // invalid address
          return res.status(400).json({
            message: req.t('INVALID_CALL'),
            status: false,
          });
        }
      } else {
        // redis data not avalible login again
        return res.status(400).json({
          message: req.t('LOGIN_AGAIN'),
          status: false,
        });
      }
    } else {
      // inavlid signature
      return res.status(400).json({
        message: req.t('INVALID_SIGNATURE'),
        status: false,
      });
    }
  } catch (err) {
    // console.log('err in signup :', err);
    Utils.echoLog('error in singnup  ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// list all users for admin
UserCtr.list = async (req, res) => {
  try {
    const page = req.query.page || 1;
    const query = {};

    if (req.query.roleId) {
      query.role = req.query.roleId;
    }
    if (req.query.status) {
      query.status = req.query.status.toUpperCase();
    }

    if (req.query.pagination === 'false') {
      const listAll = await UserModel.find(query).populate({
        path: 'role',
        select: { _id: 1, roleName: 1 },
      });

      return res.status(200).json({
        message: req.t('SUCCESS'),
        status: true,
        data: listAll,
      });
    }

    const totalCount = await UserModel.countDocuments(query);
    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);

    const list = await UserModel.find(query)
      .populate({
        path: 'role',
        select: { _id: 1, roleName: 1 },
      })
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .limit(+process.env.LIMIT);

    return res.status(200).json({
      message: req.t('SUCCESS'),
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
    Utils.echoLog('error in listing user   ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// get user details
UserCtr.getUserDetails = async (req, res) => {
  try {
    const query = {};
    if (req.query.userId && req.role == 'ADMIN') {
      query._id = req.query.userId;
    } else {
      if (req.userData && req.userData._id && req.role !== 'ADMIN') {
        query._id = req.userData._id;
      }
    }

    if (Object.keys(query).length) {
      const fetchUserData = await UserModel.findOne(query)
        .populate({
          path: 'role',
          select: { _id: 1, roleName: 1 },
        })
        .populate({
          path: 'category',
          select: { _id: 1, isActive: 1, image: 1, categoryName: 1 },
        });

      return res.status(200).json({
        message: req.t('SUCCESS'),
        status: true,
        data: fetchUserData,
      });
    } else {
      return res.status(400).json({
        message: req.t('INVALID_DETAILS'),
        status: false,
      });
    }
  } catch (err) {
    Utils.echoLog('error in listing user   ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// approve user as a creator
UserCtr.approveAsCreator = async (req, res) => {
  try {
    const { user } = req.body;
    if (user.length) {
      for (let i = 0; i < user.length; i++) {
        const getUserDetails = await UserModel.findById(user[i].id);
        if (getUserDetails) {
          const getRoleDetails = await RoleModel.findOne({
            roleName: 'CELEBRITY',
          });

          const stage = {
            approved: user[i].status ? +new Date() : null,
            rejected: !user[i].status ? +new Date() : null,
          };

          if (user[i].status) {
            getUserDetails.acceptedByAdmin = true;
            getUserDetails.role = getRoleDetails._id;
            getUserDetails.status = statusObject.APPROVED;
            getUserDetails.stage = stage;
            getUserDetails.transactionId = req.body.transactionId;
          } else {
            getUserDetails.acceptedByAdmin = false;
            getUserDetails.status = statusObject.REJECTED;
            getUserDetails.stage = stage;
          }
          await getUserDetails.save();

          const addNewNotication = new NotificationModel({
            text: {
              en: user[i].status
                ? req.t('REQUEST_ACCEPTED')
                : req.t('REQUSET_REJECTED'),
              tu: user[i].status
                ? req.t('REQUEST_ACCEPTED_TR')
                : req.t('REQUSET_REJECTED_TR'),
            },
            userId: getUserDetails,
            notification_type: 'user_as_creator'
          });

          addNewNotication.save();
        } else {
          next();
        }
      }

      return res.status(200).json({
        message: req.t('USER_STATUS_UPDATED'),
        status: true,
      });
    } else {
      return res.status(200).json({
        message: req.t('USER_STATUS_UPDATED'),
        status: true,
      });
    }
  } catch (err) {
    Utils.echoLog('error in approving  user   ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// disable user for using platform
UserCtr.disableUser = async (req, res) => {
  try {
    const getUserDetails = await UserModel.findById(req.body.id);
    if (getUserDetails) {
      UserModel.isActive = req.body.status;

      await getUserDetails.save();
      return res.status(200).json({
        message: req.t('USER_DISABLED_SUCCESSFULLY'),
        status: true,
      });
    } else {
      return res.status(400).json({
        message: req.t('INVALID_USER_DETAILS'),
        status: false,
      });
    }
  } catch (err) {
    Utils.echoLog('error in disabling user ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// add user as creator by admin
UserCtr.addUserByAdmin = async (req, res) => {
  try {
    const { walletAddress, name, profile, bio, email, category, username } =
      req.body;
    const fetchRole = await RoleModel.findOne({ roleName: 'CELEBRITY' });

    const addNewUser = new UserModel({
      name: name,
      walletAddress: walletAddress,
      profile: profile ? profile : null,
      bio: bio ? bio : null,
      email: email ? email : null,
      role: fetchRole._id,
      category: category,
      username: username,
    });

    const saveUser = await addNewUser.save();

    return res.status(200).json({
      message: req.t('USER_REGISTERED_SUCCESSFULLY'),
      status: true,
      data: {
        _id: saveUser._id,
        name: saveUser.name,
        walletAddress: saveUser.walletAddress,
      },
    });
  } catch (err) {
    Utils.echoLog('error in adding new user  by admin ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// genrate a nonce
UserCtr.genrateNonce = async (req, res) => {
  try {
    let nonce = crypto.randomBytes(16).toString('hex');

    if (
      req.params.address.toLowerCase() ===
      process.env.ADMIN_WALLET_ADDRESS.toLowerCase()
    ) {
      return res.status(400).json({
        message: req.t('ADMIN_WALLET'),
        status: false,
      });
    }
    const data = {
      walletAddress: req.params.address,
      nonce: nonce,
    };

    await client.set(nonce, JSON.stringify(data), 'EX', 60 * 10);

    return res.status(200).json({
      message: req.t('NONCE_GENRATED'),
      status: true,
      data: {
        nonce: nonce,
      },
    });
  } catch (err) {
    Utils.echoLog('error in genrating nonce  ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// seacrh creator
UserCtr.searchCreator = async (req, res) => {
  try {
    const fetchCreatorRoleId = await RoleModel.findOne({ roleName: 'CELEBRITY' });
    const findUsers = await UserModel.find(
      {
        isActive: 1,
        // role: fetchCreatorRoleId._id,
        username: { $regex: `${req.params.name.toLowerCase()}.*` },
        // acceptedByAdmin: true,
      },
      { _id: 1, username: 1, walletAddress: 1 }
    );

    return res.status(200).json({
      message: 'Creator List',
      status: true,
      data: findUsers,
    });
  } catch (err) {
    Utils.echoLog('Erro in searchng creator');
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// list creator for front
UserCtr.listActiveCreator = async (req, res) => {
  try {
    const page = req.body.page || 1;
    let sort = { createdAt: -1 };
    const fetchCreatorRole = await RoleModel.findOne({ roleName: 'CELEBRITY' });
    const query = {
      role: fetchCreatorRole._id,
      acceptedByAdmin: true,
      isActive: true,
    };

    if (req.body.category && req.body.category.length) {
      query.category = { $in: req.body.category };
    }

    if (req.body.search) {
      query.username = { $regex: `${req.body.search.toLowerCase()}.*` };
    }

    if (req.body.rank) {
      if (req.body.rank.toLowerCase() === 'name') {
        sort = {};
        sort['username'] = 1;
      }
      if (req.body.rank.toLowerCase() === 'follower') {
        sort = {};
        sort['followersCount'] = -1;
      }
    }

    const totalCount = await UserModel.countDocuments(query);
    const pageCount = Math.ceil(totalCount / +process.env.LIMIT);

    const fetchAllCreator = await UserModel.find(
      query,
      {
        portfolio: 0,
        acceptedByAdmin: 0,
        status: 0,
        stage: 0,
        transactionId: 0,
      },
      {
        sort: sort,
      }
    )
      .skip((+page - 1 || 0) * +process.env.LIMIT)
      .limit(+process.env.LIMIT);

    return res.status(200).json({
      message: 'CREATOR_LIST',
      status: true,
      data: fetchAllCreator,
      pagination: {
        pageNo: page,
        totalRecords: totalCount,
        totalPages: pageCount,
        limit: +process.env.LIMIT,
      },
    });
  } catch (err) {
    Utils.echoLog('Erro in searchng creator');
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// get user details
UserCtr.getSingleUserDetails = async (req, res) => {
  try {
    const getUserDetails = JSON.parse(
      JSON.stringify(
        await UserModel.findOne(
          { _id: req.params.userId },
          { stage: 0, transactionId: 0, status: 0 }
        )
          .populate({
            path: 'category',
            select: { _id: 1, categoryName: 1, image: 1 },
          })
          .populate({
            path: 'role',
            select: { _id: 1, roleName: 1 },
          })
      )
    );

    if (req.userData && req.userData._id) {
      const checkIsFollowed = await FollowModel.findOne({
        userId: req.params.userId,
        follow: req.userData._id,
      });

      if (checkIsFollowed) {
        getUserDetails.isFollowed = true;
      } else {
        getUserDetails.isFollowed = false;
      }
    } else {
      getUserDetails.isFollowed = false;
    }

    return res.status(200).json({
      message: 'SINGLE_USER_DETAILS',
      status: true,
      data: getUserDetails,
    });
  } catch (err) {
    Utils.echoLog('Erro in getUserDetails creator');
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// update user by admin
UserCtr.updateUserDetailsByAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      username,
      portfolio,
      profile,
      cover,
      isCreator,
      bio,
      category,
    } = req.body;

    const fetchUserDetails = await UserModel.findById(req.params.userId);

    if (fetchUserDetails) {
      if (name) {
        fetchUserDetails.name = name;
      }
      if (cover) {
        fetchUserDetails.cover = cover;
      }
      if (bio) {
        fetchUserDetails.bio = bio;
      }
      if (email) {
        fetchUserDetails.email = email;
      }
      if (portfolio && Object.keys(portfolio).length) {
        fetchUserDetails.portfolio = portfolio;
      }
      if (profile) {
        fetchUserDetails.profile = profile;
      }
      if (username) {
        fetchUserDetails.username = username;
      }
      if (isCreator) {
        const fetchRole = await RoleModel.findOne({ roleName: 'CELEBRITY' });
        fetchUserDetails.role = fetchRole._id;
      }
      if (category && category.length) {
        fetchUserDetails.category = category;
      }

      const saveUser = await fetchUserDetails.save();
      return res.status(200).json({
        message: req.t('USER_UPDATED_SUCCESSFULLY'),
        status: true,
        data: {
          details: {
            name: saveUser.name,
            surname: saveUser.surname,
            status: saveUser.status,
            profile: saveUser.profile,
            portfolio: saveUser.portfolio,
            email: saveUser.email,
            bio: saveUser.bio,
          },
        },
      });
    }
  } catch (err) {
    Utils.echoLog('error in creating user ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: true,
      err: err.message ? err.message : err,
    });
  }
};

// verify user intagram account
UserCtr.verifyInstagramAccount = async (req, res) => {
  try {
    const code = req.body.code;
    const fetchUserDetails = await UserModel.findOne({ _id: req.userData._id });

    if (fetchUserDetails) {
      var data = qs.stringify({
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri:
          'https://avangrat.52.28.101.213.nip.io/user/edit-profile/',
        code: code,
      });
      var config = {
        method: 'post',
        url: 'https://api.instagram.com/oauth/access_token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: data,
      };

      const getAccessToken = await axios(config);

      if (getAccessToken.status === 200) {
        const tokenData = getAccessToken.data;

        const configUser = {
          method: 'get',
          url: `https://graph.instagram.com/me?fields=id,username&access_token=${tokenData.access_token}`,
        };
        // get user data using access token
        const getData = await axios(configUser);

        if (getData.status === 200) {
          fetchUserDetails.portfolio.instagarm.username = getData.data.username;
          fetchUserDetails.portfolio.instagarm.isVerified = true;
          fetchUserDetails.portfolio.instagarm.url = `https://instagram.com/${getData.data.username}`;

          await fetchUserDetails.save();
          return res.status(200).json({
            message: req.t('INSTAGRAM_ACCOUNT_VERIFIED'),
            status: true,
          });
        }
      } else {
        return res.status(400).json({
          message: req.t('INAVLID_CODE'),
          status: false,
        });
      }
    } else {
      return res.status(400).json({
        message: req.t('DB_ERROR'),
        status: false,
      });
    }
  } catch (err) {
    Utils.echoLog('error in creating user ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// genrate access token
UserCtr.genrateAccessTokenForTwitter = async (req, res) => {
  try {
    consumer().getOAuthRequestToken(
      async (error, oauthToken, oauthTokenSecret, results) => {
        if (error) {
          return res.status(400).json({
            message: req.t('DB_ERROR'),
            status: false,
            err: error.message ? error.message : error,
          });
        } else {
          client.del(`twitter-${req.userData._id}`);

          const authToken = {
            token: oauthToken,
            secret: oauthTokenSecret,
          };

          await client.set(
            `twitter-${req.userData._id}`,
            JSON.stringify(authToken),
            'EX',
            60 * 100
          );

          return res.status(200).json({
            message: req.t('TWITTER_CODE'),
            status: true,
            data: {
              code: oauthToken,
              redirect_uri: `http://twitter.com/oauth/authorize?oauth_token=${oauthToken}`,
            },
          });
        }
      }
    );
  } catch (err) {
    Utils.echoLog('error in creating user ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

// verify twitter account
UserCtr.verifyTwitterAccount = async (req, res) => {
  try {
    const getTokenDetails = await client.get(`twitter-${req.userData._id}`);

    if (getTokenDetails) {
      const parsedData = JSON.parse(getTokenDetails);

      const oauth_token = req.body.oauth_token;
      const oauth_verifier = req.body.oauth_verifier;

      consumer().getOAuthAccessToken(
        oauth_token,
        null,
        oauth_verifier,
        async (
          error,
          oauth_access_token,
          oauth_access_token_secret,
          result
        ) => {
          if (error) {
          } else {
            const fetchUserDetails = await UserModel.findOne({
              _id: req.userData._id,
            });

            fetchUserDetails.portfolio.twitter.username = result.screen_name;
            fetchUserDetails.portfolio.twitter.isVerified = true;
            fetchUserDetails.portfolio.twitter.url = `https://twitter.com/${result.screen_name}`;

            await fetchUserDetails.save();
            return res.status(200).json({
              message: req.t('TWITTER_ACCOUNT_VERIFIED'),
              status: true,
            });
          }
        }
      );
    } else {
      return res.status(400).json({
        message: req.t('TWITTER_ERROR'),
        status: true,
      });
    }
  } catch (err) {
    Utils.echoLog('error in creating user ', err);
    return res.status(500).json({
      message: req.t('DB_ERROR'),
      status: false,
      err: err.message ? err.message : err,
    });
  }
};

module.exports = UserCtr;
