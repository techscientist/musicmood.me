var tools = require('./tools'),
    SpotifyWebApi = require('spotify-web-api-node'),
    LastFmApi = require('lastfmapi'),
    LastFmApiNode = require('lastfm').LastFmNode,
    ua = require('universal-analytics');

var spotify, lastFmApi, lastFmNode, uaInstance;

module.exports = {
    getSpotifyApi: function() {
        return spotify || (spotify = new SpotifyWebApi({
            clientId: tools.SPOTIFY_CLIENT_ID,
            clientSecret: tools.SPOTIFY_CLIENT_SECRET,
            redirectUri: tools.SPOTIFY_REDIRECT_URI
        }));
    },
    getLastFmApi: function() {
        return lastFmApi || (lastFmApi = new LastfmAPI({
            'api_key': tools.LASTFM_API_KEY,
            'secret': tools.LASTFM_API_SEC
        }));
    },
    getLastfmNodeApi: function() {
        return lastFmNode || (lastFmNode = new LastFmNode({
            api_key: tools.LASTFM_API_KEY,
            secret: tools.LASTFM_API_SEC
        }));
    },
    getAnalyticsApi: function() {
        // FIXME: Move to a settings module
        return uaInstance || (uaInstance = ua('UA-74495247-1'));
    }
};
