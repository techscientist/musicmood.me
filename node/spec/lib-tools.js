var sinon = require("sinon"),
    mongo = require('../lib/mongo'),
    proxyquire = require('proxyquire').noPreserveCache(),
    expect = require('chai').expect;

var rs = function(url) {
    var then = sinon.stub();
    then.onCall(0).returns(
        function() {
            console.log(url);
        }
    )
    return {
        then: then
    }
};

var tools = proxyquire('../lib/tools.js', {
    'request-promise': rs
});

describe("Tools", function() {
    describe("logger instance", function() {
        describe('called without a string', function() {
            it("should be false", function() {
                expect(tools.logger()).to.be.false;
            });
        });
        describe('called with a string', function() {
            it("should be true", function() {
                expect(tools.logger('test')).to.be.true;
            });
        });
    });

    describe('updateUserInfo', function() {
        describe('update', function() {
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

            it("should succeed", function() {
                return tools.updateUserInfo({}, {})
                    .then(function(info) {
                        expect(info).to.be.true;
                    })
            });
        });

        describe('update', function() {
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

            it("should fail", function() {
                return tools.updateUserInfo({}, {})
                    .catch(function(info) {
                        expect(info).to.be.true;
                    });
            });
        });
    });

    describe('newUser', function() {
        describe('user exists', function() {
            var mongoStub,
                sandbox;
            before(function() {
                sandbox = sinon.sandbox.create();
                mongoStub = sandbox.stub(mongo, 'getInstance', function(callback) {
                    db = {};
                    db.collection = function(collection) {
                        return {
                            find: function(what) {
                                return {
                                    count: function() {
                                        return {
                                            then: function(callback) {
                                                callback(1);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    callback(db);
                });
            });
            after(function() {
                sandbox.restore();
            });
            it('should fail', function() {
                return tools.newUser({
                        "user": "chr0nu5"
                    })
                    .catch(function(err) {
                        expect(err).to.equal('USER_EXISTS');
                    });
            })
        });
        describe('user do not exists', function() {
            var mongoStub,
                sandbox;
            before(function() {
                sandbox = sinon.sandbox.create();
                mongoStub = sandbox.stub(mongo, 'getInstance', function(callback) {
                    db = {};
                    db.collection = function(collection) {
                        return {
                            find: function(what) {
                                return {
                                    count: function() {
                                        return {
                                            then: function(callback) {
                                                callback(0);
                                            }
                                        }
                                    }
                                }
                            },
                            insertOne: function(what, callback) {
                                callback(false, true);
                            }
                        }
                    }
                    callback(db);
                });
            });
            after(function() {
                sandbox.restore();
            });
            it('should not fail', function() {
                return tools.newUser({
                        "user": "chr0nu5"
                    })
                    .then(function(r) {
                        expect(r).to.be.true;
                    });
            })
        });
        describe('user do not exists (error on mongo)', function() {
            var mongoStub,
                sandbox;
            before(function() {
                sandbox = sinon.sandbox.create();
                mongoStub = sandbox.stub(mongo, 'getInstance', function(callback) {
                    db = {};
                    db.collection = function(collection) {
                        return {
                            find: function(what) {
                                return {
                                    count: function() {
                                        return {
                                            then: function(callback) {
                                                callback(0);
                                            }
                                        }
                                    }
                                }
                            },
                            insertOne: function(what, callback) {
                                callback(true);
                            }
                        }
                    }
                    callback(db);
                });
            });
            after(function() {
                sandbox.restore();
            });
            it('should fail', function() {
                return tools.newUser({
                        "user": "chr0nu5"
                    })
                    .catch(function(err) {
                        expect(err).to.be.true;
                    });
            })
        });
    });

    describe('searchSong', function() {
        describe('without a song and an artist', function() {
            it('shout fail', function() {
                return tools.searchSong('', '')
                    .catch(function(err) {
                        expect(err).to.equal('NO_MUSIC');
                    });
            })
        });
        // describe('not a response or not a json response', function() {
        //     it('shout fail', function() {
        //         return tools.searchSong('great', 'song')
        //             .catch(function(err) {
        //                 expect(err).to.equal('NO_PREVIEW_FROM_SPOTIFY');
        //             });
        //     })
        // });
    })

});
