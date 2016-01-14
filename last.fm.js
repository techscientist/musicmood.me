var LastFmNode = require('lastfm').LastFmNode;

var lastfm = new LastFmNode({
  api_key: '7d0a3a11116a3f166a5b71674e825355',
  secret: '3d49048d35673db025c60e3062f5a57d'
});

var trackStream = lastfm.stream('chr0nu5');

trackStream.on('lastPlayed', function(track) {
  console.log('Last played: ', track.name, ' - ' + track.artist["#text"]);
});

trackStream.on('nowPlaying', function(track) {
  console.log('Now playing: ', track.name, ' - ' + track.artist["#text"]);
});

trackStream.on('scrobbled', function(track) {
  console.log('Scrobbled: ', track.name, ' - ' + track.artist["#text"]);
});

trackStream.on('stoppedPlaying', function(track) {
  console.log('Stopped playing: ', track.name, ' - ' + track.artist["#text"]);
});

trackStream.on('error', function(error) {
  console.log('Error: '  + error.message);
});

trackStream.start();

// var session = lastfm.session({
//    token: token,
//    handlers: {
//       success: function(session) {
//          lastfm.update('nowplaying', session, { track: track } );
//          lastfm.update('scrobble', session, { track: track, timestamp: 12345678 });
//       }
//    }
// });

// var request = lastfm.request("artist.getInfo", {
//     artist: "The Mae Shi",
//     handlers: {
//         success: function(data) {
//             console.log("Success: " + data);
//         },
//         error: function(error) {
//             console.log("Error: " + error.message);
//         }
//     }
// });
