var LastFmNode = require('lastfm').LastFmNode;
var tools = require('./tools');

var lastfm = new LastFmNode({
    api_key: tools.LASTFM_API_KEY,
    secret: tools.LASTFM_API_SEC
});

var trackStream = lastfm.stream('chr0nu5');

function processTrack(track) {
    tools.processTrack(track)
        .then((info) => {
            console.log(`\nMusic: ${info.music}\nArtist: ${info.artist}\nGenres: (${info.genres.toString()}) \nBPM: ${info.bpm}`);
            console.log(`HarPer length: ${info.harper.length}`);
            console.log(`Duration (MS): ${info.duration}`);
        })
        .catch((err) => {
            console.error(err);
        })
}

//trackStream.on('lastPlayed', processTrack);

trackStream.on('nowPlaying', processTrack);

// trackStream.on('scrobbled', function(track) {
//     //functions.processTrack(track);
// });

// trackStream.on('stoppedPlaying', function(track) {
//     //functions.processTrack(track);
// });

trackStream.on('error', function(error) {
    console.log('Weird Error: ', error);
});

trackStream.start();
