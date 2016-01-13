// import `da` libs
var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    methodOverride = require('method-override'),
    session = require('express-session'),
    passport = require('passport'),
    swig = require('swig'),
    SpotifyStrategy = require('passport-spotify').Strategy;

var mongo = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/spotify-visualizer';

// template engine
var consolidate = require('consolidate');

// keys for spotify
var appKey = '9608b736119a4b69bfb4a94790ecc7ae';
var appSecret = '2c0b6839de7c4bbb90066b837b90c8de';

// setup Passport
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

// use the spotify passport library
passport.use(new SpotifyStrategy({
    clientID: appKey,
    clientSecret: appSecret,
    callbackURL: 'http://dev.d3.do:8888/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    // asynchronous verification, for effect...
    var user = JSON.parse(profile._raw);

    mongo.connect(url, function(err, db) {
      if ( !err ){
        var find = db.collection('users')
          .find({email:'jotadev@me.com'})
          .count()
          .then(function(c){
            if (c > 0){
              console.log('user exists');
              console.log(user);
            }else{
              db.collection('users').insertOne(
                {
                  token: accessToken,
                  refreshToken: refreshToken,
                  name: user.display_name,
                  email: user.email,
                  id: user.id,
                  country: user.country
                },
                function(err, r){
                  console.log(err);
                  console.log(r);
                }
              )
            }
          })
          .catch(function(err){

          });
      }else{
        console.log(err);
      }
    });

    //console.log(user);
    process.nextTick(function () {
      // get the user data and send somewhere
      return done(null, profile);
    });
  }));

// start the server engine using passport and express
var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser());
app.use(methodOverride());
app.use(session({ secret: 'a75s4f7a6s5d4f7a6s5d4fa76sd5f4a7s6d54fa76sd5f4' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));
app.engine('html', consolidate.swig);

// home route
app.get('/', function(req, res){
  res.render('index.html', { user: req.user });
});

// my account route
app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account.html', { user: req.user });
});

// login route
app.get('/login', function(req, res){
  res.render('login.html', { user: req.user });
});

// redirect the user to authenticate on spitify
app.get('/auth/spotify',
  passport.authenticate('spotify', {scope: ['playlist-read-private', 'playlist-read-collaborative', 'playlist-modify-public', 'playlist-modify-private', 'streaming', 'user-follow-modify', 'user-follow-read', 'user-library-read', 'user-library-modify', 'user-read-private', 'user-read-birthdate', 'user-read-email'], showDialog: true}),
  function(req, res){}
);

// callback route for spotify redirect
app.get('/callback',
  passport.authenticate('spotify', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

// logout route
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

// run app on port 8888
app.listen(8888);

// ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}
