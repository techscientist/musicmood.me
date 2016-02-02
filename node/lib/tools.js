var fs = require('fs');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var rs = require('request-promise');
var mongo = require('mongodb').MongoClient;

var mongo_server = 'mongodb://localhost:27017/spotify-visualizer',
    ECHONEST_API_KEY = 'DJQBV7G7ZFUC7CZAZ',
    duration = 0,
    fileType = 'mp3',
    beats_per_second = 8,
    energy = 0,
    valence = 0;

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}

function createFolder() {
    var dir = 'mkdir -p ../tmp';
    var child = execSync(dir, (err, stdout, stderr) => {
        if (err) {
            return Promise.reject(new Error('ERROR_CREATING_FOLDER'));
        }
    });
}

function logBPM(filePath) {
    return new Promise((resolve, reject) => {
        if (!fileExists(filePath)) {
            reject(new Error(`File not found ${filePath}`));
            return;
        }
        var processFile = exec(`python ../python/processor.py ${filePath} ${duration} ${beats_per_second}`, {
            maxBuffer: 1024 * 10000
        }, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                var json = JSON.parse(stdout.replace('\n', ''));
                resolve(json);
            }
        });
    });
}

function downloadFile(preview_url, filePath) {
    return new Promise((resolve, reject) => {
        rs.get(preview_url)
            .on('error', (err) => reject(err))
            .on('end', () => resolve(filePath))
            .pipe(fs.createWriteStream(filePath));
    });
}

function createTrack(info) {
    return new Promise((resolve, reject) => {
        mongo.connect(mongo_server, (err, db) => {
            if (!err) {
                db.collection('songs').insertOne(info, (err, r) => {
                    if (!err) {
                        fs.unlink(`../tmp/${info.slug}.${fileType}`);
                        resolve(info);
                    } else {
                        reject(err);
                    }
                });
            } else {
                reject(err);
            }
        });
    })
}

