const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  coverImage: {
    type: String,
    required: true,
  },
  rented: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    default: null,
  },
});

const Book = mongoose.model('Book', bookSchema, 'books');

module.exports = Book;