// 3rd party
var express = require('express');
var hbs = require('hbs');
var tools = require('./lib/tools');
var LastfmAPI = require('lastfmapi');
var LastFmNode = require('lastfm').LastFmNode;
var url = require('url');
var mongo = require('mongodb').MongoClient;
var bodyParser = require('body-parser');

var app = express();

app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({
    extended: true
}));

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

var url_mongo = 'mongodb://localhost:27017/spotify-visualizer';

app.get('/', (req, res) => {
    var authUrl = lfm.getAuthenticationUrl({
        'cb': req.protocol + '://' + req.get('host') + req.originalUrl
    });
    res.locals = {
        title: 'Login Last.FM',
        url: authUrl
    }
    res.render('index');
});

app.get('/admin', (req, res) => {
    mongo.connect(url_mongo, (err, db) => {
        if (!err) {
            var find = db.collection('users').find({}).toArray((err, items) => {
                if (!err) {
                    res.locals = {
                        title: 'Update User Fields Last.FM',
                        users: items
                    }
                    res.render('admin');
                } else {
                    console.log(err);
                }
            })
        } else {
            res.locals = {
                title: 'Update User Fields Last.FM',
                users: [{
                    name: 'Not found',
                    username: 'No one',
                    mac_address: 'Nowhere'
                }]
            }
            res.render('admin');
        }
    });
});

app.post('/update', (req, res) => {
    var name = req.body.name;
    var mac_address = req.body.mac_address;
    var username = req.body.username;

    tools.updateUserInfo({
        "username": username
    }, {
        "name": name,
        "mac_address": mac_address
    }).then((results) => {
        res.redirect('/admin')
    }).catch((err) => {
        console.log(err);
        res.redirect('/admin')
    });
});

app.get('/auth', (req, res) => {
    token = url.parse(req.url, true).query.token;
    var session = lastfm.session({
        token: token,
        handlers: {
            success: (session) => {
                tools.newUser(session)
                    .then((result) => {
                        console.log(result);
                    }).catch((err) => {
                        console.log(err);
                    });
            },
            error: (err) => {
                console.log(err);
            }
        }
    });
    res.redirect('/');
});

app.listen(3000);
