var LastFmNode = require('lastfm').LastFmNode;
var tools = require('./lib/tools');
var mongo = require('mongodb').MongoClient;

var SerialPort = require("serialport").SerialPort,
    lastfm = new LastFmNode({
        api_key: tools.LASTFM_API_KEY,
        secret: tools.LASTFM_API_SEC
    }),
    transfer = false,
    url_mongo = 'mongodb://localhost:27017/spotify-visualizer',
    serialPort, harper, total, duration;

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

function equalizer() {
    if (transfer && harper.length > 0) {
        var eq = harper[0],
            percent = (30 * eq / 1000).toFixed(0);
        harper.shift();
        writeBuffer(createBuffer([0x6B, 0x8D, 255, 0, 0, percent]));
        //console.log(percent, eq, harper.length);
        setTimeout(equalizer, 200);
    }
}

function processTrack(track, user) {
    tools.processTrack(track, user)
        .then((info) => {
            console.log(`\nMusic: ${info.music}\nArtist: ${info.artist}\nGenres: (${info.genres.toString()}) \nBPM: ${info.bpm}`);
            harper = info.harper;
            total = harper.length;
            duration = info.duration;
            //console.log(total, duration);
            //writeBuffer(createBuffer([0x6B, 0x8D, 255, 0, 0, 5]));
            //transfer = true;
            //equalizer();
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
