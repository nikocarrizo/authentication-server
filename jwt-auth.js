var User = require('./user-model');
var jwt = require('jsonwebtoken');
var moment = require('moment');
var options = require('./config.js');


module.exports = function (req, res, next) {
    // route middleware to authenticate and check token
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.param('token') || req.headers['x-access-token'];

    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, options.secret, function (err, decoded) {
            if (err) {
                if (err.name = "TokenExpiredError"){
                     return res.json({ success: false, message: 'Token Expired. Failed to authenticate. ' });
                }
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                req.decoded = decoded;
                next();
            }
        });

    } else {

        // if there is no token
        // return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
};