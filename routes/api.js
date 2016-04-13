var express = require('express')
  , router = express.Router()
  , Contact = require('../models/contact');

// TODO: Authenticate

router.get('/contacts', function(req, res) {
  Contact.find(function(err, contacts) {
    console.log(contacts);
    res.render(
      'api',
      { title : 'Contacts', contacts : contacts }
    );
  });
});

router.post('/contacts', function(req, res) {
  new Contact({ name : req.body.name })
    .save(function(err, contact) {
      console.log(contact);
      res.redirect('/api/contacts');
    });
});

module.exports = router;
