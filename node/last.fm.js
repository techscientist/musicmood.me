var LastFmNode = require('lastfm').LastFmNode;
var tools = require('./lib/tools');

var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort("/dev/cu.usbmodem1412", {
    baudrate: 921600
});

var lastfm = new LastFmNode({
    api_key: tools.LASTFM_API_KEY,
    secret: tools.LASTFM_API_SEC
});

var trackStream = lastfm.stream('chr0nu5'),
    transfer = false;
var harper, total, duration;

function createBuffer(list) {
    var buffer = new Buffer(list.length);
    list.forEach((item, index) => {
        buffer[index] = item
    });
    return buffer;
}

function writeBuffer(buffer) {
    serialPort.open(function(error) {
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

function processTrack(track) {
    tools.processTrack(track)
        .then((info) => {
            console.log(`\nMusic: ${info.music}\nArtist: ${info.artist}\nGenres: (${info.genres.toString()}) \nBPM: ${info.bpm}`);
            harper = info.harper;
            total = harper.length;
            duration = info.duration;
            writeBuffer(createBuffer([0x6B, 0x8D, 255, 0, 0, 5]));
            transfer = true;
            equalizer();
        })
        .catch((err) => {
            transfer = false;
            console.error(err);
        });
}

trackStream.on('nowPlaying', processTrack)
    .on('error', function(error) {
        transfer = false;
        console.log('Weird Error: ', error);
    });

trackStream.start();
