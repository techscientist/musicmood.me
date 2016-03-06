var express = require('express');
var bodyParser = require('body-parser');
var swig = require('swig');
var consolidate = require('consolidate');
var ua = require('universal-analytics');
var SpotifyWebApi = require('spotify-web-api-node');
var rs = require('request-promise');
var tools = require('./lib/tools');
var LastfmAPI = require('lastfmapi');
var LastFmNode = require('lastfm').LastFmNode;
var url = require('url');
var mongo = require('./lib/mongo').initPool();
var ioc = require('socket.io-client');
var client = ioc.connect(`${tools.SOCKET_SERVER}:${tools.SOCKET_PORT}`);
var Moods = require('./lib/moods');
Moods = new Moods();

// start the server engine using passport and express
var app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.engine('html', consolidate.swig);

var lfm = new LastfmAPI({
    'api_key': tools.LASTFM_API_KEY,
    'secret': tools.LASTFM_API_SEC
});

var lastfm = new LastFmNode({
    api_key: tools.LASTFM_API_KEY,
    secret: tools.LASTFM_API_SEC
});

var spotifyApi = new SpotifyWebApi({
    clientId: tools.SPOTIFY_CLIENT_ID,
    clientSecret: tools.SPOTIFY_CLIENT_SECRET,
    redirectUri: tools.SPOTIFY_REDIRECT_URI
});

var visitor = ua('UA-74495247-1');

app.get('/token', (req, res) => {
    var authorizeURL = spotifyApi.createAuthorizeURL(['playlist-modify-public'], 'state');
    res.redirect(authorizeURL);
});

app.get('/callback', (req, res) => {
    // Retrieve an access token and a refresh token
    spotifyApi.authorizationCodeGrant(req.param('code'))
        .then(function(data) {
            console.log('token', data.body['access_token']);
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);
            res.json(data.body);
        }, function(err) {
            console.log('Something went wrong!', err);
        });
});

app.get('/refresh', (req, res) => {
    spotifyApi.refreshAccessToken()
        .then(function(data) {
            console.log('The access token has been refreshed!');
            spotifyApi.setAccessToken(data.body['access_token']);
            res.json(data);
        }, function(err) {
            console.log('Could not refresh access token', err);
            res.redirect('/token');
        });
});

// home route
app.get('/', (req, res) => {
    res.render('index.html', {
        "moods": Moods.moods.filter(function(value, index) {
            return index > 1
        })
    });
});

//ajax to process the songs
app.post('/get_song', (req, res) => {
    var song = req.body.song;
    var artist = req.body.artist;
    tools.searchSong(song, artist)
        .then((info) => {
            res.json({
                "mood": Moods.NearestFeeling({
                    "energy": info.energy,
                    "valence": info.valence
                }),
                "preview_url": info.preview_url
            });
        })
        .catch((error) => {
            res.json({
                "error": true,
                "msg": error
            })
        })
    visitor.event("Backend", "get_song", "Song", artist + ' ' + song).send()
});

//ajax to process the songs
app.get('/mood/:artist/:song/', (req, res) => {
    var song = req.params.song;
    var artist = req.params.artist;
    tools.searchSong(song, artist)
        .then((info) => {
            var mood = Moods.NearestFeeling({
                "energy": info.energy,
                "valence": info.valence
            });
            res.json({
                "error": false,
                "mood": mood.mood,
                "color": mood.color
                    // if you need, you can send the preview url too
                    // "preview_url": info.preview_url
            });
        })
        .catch((error) => {
            res.json({
                "error": true,
                "msg": "Artist/Song could not be found."
            })
        })
    visitor.event("Backend", "api_mood", "Song", artist + ' ' + song).send()
});

