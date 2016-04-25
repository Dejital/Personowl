var express = require('express')
  , path = require('path')
  , logger = require('morgan')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('body-parser')
  , mongoose = require('mongoose')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , routes = require('./routes/index')
  , api = require('./routes/api')
  , methodOverride = require('method-override')
  , moment = require('moment');

var app = express();

app.set('views', path.join(__dirname, 'source/templates'));
app.set('view engine', 'jade');

app.use(methodOverride('_method'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('express-session')({
  secret: 'sebastian',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, '/static')));

app.use('/', routes);
app.use('/api', api);

app.locals.moment = moment;

var Account = require('./models/account');
passport.use(new LocalStrategy(Account.authenticate()));
passport.serializeUser(Account.serializeUser());
passport.deserializeUser(Account.deserializeUser());

var connectionString = process.env.CUSTOMCONNSTR_MONGOLAB_URI || 'mongodb://localhost/personowl';
mongoose.connect(connectionString);

module.exports = app;
