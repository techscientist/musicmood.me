// 3rd party
var express = require('express');
var bodyParser = require('body-parser');
var swig = require('swig');
var consolidate = require('consolidate');

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
                    //"preview_url": info.preview_url
            });
        })
        .catch((error) => {
            res.json({
                "error": true,
                "msg": "Artist/Song could not be found."
            })
        })
});

// run app
app.listen(3000);

//
// app.get('/login', (req, res) => {
//     var authUrl = lfm.getAuthenticationUrl({
//         'cb': req.protocol + '://' + req.get('host') + '/auth'
//     });
//     res.locals = {
//         title: 'Login Last.FM',
//         url: authUrl
//     }
//     res.render('login');
// });
//
// app.get('/admin', (req, res) => {
//     mongo.getInstance((db) => {
//         db.collection('users').find({}).toArray((err, items) => {
//             if (!err) {
//                 res.locals = {
//                     title: 'Update User Fields Last.FM',
//                     users: items
//                 }
//                 res.render('admin');
//             } else {
//                 console.log(err);
//             }
//         });
//     });
// });
//
// app.get('/colors', (req, res) => {
//     res.locals = {
//         moods: Moods.moods
//     }
//     res.render('colors');
// });
//
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
//
// app.get('/auth', (req, res) => {
//     token = url.parse(req.url, true).query.token;
//     var session = lastfm.session({
//         token: token,
//         handlers: {
//             success: (session) => {
//                 tools.newUser(session)
//                     .then((result) => {
//                         client.emit('new_user', result.ops[0].username);
//                         res.redirect('/login');
//                     }).catch((err) => {
//                         console.log(err);
//                         res.redirect('/login');
//                     });
//             },
//             error: (err) => {
//                 console.log(err);
//             }
//         }
//     });
// });
