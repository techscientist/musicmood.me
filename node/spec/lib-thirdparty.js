var sinon = require("sinon"),
    SpotifyWebApi = require('spotify-web-api-node'),
    LastFmApi = require('lastfmapi'),
    thirdparty = require('../lib/thirdparty.js'),
    LastFmApiNode = require('lastfm').LastFmNode,
    expect = require('chai').expect;

describe('Thirdparty', function() {
    describe('getSpotifyApi new SpotifyWebApi', function() {
        var spotifyStub;
        before(function() {
            spotifyStub = sinon.spy(function() {
                return sinon.createStubInstance(SpotifyWebApi);
            });
        });

        it('should create a new instance', function() {
            expect(thirdparty.getSpotifyApi).to.have.been.calledWithNew;
        });
    });

    describe('getLastFmApi new LastFmApi', function() {
        var lastfmStub;
        before(function() {
            lastfmStub = sinon.spy(function() {
                return sinon.createStubInstance(LastFmApi);
            });
        });

        it('should create a new instance', function() {
            expect(thirdparty.getLastFmApi).to.have.been.calledWithNew;
        });
    });

    describe('getLastfmNodeApi new LastFmApiNode', function() {
        var lastfmStub;
        before(function() {
            lastfmStub = sinon.spy(function() {
                return sinon.createStubInstance(LastFmApiNode);
            });
        });

        it('should create a new instance', function() {
            expect(thirdparty.getLastfmNodeApi).to.have.been.calledWithNew;
        });
    });

});
