var sinon = require("sinon"),
    SpotifyWebApi = require('spotify-web-api-node'),
    LastFmApi = require('lastfmapi'),
    //thirdparty = require('../lib/thirdparty.js'),
    LastFmApiNode = require('lastfm').LastFmNode,
    tools = require('../lib/tools.js'),
    proxyquire = require('proxyquire'),
    expect = require('chai').expect;

var ua = function() {
    console.log('ua');
    this.event = function() {
        console.log('event');
        this.apply = function() {
            console.log('apply');
            this.save = function() {
                console.log('save');
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

    // describe('recordUAEvent register an UA event', function() {
    //
    //     var toolsStub;
    //     before(function() {
    //         toolsStub = sinon.stub(tools, 'analyticsKey', null);
    //     });
    //
    //     // var oldToolAnalitycsKey = tools.analyticsKey;
    //     // before(function() {
    //     //     tools.analyticsKey = '';
    //     //     console.log(thirdparty.recordUAEvent());
    //     // });
    //     //
    //     // after(function() {
    //     //     tools.analyticsKey = oldToolAnalitycsKey;
    //     // });
    //
    //     it('should have a configuration', function() {
    //         expect(thirdparty.recordUAEvent()).to.be.an('undefined');
    //     });
    // });

    describe('recurdUAEvent success on save event', function() {
        var oldToolAnalitycsKey = tools.analyticsKey;
        before(function() {
            tools.analyticsKey = 'UATESTKEY';
        });

        after(function() {
            tools.analyticsKey = oldToolAnalitycsKey;
        });

        it('should not fail', function() {
            expect(thirdparty.recordUAEvent()).to.be.true;
        });
    });

});
