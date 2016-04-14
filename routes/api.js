var express = require('express')
  , router = express.Router()
  , Contact = require('../models/contact');

var isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/login');
};

router.get('/contacts', isAuthenticated, function(req, res) {
  Contact.find(function(err, contacts) {
    console.log(contacts);
    res.render(
      'api',
      { title : 'Contacts', contacts : contacts }
    );
  });
});

router.get('/contacts/:id', isAuthenticated, function(req, res) {
  var query = { "_id" : req.params.id };
  Contact.findOne(query, function(err, contact) {
    console.log(contact);
    res.render(
      'contact',
      { contact : contact }
    );
  });
});

router.post('/contacts', isAuthenticated, function(req, res) {
  new Contact({ name : req.body.name })
    .save(function(err, contact) {
      console.log(contact);
      res.redirect('/api/contacts');
    });
});

module.exports = router;
