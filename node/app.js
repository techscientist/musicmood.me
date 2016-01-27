// 3rd party
var express = require('express');
var hbs = require('hbs');
var tools = require('./lib/tools');
var LastfmAPI = require('lastfmapi');
var LastFmNode = require('lastfm').LastFmNode;
var url = require('url');
var mongo = require('mongodb').MongoClient;

var app = express();

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

var url_mongo = 'mongodb://localhost:27017/spotify-visualizer';

var authUrl = lfm.getAuthenticationUrl({
    'cb': 'http://dev.d3.do:3000/auth'
});

app.get('/', (req, res) => {
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

app.get('/auth', (req, res) => {
    token = url.parse(req.url, true).query.token;
    var session = lastfm.session({
        token: token,
        handlers: {
            success: (session) => {
                mongo.connect(url_mongo, (err, db) => {
                    if (!err) {
                        var find = db.collection('users')
                            .find({
                                username: session.user
                            })
                            .count()
                            .then((c) => {
                                if (c > 0) {
                                    console.log('user exists');
                                    console.log(user);
                                } else {
                                    db.collection('users').insertOne({
                                        token: session.key,
                                        name: '',
                                        username: session.user,
                                        mac_address: '',
                                        last_song: '',
                                        last_genre: ''
                                    }, (err, r) => {
                                        console.log(err);
                                        console.log(r);
                                    })
                                }
                            })
                            .catch((err) => {
                                console.log(err);
                            });
                    } else {
                        console.log(err);
                    }
                });
            },
            error: (err) => {
                console.log(err);
            }
        }
    });
    res.locals = {
        title: 'Login Last.FM',
        url: authUrl
    }
    res.render('index');
});

app.listen(3000);
