var express = require('express')
  , path = require('path')
  , logger = require('morgan')
  , app = express()
  , mongoose = require('mongoose')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , routes = require('./routes/index');

app.set('views', path.join(__dirname, 'source/templates'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/static'));

app.use('/', routes);

var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

mongoose.connect('mongodb://localhost/personowl');

module.exports = app;
