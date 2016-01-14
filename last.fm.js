var LastFmNode = require('lastfm').LastFmNode;
var http = require('http');
var https = require('https');

var lastfm = new LastFmNode({
  api_key: '7d0a3a11116a3f166a5b71674e825355',
  secret: '3d49048d35673db025c60e3062f5a57d'
});

var trackStream = lastfm.stream('chr0nu5');

trackStream.on('lastPlayed', function(track) {
  console.log('Last played: ', track.name, ' - ' + track.artist["#text"]);
});

trackStream.on('nowPlaying', function(track) {

  http.get({
    hostname: 'developer.echonest.com',
    path: '/api/v4/artist/terms?api_key=DJQBV7G7ZFUC7CZAZ&format=json&name='+track.artist["#text"],
  }, (response) => {

    var data = "";
    response.on("data", function (chunk) {
        data += chunk;
    });
    response.on("end", function () {
        var genres = [];
        var terms = JSON.parse(data).response.terms;
        terms.forEach(function(item){
          genres.push(item.name);
        });

        data = '';

        https.get({
          hostname: 'api.spotify.com',
          path: '/v1/search?query='+encodeURIComponent(track.name)+'&offset=0&limit=50&type=track'
        }, (response) => {
          response.on("data", function(chunk){
            data += chunk;
          });
          response.on("end", function(){
            var tracks = JSON.parse(data).tracks.items;
            var preview_url = 0;
            tracks.forEach(function(item){
              var artists = item.artists;
              artists.forEach(function(artist){
                if ( artist.name === track.artist["#text"] ){
                  preview_url = item.preview_url
                }
              });
            });
            console.log(preview_url);
          });
        });
        //console.log('Now playing: ', track.name +' - '+ track.artist["#text"]);
        console.log('Now playing: \nMusic:', track.name, '\nArist: ' + track.artist["#text"], ' \nGenres: ('+genres.toString()+')');
    });
  });


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
