var sinon = require("sinon"),
    SpotifyWebApi = require('spotify-web-api-node'),
    LastFmApi = require('lastfmapi'),
    LastFmApiNode = require('lastfm').LastFmNode,
    tools = require('../lib/tools.js'),
    proxyquire = require('proxyquire').noPreserveCache(),
    expect = require('chai').expect;

var ua = function(key) {
    var _this = this;
    this.currentKey = 0;
    return {
        event: {
            apply: function(instance, arguments) {
                return {
                    save: function() {
                        if (_this.currentKey > 0) {
                            throw new Error('Error saving event');
                        }
                        _this.currentKey += 1;
                    }
                }
            }
        }
    }
}

var thirdparty = proxyquire('../lib/thirdparty.js', {
    'universal-analytics': ua
});

describe('Thirdparty', function() {
    describe('getSpotifyApi new SpotifyWebApi', function() {
        var spotifyStub;
        before(function() {
            spotifyStub = sinon.createStubInstance(SpotifyWebApi);
        });

        it('should create a new instance', function() {
            expect(thirdparty.getSpotifyApi()).to.respondTo('setAccessToken');
        });
    });

    describe('getLastFmApi new LastFmApi', function() {
        var lastfmStub;
        before(function() {
            lastfmStub = sinon.createStubInstance(LastFmApi);
        });

        it('should create a new instance', function() {
            expect(thirdparty.getLastFmApi()).to.respondTo('getAuthenticationUrl');
        });
    });

    describe('getLastfmNodeApi new LastFmApiNode', function() {
        var lastfmStub;
        before(function() {
            lastfmStub = sinon.createStubInstance(LastFmApiNode);
        });

        it('should create a new instance', function() {
            expect(thirdparty.getLastfmNodeApi()).to.respondTo('stream');
        });
    });

    describe('recordUAEvent register an UA event without key', function() {
        var oldToolAnalitycsKey = tools.analyticsKey;
        before(function() {
            tools.analyticsKey = '';
        });

        after(function() {
            tools.analyticsKey = oldToolAnalitycsKey;
        });

        it('should fail', function() {
            expect(thirdparty.recordUAEvent).to.Throw();
        });
    });

    describe('recordUAEvent register and save a event', function() {
        var oldToolAnalitycsKey = tools.analyticsKey;
        before(function() {
            tools.analyticsKey = 'UAKEY';
        });

        after(function() {
            tools.analyticsKey = oldToolAnalitycsKey;
        });

        it('should not fail', function() {
            expect(thirdparty.recordUAEvent).to.not.Throw();
        });
    });

    describe('recordUAEvent error saving a event', function() {
        it('should fail', function() {
            expect(thirdparty.recordUAEvent).to.Throw();
        });
    });

});
