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

router.post('/contacts', isAuthenticated, function(req, res) {
  new Contact({ name : req.body.name })
    .save(function(err, contact) {
      console.log(contact);
      res.redirect('/api/contacts');
    });
});

module.exports = router;
