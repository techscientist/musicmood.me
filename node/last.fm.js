var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
    res.sendfile('views/socket.html');
});

http.listen(3030, function() {
    console.log('listening on *:3030');
});

var LastFmNode = require('lastfm').LastFmNode;
var tools = require('./lib/tools');
var Moods = require('./lib/moods');
var mongo = require('mongodb').MongoClient;
var beats_per_second = 8; //the same value needs to be on tools.js to sync
var processList = {};

var Moods = new Moods();

var SerialPort = require("serialport").SerialPort,
    lastfm = new LastFmNode({
        api_key: tools.LASTFM_API_KEY,
        secret: tools.LASTFM_API_SEC
    }),
    url_mongo = 'mongodb://localhost:27017/spotify-visualizer',
    serialPort, harper, total, duration;

var ProcessUser = function(user, beats, track, harper, socketServer, mood) {

    this.user = user;
    this.beats = beats;
    this.track = track;
    this.harper = harper;
    this.socket = socketServer;
    this.interval = undefined;

    var _this = this;

    this._init = () => {
        console.log('_init', _this.user);
        console.log(Moods.NearestFeeling(mood));
        _this.interval = setInterval(() => {
            if (_this.harper.length > 0) {
                var eq = _this.harper[0],
                    percent = (100 * eq / 1000).toFixed(0);
                _this.harper.shift();
                _this.socket.emit('harper', {
                    "user": _this.user,
                    "beat": percent
                });
                //console.log(percent, _this.user);
                //remove this comments to write to a serial port
                //writeBuffer(createBuffer([0x6B, 0x8D, 255, 0, 0, percent]));
            } else {
                clearInterval(_this.interval);
            }
        }, 1000 / _this.beats)
    }
    this._finish = () => {
        console.log('_finish', _this.user);
        clearInterval(_this.interval);
    }

}

function createBuffer(list) {
    var buffer = new Buffer(list.length);
    list.forEach((item, index) => {
        buffer[index] = item
    });
    return buffer;
}

function writeBuffer(buffer) {
    serialPort.open((error) => {
        if (error) {
            console.log('failed to open: ' + error);
        } else {
            serialPort.write(buffer, (err, results) => {
                //console.log('err ' + err);
                //console.log('results ' + results);
            });
        }
    });
}

function processTrack(track, user) {
    tools.processTrack(track, user)
        .then((info) => {
            harper = info.harper;
            total = harper.length;
            duration = info.duration;
            console.log(`\nUSER: ${user}\nMUSIC: ${info.music}\nARTIST: ${info.artist}\nGENRES: (${info.genres.toString()}) \nBPM: ${info.bpm} \nHARPER: ${total} \nDURATION: ${duration} \nENERGY: ${info.energy} \nVALENCE: ${info.valence}`);
            //console.log(total, duration);
            //writeBuffer(createBuffer([0x6B, 0x8D, 255, 0, 0, 5]));
            //init
            // 0x6B 0x8D
            // change color
            // 0xCC (index profile) (index color)
            // change amplitude
            // 0xCA [n values]
            if (user in processList) {
                processList[user]._finish();
                delete processList[user];
            }

            processList[user] = new ProcessUser(user, beats_per_second, track, harper, io, {"energy": info.energy, "valence": info.valence});
            processList[user]._init();
        })
        .catch((err) => {
            transfer = false;
            console.error(err);
        });
}

function initSerial() {
    serialPort = new SerialPort("/dev/cu.usbmodem1412", {
        // same as the embed hardware
        baudrate: 921600
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
                            transfer = false;
                            console.log('Weird Error: ', error);
                        });
                    trackStream.start();
                });
        } else {
            console.log(err);
        }
    });
}

//initSerial();
initVisualization();
