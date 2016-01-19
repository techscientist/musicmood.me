// 3rd party
var express = require('express');
var hbs = require('hbs');
var tools = require('./lib/tools');
var LastfmAPI = require('lastfmapi');
var LastFmNode = require('lastfm').LastFmNode;
var url = require('url');

var app = express();

// set the view engine to use handlebars
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));

var blocks = {};

hbs.registerHelper('extend', function(name, context) {
    var block = blocks[name];
    if (!block) {
        block = blocks[name] = [];
    }
    block.push(context.fn(this));
});

hbs.registerHelper('block', function(name) {
    var val = (blocks[name] || []).join('\n');
    blocks[name] = [];
    return val;
});

var lfm = new LastfmAPI({
    'api_key': tools.LASTFM_API_KEY,
    'secret': tools.LASTFM_API_SEC
});

var lastfm = new LastFmNode({
  api_key: tools.LASTFM_API_KEY,
  secret: tools.LASTFM_API_SEC
});

app.get('/', function(req, res) {
    var authUrl = lfm.getAuthenticationUrl({
        'cb': 'http://dev.d3.do:3000/auth'
    });
    res.locals = {
        title: 'Login Last.FM',
        url: authUrl
    }
    res.render('index');
});

app.get('/auth', function(req, res) {
    token = url.parse(req.url, true).query.token;
    var session = lastfm.session({
        token: token,
        handlers: {
            success: function(session) {
                console.log(session);
            },
            error: function(err){
                console.log(err);
            }
        }
    });
    res.render('auth');
});

app.listen(3000);
