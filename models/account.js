var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
  username: String,
  password: String,
  thresholdDays: { type: Number, default: 14 },
  snoozeDays: { type: Number, default: 7 }
});

Account.plugin(passportLocalMongoose);

module.exports = mongoose.model('Account', Account);