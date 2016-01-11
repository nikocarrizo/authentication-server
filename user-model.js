var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcryptjs'),
    SALT_WORK_FACTOR = 10;

var UserSchema = new Schema({
    email: { type: String, required: true, index: { unique: true } },
    password: { type: String, requireD: true }
});

//password hashing middleware
UserSchema.pre('save', function (next) {
    var user = this;
    if (!user.isModified('password')) return next();
    //generate the salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);
        //hash the password with the salt
        bcrypt.hash(user.password, salt, function (err, hash) {
            user.password = hash;
            next();
        });
    });
});

//password verification
UserSchema.methods.comparePassword = function(pw, cb){
    bcrypt.compare(pw, this.password, function(err, isMatch){
        if (err) return cb(err);
        cb(null, isMatch);
    })
}

module.exports = mongoose.model('User', UserSchema);
