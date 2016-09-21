var express = require('express')
  , router = express.Router()
  , Account = require('../models/account')
  , Contact = require('../models/contact');

var isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/login');
};

router.get('/preferences', isAuthenticated, function(req, res) {
  var query = { "_id" : req.user._id };
  var fields = 'thresholdDays snoozeDays';
  Account.findOne(query, fields, function(err, preferences) {
    res.status(200)
      .json({
        status: 'success',
        preferences: preferences,
        message: 'Retrieved preferences'
      });
  });
});

router.put('/preferences', isAuthenticated, function(req, res) {
  var query = { "_id" : req.user._id };
  var update = {};
  if (req.body.thresholdDays) {
    update.thresholdDays = req.body.thresholdDays;
  }
  if (req.body.snoozeDays) {
    update.snoozeDays = req.body.snoozeDays;
  }
  var options = {
    new: true,
    fields: 'thresholdDays snoozeDays'
  };
  Account.findOneAndUpdate(query, update, options, function(err, preferences){
    res.status(200)
      .json({
        status: 'success',
        preferences: preferences,
        message: 'Updated preferences'
      });
  });
});

router.get('/contacts', isAuthenticated, function(req, res) {
  var query = { "account" : req.user._id };
  var fields = 'name tags lastContactAt snoozedUntil createdAt';
  Contact.find(query, fields, function(err, contacts) {
    var now = new Date();
    contacts.forEach(function (contact) {
      if (contact.snoozedUntil < now){
        contact.snoozedUntil = '';
      }
    });
    res.status(200)
      .json({
        status: 'success',
        contacts: contacts,
        message: 'Retrieved ALL contacts'
      });
  });
});

router.get('/contacts/:id', isAuthenticated, function(req, res) {
  var query = { "_id" : req.params.id };
  Contact.findOne(query, function(err, contact) {
    res.status(200)
      .json({
        status: 'success',
        contact: contact,
        message: 'Retrieved ONE contact'
      });
  });
});

router.post('/contacts', isAuthenticated, function(req, res) {
  var newContact = { name: req.body.name, account: req.user._id };
  new Contact(newContact)
    .save(function(err, contact) {
      res.status(200)
        .json({
          status: 'success',
          contact: contact,
          message: 'Created a contact'
        });
    });
});

router.put('/contacts/:id', isAuthenticated, function(req, res) {
  var query = { "_id" : req.params.id };
  var update = { name : req.body.name };
  if (!req.body.tags) {
    update.tags = [];
  } else if (Array.isArray(req.body.tags)) {
    update.tags = req.body.tags;
  } else {
    update.tags = req.body.tags.match( /(?=\S)[^,]+?(?=\s*(,|$))/g );
  }
  var now = new Date();
  var snoozedUntil = req.body.snoozedUntil;
  if (snoozedUntil && snoozedUntil < now){
    snoozedUntil = '';
  }
  update.snoozedUntil = snoozedUntil;
  var options = { new: true };
  Contact.findOneAndUpdate(query, update, options, function(err, contact){
    res.status(200)
      .json({
        status: 'success',
        contact: contact,
        message: 'Updated a contact'
      });
  });
});

router.delete('/contacts/:id', isAuthenticated, function(req, res) {
  var query = { "_id" : req.params.id };
  Contact.findOneAndRemove(query, function(){
    res.status(200)
      .json({
        status: 'success',
        message: 'Deleted a contact'
      });
  });
});

router.post('/contacts/:id/interactions', isAuthenticated, function(req, res) {
  var today = Date.now();
  var options = { new: true };
  Contact.findByIdAndUpdate(req.params.id, {
    $push: {
      interactions: { description: req.body.interaction, account: req.user._id }
    }, lastContactAt: today
  }, options, function(err, contact){
    res.status(200)
      .json({
        status: 'success',
        interactions: contact.interactions,
        message: 'Added a new interaction'
      });
  });
});

router.delete('/contacts/:id/interactions/:interactionId', isAuthenticated, function(req, res) {
  var options = { new: true };
  Contact.findByIdAndUpdate(req.params.id, {
    $pull: {
      interactions: { _id: req.params.interactionId }
    }
  }, options, function(err, contact){
    res.status(200)
      .json({
        status: 'success',
        interactions: contact.interactions,
        message: 'Deleted an interaction'
      });
  });
});

router.post('/contacts/:id/notes', isAuthenticated, function(req, res) {
  var options = { new: true };
  Contact.findByIdAndUpdate(req.params.id, {
    $push: {
      notes: { body: req.body.note, account: req.user._id }
    }
  }, options, function(err, contact){
    res.status(200)
      .json({
        status: 'success',
        notes: contact.notes,
        message: 'Added a new note'
      });
  });
});

router.delete('/contacts/:id/notes/:noteId', isAuthenticated, function(req, res) {
  var options = { new: true };
  Contact.findByIdAndUpdate(req.params.id, {
    $pull: {
      notes: { _id: req.params.noteId }
    }
  }, options, function(err, contact){
    res.status(200)
      .json({
        status: 'success',
        notes: contact.notes,
        message: 'Deleted a note'
      });
  });
});

module.exports = router;
