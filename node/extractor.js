var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var LastFmNode = require('lastfm').LastFmNode;
var tools = require('./lib/tools');
var Moods = require('./lib/moods');
var mongo = require('mongodb').MongoClient;

app.get('/', function(req, res) {
    res.sendfile('views/socket.html');
});

http.listen(3030, function() {
    console.log('listening on *:3030');
});


var beats_per_second = tools.BEATS_PER_SECOND; //the same value needs to be on tools.js to sync
var processList = {};

var Moods = new Moods();

var lastfm = new LastFmNode({
        api_key: tools.LASTFM_API_KEY,
        secret: tools.LASTFM_API_SEC
    }),
    url_mongo = 'mongodb://localhost:27017/spotify-visualizer',
    harper, total, duration;

var ProcessUser = function(user, index, beats, track, harper, socketServer, mood) {

    this.user = user;
    this.index = index;
    this.beats = beats;
    this.track = track;
    this.harper = harper;
    this.socket = socketServer;
    this.interval = undefined;
    this.mood = mood;

    var _this = this;

    this._init = () => {
        console.log('_init', _this.user, `(${_this.track.artist['#text']} - ${_this.track.name})`);
        var mood = Moods.NearestFeeling(_this.mood);
        //send a change color to the queue
        _this.socket.emit('queue', {
            c: mood.colorIndex,
            i: _this.index,
            p: 0
        })
        _this.repeat = function() {
            if (_this.harper.length > 0) {
                var eq = _this.harper[0],
                    percent = (100 * eq / 1000).toFixed(0),
                    buffer = '';
                _this.harper.shift();
                _this.socket.emit('harper', {
                    "user": _this.user,
                    "beat": percent,
                    "color": Moods.NearestFeeling(_this.mood).color
                });
                _this.socket.emit('queue', {
                    a: percent,
                    i: _this.index,
                    p: 0,
                    u: user
                });
                _this.interval = setTimeout(_this.repeat, 1000 / _this.beats);
            } else {
                clearTimeout(_this.interval);
            }
        }
        _this.interval = setTimeout(_this.repeat, 1000 / _this.beats);
    }
    this._finish = () => {
        _this.socket.emit('finish', {
            u: user
        });
        console.log('_finish', _this.user);
    }

}

function stopUser(user, why) {
    if (user in processList) {
        processList[user]._finish();
        delete processList[user];
        console.log(`${user}: stopping (${why})`);
    } else {
        console.log(`${user}: not born yet (${why})`);
    }
}

function processTrack(track, user) {
    tools.processTrack(track, user)
        .then((info) => {
            harper = info.harper;
            total = harper.length;
            duration = info.duration;

            mongo.connect(url_mongo, (err, db) => {
                if (!err) {
                    var find = db.collection('users')
                        .findOne({
                            username: user
                        }, (err, item) => {
                            if (user in processList) {
                                if (processList[user].track.name !== track.name) {
                                    stopUser(user, 'new song');
                                }
                            } else {
                                processList[user] = new ProcessUser(user, parseInt(item.index), beats_per_second, track, harper, io, {
                                    "energy": info.energy,
                                    "valence": info.valence
                                });
                                processList[user]._init();
                            }
                            db.close();
                            return Promise.resolve();
                        });
                } else {
                    return Promise.reject(err);
                }
            });

        })
        .catch((err) => {
            stopUser(user, '\033[31m'+err+'\x1b[0m');
        });
}

function initVisualization() {
    mongo.connect(url_mongo, (err, db) => {
        if (!err) {
            var find = db.collection('users')
                .find({})
                .forEach((element) => {
                    var trackStream = lastfm.stream(element.username);
                    trackStream.on('nowPlaying', processTrack)
                        .on('error', function(error) {
                            stopUser(element.username, error);
                        })
                        .on('lastPlayed', function(track) {
                            stopUser(element.username, 'lastPlayed');
                        })
                        .on('stoppedPlaying', function(track) {
                            stopUser(element.username, 'stoppedPlaying');
                        });
                    trackStream.start();
                    db.close();
                });
        } else {
            console.log(err);
        }
    });
}

initVisualization();
