var sinon = require("sinon"),
    mongo = require('../lib/mongo'),
    proxyquire = require('proxyquire').noPreserveCache(),
    expect = require('chai').expect;

var called = 0;
var rs = function(url) {
    called += 1;
    console.log('times called:', called);
    switch (called) {
        // first and second tests only need empty results
        case 1:
            return {
                then: this.then = function(callback) {
                    callback();
                }
            }
            break;
        case 2:
            return {
                then: this.then = function(callback) {
                    callback({});
                }
            }
            break;
        // third and fourth tests only need empty results
        case 3:
            return {
                then: this.then = function(callback) {
                    callback();
                }
            }
            break;
        case 4:
            return {
                then: this.then = function(callback) {
                    callback({});
                }
            }
            break;
        // this is for the spotify returning a preview url on a item
        case 5:
            return {
                then: this.then = function(callback) {
                    callback();
                }
            }
            break;
        case 6:
            return {
                then: this.then = function(callback) {
                    callback({
                        tracks: {
                            items: [
                                {
                                    artists: [
                                        {
                                            name: 'artist'
                                        }
                                    ],
                                    preview_url: 'htt://www.google.com'
                                }
                            ]
                        }
                    });
                }
            }
            break;
        default:

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
        // rs 1 and 2
        describe('not a response or not a json response (spotify)', function() {
            it('shout fail', function() {
                return tools.searchSong('song', 'artist')
                    .catch(function(err) {
                        expect(err).to.equal('NO_PREVIEW_FROM_SPOTIFY');
                    });
            })
        });
        // rs 1 and 2
        describe('not a response or not a json response (itunes)', function() {
            it('shout fail', function() {
                return tools.searchSong('song', 'artist')
                    .catch(function(err) {
                        expect(err).to.equal('NO_PREVIEW_FROM_SPOTIFY');
                    });
            })
        });
        // rs 3 and 4
        describe('return a preview url from spotify', function() {
            it('shout not fail', function() {
                return tools.searchSong('song', 'artist')
                    .then(function(json) {
                        expect(json).to.have.all.keys(['preview_url','energy','valence']);
                    });
            })
        });
    })

});
