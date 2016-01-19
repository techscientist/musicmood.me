// var LastFmNode = require('lastfm').LastFmNode;
// var tools = require('./lib/tools');
//
// var lastfm = new LastFmNode({
//     api_key: tools.LASTFM_API_KEY,
//     secret: tools.LASTFM_API_SEC
// });
//
// var trackStream = lastfm.stream('chr0nu5');
//
// function processTrack(track) {
//     tools.processTrack(track)
//         .then((info) => {
//             console.log(`\nMusic: ${info.music}\nArtist: ${info.artist}\nGenres: (${info.genres.toString()}) \nBPM: ${info.bpm}`);
//             console.log(`HarPer length: ${info.harper.length}`);
//             console.log(`Duration (MS): ${info.duration}`);
//         })
//         .catch((err) => {
//             console.error(err);
//         });
// }
//
// trackStream.on('nowPlaying', processTrack)
//     .on('error', function(error) {
//         console.log('Weird Error: ', error);
//     });
//
// trackStream.start();

var serialPort = require("serialport");
serialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);
  });
});

var SerialPort = require("serialport").SerialPort
var serialPort = new SerialPort("/dev/ttyACM0", {
  baudrate: 230400
});

function chr(codePt) {
  //  discuss at: http://phpjs.org/functions/chr/
  // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  // improved by: Brett Zamir (http://brett-zamir.me)
  //   example 1: chr(75) === 'K';
  //   example 1: chr(65536) === '\uD800\uDC00';
  //   returns 1: true
  //   returns 1: true

  if (codePt > 0xFFFF) { // Create a four-byte string (length 2) since this code point is high
    //   enough for the UTF-16 encoding (JavaScript internal use), to
    //   require representation with two surrogates (reserved non-characters
    //   used for building other characters; the first is "high" and the next "low")
    codePt -= 0x10000;
    return String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 + (codePt & 0x3FF));
  }
  return String.fromCharCode(codePt);
}

serialPort.on("open", function () {
  console.log('open');
  serialPort.on('data', function(data) {
    console.log('data received: ' + data);
  });
  serialPort.write(chr(0x6B), function(err, results) {
    console.log('err ' + err);
    console.log('results ' + results);
  });
  serialPort.write(chr(0x8D), function(err, results) {
    console.log('err ' + err);
    console.log('results ' + results);
  });
  serialPort.write(chr(255), function(err, results) {
    console.log('err ' + err);
    console.log('results ' + results);
  });
  serialPort.write(chr(0), function(err, results) {
    console.log('err ' + err);
    console.log('results ' + results);
  });
  serialPort.write(chr(255), function(err, results) {
    console.log('err ' + err);
    console.log('results ' + results);
  });
  serialPort.write(chr(2), function(err, results) {
    console.log('err ' + err);
    console.log('results ' + results);
  });
});
