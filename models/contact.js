var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var Contact = new Schema({
  name: String,
  account: { type: Schema.ObjectId, ref: 'Account' },
  tags: [String],
  notes: [{
    body: { type: String, default: '' },
    account: { type: Schema.ObjectId, ref: 'Account' },
    createdAt: { type: Date, default: Date.now }
  }],
  interactions: [{
    description: { type: String, default: '' },
    account: { type: Schema.ObjectId, ref: 'Account' },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  lastContactAt: { type: Date }
});

module.exports = mongoose.model('Contact', Contact);