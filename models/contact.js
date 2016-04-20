var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

var Contact = new Schema({
  name: String,
  account: { type: Schema.ObjectId, ref: 'Account' },
  interactions: [{
    description: { type: String, default: '' },
    account: { type: Schema.ObjectId, ref: 'Account' },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

Contact.methods = {
  addInteraction: function (account, interaction) {
    this.interactions.push({
      description: interaction.description,
      account: account
    });

    return this.save();
  }
};

module.exports = mongoose.model('Contact', Contact);