app.get('/get_playlist/:mood', (req, res) => {
    var mood = req.params.mood;
    var songs = [];
    var ids = [];

    function process_songs() {
        if (songs.length > 0 && songs[0].indexOf('spotify:track') < 0) {
            rs({
                    uri: `https://api.spotify.com/v1/search?query=${encodeURIComponent(songs[0])}&offset=0&limit=1&type=track`,
                    json: true
                })
                .then((data) => {
                    if (data.tracks.items.length > 0) {
                        ids.push(data.tracks.items[0].uri);
                    }
                    songs.shift();
                    if (ids.length < 20) {
                        process_songs();
                    } else {
                        songs = [];
                        process_songs();
                    }
                })
                .catch((err) => {
                    console.log(err);
                    res.json({
                        "error": true,
                        "msg": "Error processing mood"
                    });
                });
        } else {
            if (songs.length > 0) {
                ids = songs;
            }
            mongo.getInstance((db) => {
                db.collection('moods').updateOne({
                    "mood": mood
                }, {
                    $set: {
                        "songs": ids,
                    }
                }, (err, results) => {
                    if (!err) {
                        spotifyApi.createPlaylist('227zpb4bj4r6hlmdopa7xaq4a', `${mood.toUpperCase()} playlist by MusicMood`, {
                                'public': true
                            })
                            .then(function(data) {
                                mongo.getInstance((db) => {
                                    db.collection('moods').updateOne({
                                        "mood": mood
                                    }, {
                                        $set: {
                                            "url": data.body.external_urls.spotify,
                                        }
                                    }, (err, results) => {
                                        if (!err) {
                                            res.json({
                                                "error": false,
                                                "playlist_url": data.body.external_urls.spotify
                                            });
                                        } else {
                                            reject(err);
                                        }
                                    })
                                });
                            }, function(err) {
                                console.log(err);
                                res.json({
                                    "error": true,
                                    "msg": "Error processing mood"
                                });
                            });
                    } else {
                        res.json({
                            "error": true,
                            "msg": "Error processing mood"
                        });
                    }
                })
            });
        }
    }

    return new Promise((resolve, reject) => {
            mongo.getInstance((db) => {
                db.collection('moods')
                    .findOne({
                        mood: mood
                    }, (err, item) => {
                        if (!err) {
                            if (item) {
                                resolve(item);
                            } else {
                                var url = `http://developer.echonest.com/api/v4/song/search?api_key=${tools.ECHONEST_API_KEY}&format=json&results=100&mood=${mood}`;
                                rs({
                                        uri: url,
                                        json: true
                                    })
                                    .then((data) => {
                                        var items = data.response.songs;
                                        db.collection('moods').insertOne({
                                            mood: mood,
                                            songs: items
                                        }, (err, item) => {
                                            if (!err) {
                                                db.collection('moods')
                                                    .findOne({
                                                        mood: mood
                                                    }, (err, item) => {
                                                        if (!err) {
                                                            if (item) {
                                                                resolve(item);
                                                            } else {
                                                                reject("MOOD_NOT_FOUND");
                                                            }
                                                        } else {
                                                            reject(err);
                                                        }
                                                    })
                                            } else {
                                                reject(err);
                                            }
                                        });
                                    })
                            }
                        } else {
                            reject(err);
                        }
                    });
            })
        })
        .then((mood) => {
            if (mood.url) {
                res.json({
                    "error": false,
                    "playlist_url": mood.url
                });
            } else {
                var url;
                mood.songs.forEach((item) => {
                    songs.push(`${item.artist_name} ${item.title}`);
                });
                process_songs();
            }
        })
        .catch((err) => {
            console.log(err);
            res.json({
                "error": true,
                "msg": "Error processing mood"
            });
        })
});

app.get('/login', (req, res) => {
    var authUrl = lfm.getAuthenticationUrl({
        'cb': req.protocol + '://' + req.get('host') + '/auth'
    });
    res.render('login.html', {
        title: 'Login Last.FM',
        url: authUrl
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
                        client.emit('new_user', result.ops[0].username);
                        res.redirect('/login');
                    }).catch((err) => {
                        console.log(err);
                        res.redirect('/login');
                    });
            },
            error: (err) => {
                console.log(err);
            }
        }
    });
});

// admin interface
// app.get('/admin', (req, res) => {
//     mongo.getInstance((db) => {
//         db.collection('users').find({}).toArray((err, items) => {
//             if (!err) {
//                 res.render('admin', {
//                     title: 'Update User Fields Last.FM',
//                     users: items
//                 });
//             } else {
//                 console.log(err);
//             }
//         });
//     });
// });

// update user
// app.post('/update', (req, res) => {
//     var name = req.body.name,
//         mac_address = req.body.mac_address,
//         username = req.body.username,
//         index = req.body.index;
//
//     tools.updateUserInfo({
//         "username": username
//     }, {
//         "name": name,
//         "mac_address": mac_address,
//         "index": index
//     }).then((results) => {
//         res.redirect('/admin')
//     }).catch((err) => {
//         console.log(err);
//         res.redirect('/admin')
//     });
// });

// run app
app.listen(3000);
