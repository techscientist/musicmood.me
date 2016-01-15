var fs = require('fs');
var exec = require('child_process').exec;
var rs = require('request-promise');

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

function logBPM(filePath) {
    return new Promise((resolve, reject) => {
        if (!fileExists(filePath)) {
            reject(new Error(`File not found ${filePath}`));
            return;
        }
        var processFile = exec(`python ../python/processor.py ${filePath}`, (err, stdout, stderr) => {
            if (err) {
                reject(err);
            } else {
                resolve(parseFloat(stdout.replace('\n',''),10));
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

var ECHONEST_API_KEY = 'DJQBV7G7ZFUC7CZAZ';

module.exports = {
    LASTFM_API_KEY: '7d0a3a11116a3f166a5b71674e825355',
    LASTFM_API_SEC: '3d49048d35673db025c60e3062f5a57d',
    processTrack: (track) => {
        if (track) {
            var options = {
                    uri: `http://developer.echonest.com/api/v4/artist/terms?api_key=${ECHONEST_API_KEY}&format=json&name=${encodeURIComponent(track.artist['#text'])}`,
                    json: true
                },
                genres = [],
                terms;
            return rs(options)
                .then((data) => {
                    data.response.terms.forEach((item) => genres.push(item.name));
                    options.uri = `https://api.spotify.com/v1/search?query=${encodeURIComponent(track.name)}&offset=0&limit=50&type=track`;
                    return rs(options);
                })
                .then((data) => {
                    var preview_url = undefined;
                    data.tracks.items.forEach((item) => {
                        item.artists.forEach((artist) => {
                            if (artist.name === track.artist['#text']) {
                                preview_url = item.preview_url
                            }
                        });
                    });
                    if (preview_url) {
                        return preview_url;
                    } else {
                        return Promise.reject(new Error('\nfile not found for processing'));
                    }
                })
                .then((preview_url) => {
                    var filePath = `../tmp/${slugify(track.artist['#text'] + '-' + track.name)}.mp3`;
                    if (fileExists(filePath)) {
                        return logBPM(filePath);
                    } else {
                        return downloadFile(preview_url, filePath)
                            .then(() => logBPM(filePath));
                    }
                })
                .then((bpm) => {
                    return {
                        music: track.name,
                        artist: track.artist['#text'],
                        genres: genres,
                        bpm: bpm
                    };
                });
        }else{
            return Promise.reject(new Error('There`s no music.'));
        }
    }
}
