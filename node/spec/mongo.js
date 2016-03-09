var sinon = require("sinon"),
    MongoClient = require('mongodb').MongoClient,
    expect = require('chai').expect,
    assert = require('chai').assert;

var Mongo = require("../lib/mongo");

describe('Mongo', function() {
    describe('initPool when MongoClient fails', function() {
        var mongoStub;
        before(function() {
            mongoStub = sinon.stub(MongoClient, 'connect', function(url, options, callback) {
                callback(new Error('Generic Error'));
            });
        });

        after(function() {
            mongoStub.restore();
        });

        it('should fail', function() {
            expect(Mongo.initPool).to.Throw();
            // expect(function() {
            //     Mongo.initPool();
            // }).to.Throw();
        });
    });
});
