var fs = require('fs');
var exec = require('child_process').exec;
var execSync = require('child_process').execSync;
var rs = require('request-promise');
var mongo = require('mongodb').MongoClient;

var mongo_server = 'mongodb://localhost:27017/spotify-visualizer',
    ECHONEST_API_KEY = 'DJQBV7G7ZFUC7CZAZ',
    duration = 0,
    fileType = 'mp3',
    beats_per_second = 50,
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
            reject(`File not found ${filePath}`);
        }
        var processFile = exec(`python ../python/processor.py ${filePath} ${duration} ${beats_per_second}`, {
            maxBuffer: 1024 * 10000
        }, (err, stdout, stderr) => {
            if (err) {
                reject(`logBPM ${err}`);
            } else {
                var json = JSON.parse(stdout.replace('\n', ''));
                if (json.harper.length === 0) {
                    reject('ERROR_PROCESSING_FILE');
                } else {
                    resolve(json);
                }
            }
        });
    });
}

function downloadFile(preview_url, filePath) {
    return new Promise((resolve, reject) => {
        rs.get(preview_url)
            .on('error', (err) => reject(`downloadFile ${err}`))
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
                        var file = `../tmp/${info.slug}.${fileType}`;
                        fs.exists(file, (exists) => {
                            if (exists) {
                                fs.unlink(file);
                            }
                        });
                        resolve(info);
                    } else {
                        reject(`createTrack 1 ${err}`);
                    }
                    db.close();
                });
            } else {
                reject(`createTrack 2 ${err}`);
            }
        });
    })
}

module.exports = {
    LASTFM_API_KEY: '7d0a3a11116a3f166a5b71674e825355',
    LASTFM_API_SEC: '3d49048d35673db025c60e3062f5a57d',
    BEATS_PER_SECOND: beats_per_second,
    MONGO_SERVER: mongo_server,
    processTrack: (track, user) => {
        if (track && !!track.name) {
            return new Promise((resolve, reject) => {
                mongo.connect(mongo_server, (err, db) => {
                    if (!err) {
                        var find = db.collection('songs')
                            .find({
                                slug: slugify(track.artist['#text'] + '-' + track.name),
                                beats_per_second: beats_per_second
                            })
                            .toArray((err, items) => {
                                if (items.length > 0) {
                                    if ('@attr' in track) {
                                        if (track['@attr'].nowplaying) {
                                            resolve(items[0]);
                                        } else {
                                            reject('OLD_SONG');
                                        }
                                    } else {
                                        reject('OLD_SONG');
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
                                                    options.uri = `https://api.spotify.com/v1/search?query=${encodeURIComponent(track.name+' '+track.artist['#text'])}&offset=0&limit=50&type=track`;
                                                    return rs(options);
                                                })
                                        })
                                        .then((data) => {
                                            var preview_url = undefined;
                                            if (!!data && !!data.tracks && !!data.tracks.items) {
                                                data.tracks.items.forEach((item) => {
                                                    item.artists.forEach((artist) => {
                                                        var current_name = artist.name.toLowerCase().trim();
                                                        var playing_name = track.artist['#text'].toLowerCase().trim();
                                                        if (current_name.substring(0, 3) === "the") {
                                                            current_name = current_name.substring(3).trim();
                                                        }
                                                        if (playing_name.substring(0, 3) === "the") {
                                                            playing_name = playing_name.substring(3).trim();
                                                        }
                                                        if (current_name === playing_name) {
                                                            preview_url = item.preview_url;
                                                            duration = item.duration_ms;
                                                            fileType = 'mp3';
                                                        }
                                                    });
                                                });

                                                if (preview_url) {
                                                    return preview_url;
                                                } else {
                                                    options.uri = `https://itunes.apple.com/search?term=${encodeURIComponent(track.name+' '+track.artist['#text'])}&entity=musicTrack`;
                                                    return rs(options)
                                                        .then((data) => {
                                                            if (!!data && !!data.results) {
                                                                data.results.forEach((item) => {
                                                                    var current_name = item.artistName.toLowerCase().trim();
                                                                    var playing_name = track.artist['#text'].toLowerCase().trim();
                                                                    if (current_name.substring(0, 3) === "the") {
                                                                        current_name = current_name.substring(3).trim();
                                                                    }
                                                                    if (playing_name.substring(0, 3) === "the") {
                                                                        playing_name = playing_name.substring(3).trim();
                                                                    }
                                                                    if (current_name === playing_name) {
                                                                        duration = item.trackTimeMillis;
                                                                        preview_url = item.previewUrl;
                                                                        fileType = 'm4a';
                                                                    }
                                                                });
                                                                if (preview_url) {
                                                                    return preview_url;
                                                                } else {
                                                                    reject('NO_PREVIEW_FROM_APPLE');
                                                                }
                                                            } else {
                                                                reject('NO_PREVIEW_FROM_APPLE');
                                                            }
                                                        })
                                                }
                                            } else {
                                                reject('NO_PREVIEW_FROM_SPOTIFY');
                                            }

                                        })
                                        .then((preview_url) => {
                                            if (preview_url) {
                                                createFolder();
                                                var filePath = `../tmp/${slugify(track.artist['#text'] + '-' + track.name)}.${fileType}`;
                                                if (fileExists(filePath)) {
                                                    return logBPM(filePath);
                                                } else {
                                                    return downloadFile(preview_url, filePath)
                                                        .then(() => {
                                                            return logBPM(filePath);
                                                        });
                                                }
                                            } else {
                                                reject('NO_PREVIEW_FROM_SPOTIFY');
                                            }
                                        })
                                        .then((json) => {
                                            if (json) {
                                                var info = {
                                                    slug: slugify(track.artist['#text'] + '-' + track.name),
                                                    name: track.name,
                                                    artist: track.artist['#text'],
                                                    genres: genres,
                                                    bpm: json.bpm,
                                                    harper: json.harper,
                                                    duration: duration,
                                                    energy: energy,
                                                    valence: valence,
                                                    user: user,
                                                    beats_per_second: beats_per_second
                                                }
                                                createTrack(info)
                                                    .then((info) => {
                                                        resolve(info);
                                                    });
                                            } else {
                                                reject('NO_JSON');
                                            }
                                        });
                                }
                                db.close();
                            });
                    } else {
                        reject(`processTrack ${err}`);
                    }
                });
            })
        } else {
            return Promise.reject('NO_MUSIC');
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
                                db.close();
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
                                    db.close();
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
                            db.close();
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
    },
    logger: (string) => {
        console.log(string);
    }
}
