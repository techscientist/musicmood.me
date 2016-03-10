var express = require('express'),
    bodyParser = require('body-parser'),
    swig = require('swig'),
    consolidate = require('consolidate');

// Controllers <3
var tokenController = require('./controllers/token_controller'),
    moodsController = require('./controllers/moods_controller'),
    adminController = require('./controllers/admin_controller'),
    musicController = require('./controllers/music_controller'),
    authController = require('./controllers/auth_controller');

var app = express();
app
    .set('views', __dirname + '/views')
    .set('view engine', 'ejs')
    .use(bodyParser.urlencoded({
        extended: true
    }))
    .use(bodyParser.json())
    .use(express.static(__dirname + '/public'))
    .engine('html', consolidate.swig);


/* Routes */
app
    /* Token Controller */
    .get('/token', tokenController.token)
    .get('/callback', tokenController.callback)
    .get('/refresh', tokenController.refresh)
    /* Moods Controller + Root */
    .get('/', moodsController.index)
    .get('/moods', moodsController.list)
    .get('/mood/:artist/:song/', moodsController.moodForSong)
    /* Admin Controller */
    .get('/admin', adminController.index)
    .post('/update', adminController.update)
    /* Auth Controller */
    .get('/login', authController.login)
    .get('/auth', authController.auth)
    /* Music Controller */
    .post('/get_song', musicController.getSong)
    .get('/get_playlist/:mood', musicController.getPlaylistForMood);

// run app
app.listen(3000);
