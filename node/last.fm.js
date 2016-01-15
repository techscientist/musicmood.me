var LastFmNode = require('lastfm').LastFmNode;
var tools = require('./tools');

var lastfm = new LastFmNode({
    api_key: tools.LASTFM_API_KEY,
    secret: tools.LASTFM_API_SEC
});

var trackStream = lastfm.stream('chr0nu5');

trackStream.on('lastPlayed', function(track) {
    tools.processTrack(track);
});

trackStream.on('nowPlaying', function(track) {
    tools.processTrack(track);
});

trackStream.on('scrobbled', function(track) {
    //functions.processTrack(track);
});

trackStream.on('stoppedPlaying', function(track) {
    //functions.processTrack(track);
});

trackStream.on('error', function(error) {
    console.log('Error: ' + error.message);
});

trackStream.start();
