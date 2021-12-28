const mongoose = require('mongoose');
const Utils = require('../helper/utils');
mongoose.Promise = require('bluebird');
const mongoUrl = `mongodb+srv://minddeft-user:9e*p&uct@cluster-staging.mob9k.mongodb.net/fananywhere`;


mongoose
  .connect(
    `mongodb://${process.env.DATABASEURL}:${process.env.DATABSEPORT}/${process.env.DATABASE}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: true,
      useCreateIndex: true,
      useFindAndModify: false,
    })
  .then((res) => {
    // mongoose.pluralize(null);
    // mongoose.set('debug', true);

    mongoose.set('useFindAndModify', false);

    console.log('database connected successfully');
  })
  .catch((error) => {
    Utils.echoLog('error in connecting with database ', error);
    console.log('error in connecting with database ', error);
  });
