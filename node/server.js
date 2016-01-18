var express = require('express');
var app = express();

app.get('/', function(req, res) {
    res.send('hello express');
});

app.get('/who/:name?/:surname?/', function(req, res) {
    var name = req.params.name;
    var surname = req.params.surname;
    res.send(`hello express ${name} ${surname}`);
});

app.get('*', function(req, res) {
    res.send('bad route / 404');
});

var server = app.listen(3000, function() {
    console.log('server is on');
});
