var express = require('express');
var app = express();
var morgan = require('morgan');
var bodyParser = require('body-parser');
var multer = require('multer');
var jwt = require('jsonwebtoken');
var mongoose = require('mongoose'),
    User = require('./user-model');
var options = require('./config');
var jwtauth = require('./jwt-auth');
var moment = require('moment');
var apiRoutes = express.Router(); 

//connect to database
console.log('Bootin up');

mongoose.connect(options.database, function (err) {
    if (err) throw err;

    console.log('Successfully connected to MongoDB');
});

//setup app
app.set('port', process.env.PORT || 3001);
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer({dest:'./uploads/'}).single('singleInputFileName'));
app.set('superSecret', options.secret);

app.use(function (req, res, next) {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://192.168.1.5:8080');
    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// create application/json parser
var jsonParser = bodyParser.json()
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

// get an instance of the router for api routes

//default route
app.get('/', function (req, res) {
    res.send('Hello! The auth API is at http://localhost:' + app.get('port') + '/auth');
});

apiRoutes.post('/authenticate', function (req, res) {
    // find the user
    User.findOne({ email: req.body.email }, function (err, user) {
        if (err) throw err;

        if (!user) {
            res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {
            // check if password matches
            if (user.password != req.body.password) {
                res.json({ success: false, message: 'Authentication failed. Wrong password.' });
            } else {

                // if user is found and password is right
                // create a token
                var token = jwt.sign(user, app.get('superSecret'), {
                    expiresIn: 60 // expires in 24 hours
                });
                
                //store session token in redis.

                // return the information including token as JSON
                res.json({
                    success: true,
                    message: 'Enjoy your token!',
                    token: token
                });
            }
        }
    });
});

apiRoutes.post('/register', function (req, res) {
    User.findOne({ email: req.body.email, password: req.body.password }, function (err, user) {
        if (err) {
            res.json({
                type: false,
                data: "Error occured: " + err
            });
        } else {
            if (user) {
                res.json({
                    type: false,
                    data: "User already exists!"
                });
            } else {
                var newUser = new User({
                    email: req.body.email,
                    password: req.body.password,
                });
                newUser.save(function (err, user) {
                    if (err) throw err;

                    console.log('User saved successfully');
                    res.json({ success: true });
                })
            }
        }
    });
});

apiRoutes.post('/test', function (req, res) {
    // create a sample user
    var usr = new User({
        email: 'Tester@dude.com',
        password: 'password'
    });

    // save the sample user
    usr.save(function (err) {
        if (err) throw err;

        console.log('User saved successfully');
        res.json({ success: true });
    });
});

apiRoutes.get('/', [jsonParser, jwtauth], function (req, res) {
    res.json({ message: 'Welcome to the coolest API on earth!' });
});

apiRoutes.get('/users', function (req, res) {
    User.find({}, function (err, users) {
        res.json(users);
    });
});

apiRoutes.get('/check', [jsonParser, jwtauth], function (req, res) {
    res.json(req.decoded);
});

app.use('/auth', apiRoutes);

process.on('uncaughtException', function (err) {
    console.log('error ' + err);
});

app.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});