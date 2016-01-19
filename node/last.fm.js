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
