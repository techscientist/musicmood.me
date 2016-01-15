var http = require('http');
var https = require('https');
var fs = require('fs');
var exec = require('child_process').exec;

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

module.exports = {

    LASTFM_API_KEY: '7d0a3a11116a3f166a5b71674e825355',
    LASTFM_API_SEC: '3d49048d35673db025c60e3062f5a57d',

    processTrack: function (track) {
        if (track) {
            http.get({
                hostname: 'developer.echonest.com',
                path: '/api/v4/artist/terms?api_key=DJQBV7G7ZFUC7CZAZ&format=json&name=' + encodeURIComponent(track.artist["#text"]),
            }, (response) => {

                var data = "";
                response.on("data", function(chunk) {
                    data += chunk;
                });
                response.on("end", function() {
                    var genres = [];
                    var terms = JSON.parse(data).response.terms;
                    terms.forEach(function(item) {
                        genres.push(item.name);
                    });

                    data = '';

                    https.get({
                        hostname: 'api.spotify.com',
                        path: '/v1/search?query=' + encodeURIComponent(track.name) + '&offset=0&limit=50&type=track'
                    }, (response) => {
                        response.on("data", function(chunk) {
                            data += chunk;
                        });
                        response.on("end", function() {
                            var tracks = JSON.parse(data).tracks.items;
                            var preview_url = undefined;
                            tracks.forEach(function(item) {
                                var artists = item.artists;
                                artists.forEach(function(artist) {
                                    if (artist.name === track.artist["#text"]) {
                                        preview_url = item.preview_url
                                    }
                                });
                            });

                            if (preview_url) {
                                var dir = 'mkdir -p ../tmp';
                                var child = exec(dir, function(err, stdout, stderr) {
                                    if (err) {
                                        throw err;
                                    } else {
                                        var file = fs.createWriteStream('../tmp/' + slugify(track.artist["#text"] + track.name) + '.mp3');
                                        https.get({
                                            hostname: 'p.scdn.co',
                                            path: preview_url.replace('https://p.scdn.co', '')
                                        }, (response) => {
                                            response.on("data", function(data) {
                                                file.write(data);
                                            });
                                            response.on("end", function() {
                                                file.end();

                                                var processFile = exec('python ../python/tempo-beats.py ../tmp/' + slugify(track.artist["#text"] + track.name) + '.mp3', function(err, stdout, stderr) {
                                                    if (err) {
                                                        throw err;
                                                    } else {
                                                        var bpm = stdout.replace('\n', '');
                                                        console.log('\nMusic:', track.name, '\nArist: ' + track.artist["#text"], ' \nGenres: (' + genres.toString() + ') \nBPM: ' + bpm);
                                                    }
                                                });

                                            })
                                        })
                                    }
                                });

                            } else {
                                console.log('\nfile not found for processing');
                            }
                        });
                    });
                });
            });
        } else {
            console.log('There`s no music');
        }
    }
}
