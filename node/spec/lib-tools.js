var sinon = require("sinon"),
    tools = require('../lib/tools.js'),
    mongo = require('../lib/mongo'),
    expect = require('chai').expect;

describe("Tools", function() {
    describe("logger instance", function() {
        it("should not fail", function() {
            expect(tools.logger()).to.be.an('undefined');
        });
    });

    describe('getInstance when MongoClient succeed update', function() {
        var mongoStub,
            sandbox;
        before(function() {
            sandbox = sinon.sandbox.create();
            mongoStub = sandbox.stub(mongo, 'getInstance', function(callback) {
                db = {};
                db.collection = function(collection) {
                    return {
                        updateOne: function(who, what, callback) {
                            callback(false, true);
                        }
                    }
                };
                callback(db);
            });
        });

        after(function() {
            sandbox.restore();
        });

        it("should resolve", function() {
            return tools.updateUserInfo({}, {})
                .then(function(info) {
                    expect(info).to.be.true;
                })
        });
    });

    describe('getInstance when MongoClient do not succeed update', function() {
        var mongoStub,
            sandbox;
        before(function() {
            sandbox = sinon.sandbox.create();
            mongoStub = sandbox.stub(mongo, 'getInstance', function(callback) {
                db = {};
                db.collection = function(collection) {
                    return {
                        updateOne: function(who, what, callback) {
                            callback(true, false);
                        }
                    }
                };
                callback(db);
            });
        });

        after(function() {
            sandbox.restore();
        });

        it("should reject", function() {
            return tools.updateUserInfo({}, {})
                .catch(function(info) {
                    expect(info).to.be.true;
                });
        });
    });

});
