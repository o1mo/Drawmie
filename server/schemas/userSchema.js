'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt-nodejs');
const SALT_WORK_FACTOR = 12;
const Promise = require('bluebird');

const UserSchema = new Schema({
  id: Schema.Types.ObjectId,
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  salt: String,
  photo: {type: String, default: 'https://s-media-cache-ak0.pinimg.com/236x/82/49/f2/8249f21c72876f28d1ac44cdb2023eb6.jpg'},
  sessions: [{type: [Schema.Types.ObjectId], ref: 'Session' }],
  boards: [{type: [Schema.Types.ObjectId], ref: 'Board' }]
});

UserSchema.index({ email: "text"});

UserSchema.methods.comparePasswords = function (candidatePassword) {
  let savedPassword = this.password;
  return new Promise(function (resolve, reject) {
    bcrypt.compare(candidatePassword, savedPassword, function (err, isMatch) {
      if (err) {
        reject(err);
      } else {
        resolve(isMatch);
      }
    });
  });
};

UserSchema.pre('save', function (next) {
  const user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) {
    return next();
  }

  // generate a salt
  bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
    if (err) {
      return next(err);
    }

    // hash the password along with our new salt
    bcrypt.hash(user.password, salt, null, function (err, hash) {
      if (err) {
        return next(err);
      }

      // override the cleartext password with the hashed one
      user.password = hash;
      user.salt = salt;
      next();
    });
  });
});

module.exports = mongoose.model('User', UserSchema);