module.exports = {
    LASTFM_API_KEY: '7d0a3a11116a3f166a5b71674e825355',
    LASTFM_API_SEC: '3d49048d35673db025c60e3062f5a57d',
    processTrack: (track, user) => {
        if (track && !!track.name) {
            return new Promise((resolve, reject) => {
                mongo.connect(mongo_server, (err, db) => {
                    if (!err) {
                        var find = db.collection('songs')
                            .find({
                                slug: slugify(track.artist['#text'] + '-' + track.name)
                            })
                            .toArray((err, items) => {
                                if (items.length > 0) {
                                    // TODO
                                    // GMT -3 ?
                                    var now = 0;
                                    var uts = 1;
                                    if (!!track.date) {
                                        var now = parseInt(Date.now() / 1000);
                                        var uts = parseInt(track.date.uts) + parseInt(duration / 1000);
                                    }
                                    if (uts > now) {
                                        resolve(items[0]);
                                    } else {
                                        reject('\n' + user + ': OLD_SONG');
                                    }
                                } else {
                                    var options = {
                                            uri: `http://developer.echonest.com/api/v4/artist/terms?api_key=${ECHONEST_API_KEY}&format=json&name=${encodeURIComponent(track.artist['#text'])}`,
                                            json: true
                                        },
                                        genres = [],
                                        terms;
                                    return rs(options)
                                        .then((data) => {
                                            if (!!data && !!data.response && !!data.response.terms) {
                                                data.response.terms.forEach((item) => genres.push(item.name));
                                            }

                                            options.uri = `http://developer.echonest.com/api/v4/song/search?api_key=${ECHONEST_API_KEY}&format=json&results=1&artist=${encodeURIComponent(track.artist['#text'])}&title=${encodeURIComponent(track.name)}&bucket=audio_summary`;

                                            return rs(options)
                                                .then((data) => {
                                                    if (!!data && !!data.response && !!data.response.songs && data.response.songs.length > 0) {
                                                        energy = data.response.songs[0].audio_summary.energy;
                                                        valence = data.response.songs[0].audio_summary.valence;
                                                    }
                                                    options.uri = `https://api.spotify.com/v1/search?query=${encodeURIComponent(track.name)}&offset=0&limit=50&type=track`;
                                                    return rs(options);
                                                })
                                        })
                                        .then((data) => {
                                            var preview_url = undefined;
                                            if (!!data && !!data.tracks && !!data.tracks.items) {
                                                data.tracks.items.forEach((item) => {
                                                    item.artists.forEach((artist) => {
                                                        if (artist.name.toLowerCase() === track.artist['#text'].toLowerCase()) {
                                                            preview_url = item.preview_url;
                                                            duration = item.duration_ms;
                                                        }
                                                    });
                                                });

                                                if (preview_url) {
                                                    return preview_url;
                                                } else {
                                                    options.uri = `https://itunes.apple.com/search?term=${encodeURIComponent(track.name)}&entity=musicTrack`;
                                                    return rs(options)
                                                        .then((data) => {
                                                            if (!!data && !!data.results) {
                                                                data.results.forEach((item) => {
                                                                    if (item.artistName.toLowerCase() === track.artist['#text'].toLowerCase()) {
                                                                        duration = item.trackTimeMillis;
                                                                        preview_url = item.previewUrl;
                                                                        fileType = 'm4a';
                                                                    }
                                                                });
                                                                if (preview_url) {
                                                                    return preview_url;
                                                                } else {
                                                                    return Promise.reject('\n' + user + ': NO_PREVIEW_FROM_APPLE');
                                                                }
                                                            } else {
                                                                return Promise.reject('\n' + user + ': NO_PREVIEW_FROM_APPLE');
                                                            }
                                                        })
                                                }
                                            } else {
                                                return Promise.reject('\n' + user + ': NO_PREVIEW_FROM_SPOTIFY');
                                            }

                                        })
                                        .then((preview_url) => {
                                            // TODO
                                            // GMT -3 ?
                                            var now = 0;
                                            var uts = 1;
                                            if (!!track.date) {
                                                var now = parseInt(Date.now() / 1000);
                                                var uts = parseInt(track.date.uts) + parseInt(duration / 1000);
                                            }

                                            if (uts > now) {
                                                createFolder();
                                                var filePath = `../tmp/${slugify(track.artist['#text'] + '-' + track.name)}.${fileType}`;
                                                if (fileExists(filePath)) {
                                                    return logBPM(filePath);
                                                } else {
                                                    return downloadFile(preview_url, filePath)
                                                        .then(() => logBPM(filePath));
                                                }
                                            } else {
                                                reject('\n' + user + ': OLD_SONG');
                                            }
                                        })
                                        .then((json) => {
                                            var info = {
                                                slug: slugify(track.artist['#text'] + '-' + track.name),
                                                music: track.name,
                                                artist: track.artist['#text'],
                                                genres: genres,
                                                bpm: json.bpm,
                                                harper: json.harper,
                                                duration: duration,
                                                energy: energy,
                                                valence: valence,
                                                user: user
                                            }
                                            createTrack(info)
                                                .then((info) => {
                                                    resolve(info);
                                                });
                                        });
                                }
                            });
                    } else {
                        reject('\n' + user + ': ' + err);
                    }
                });
            })
        } else {
            return Promise.reject('\n' + user + ': NO_MUSIC');
        }
    },
    newUser: (info) => {
        return new Promise((resolve, reject) => {
            mongo.connect(mongo_server, (err, db) => {
                if (!err) {
                    var find = db.collection('users')
                        .find({
                            username: info.user
                        })
                        .count()
                        .then((c) => {
                            if (c > 0) {
                                reject('USER_EXISTS');
                            } else {
                                db.collection('users').insertOne({
                                    token: info.key,
                                    name: '',
                                    username: info.user,
                                    mac_address: '',
                                    last_song: '',
                                    last_mood: ''
                                }, (err, r) => {
                                    if (!err) {
                                        resolve(r);
                                    } else {
                                        reject(err);
                                    }
                                });
                            }
                        })
                        .catch((err) => {
                            reject(err);
                        });
                } else {
                    reject(err);
                }
            });
        });
    },
    updateUserInfo: (who, what) => {
        return new Promise((resolve, reject) => {
            mongo.connect(mongo_server, (err, db) => {
                if (!err) {
                    var find = db.collection('users').updateOne(
                        who, {
                            $set: what
                        }, (err, results) => {
                            if (!err) {
                                resolve(results);
                            } else {
                                reject(err);
                            }
                        })
                } else {
                    reject(err);
                }
            });
        });
    }
}
