const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  borrowedBook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    default: null,
  },
});

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;