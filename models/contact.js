var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var Contact = new Schema({
  name: String
});

module.exports = mongoose.model('Contact', Contact);