var express = require('express')
  , passport = require('passport')
  , Account = require('../models/account')
  , router = express.Router();

router.get('/', function (req, res) {
  res.render('homepage', { user : req.user });
});

router.get('/register', function (req, res) {
  res.render('register', { });
});

router.post('/register', function (req, res) {
  Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
    if (err) {
      return res.render('register', { info: err.message });
    }

    passport.authenticate('local')(req, res, function () {
      req.session.save(function (err) {
        if (err) {
          return next(err);
        }
        res.redirect('/');
      });
    });
  });
});

router.get('/login', function (req, res) {
  res.render('login', { user : req.user, info : req.flash('error') });
});

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true
  }), function (req, res, next) {
  req.session.save(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  })
});

router.get('/logout', function (req, res) {
  req.logout();
  req.session.save(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

module.exports = router;