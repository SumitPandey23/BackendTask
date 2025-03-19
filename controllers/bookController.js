const User = require("../models/userSchema");
const Book = require("../models/bookSchema");

exports.borrowBook = async (req, res) => {
  const { bookName, email } = req.body;

  if (!bookName || !email) {
    return res.status(400).json({ error: "Book Name and Email are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const existingBook = await Book.findOne({ userId: user._id });
    if (existingBook) {
      return res
        .status(400)
        .json({ error: "You can only borrow one book at a time." });
    }

    const book = await Book.findOne({ name: bookName });
    if (!book) {
      return res.status(404).json({ error: "Book not found." });
    }

    if (book.rented) {
      return res.status(400).json({ error: "This book is already rented." });
    }
    book.rented = true;
    book.userId = user._id;
    await book.save();

    user.borrowedBook = book._id;
    await user.save();

    res.status(200).json({
      message: "Book borrowed successfully.",
      book: {
        name: book.name,
        rented: book.rented,
      },
      user: {
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
  }
};

exports.returnBook = async (req, res) => {
  const { bookName, email } = req.body;

  if (!bookName || !email) {
    return res.status(400).json({ error: "Book Name and Email are required." });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const book = await Book.findOne({ name: bookName });
    if (!book) {
      return res.status(404).json({ error: "Book not found." });
    }

    if (book.userId.toString() !== user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You cannot return a book you haven't borrowed." });
    }

    book.rented = false;
    book.userId = null;
    await book.save();

    user.borrowedBook = null;
    await user.save();

    res.status(200).json({
      message: "Book returned successfully.",
      book: {
        name: book.name,
        rented: book.rented,
      },
      user: {
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
  }
};

exports.addBook = async (req, res) => {
  const { name, rented, userId } = req.body;

  if (!name || !req.file) {
    return res.status(400).json({ error: "Book name and image are required." });
  }

  try {
    const newBook = new Book({
      name,
      coverImage: req.file.path,
      rented: rented || false,
      userId: userId || null,
    });

    await newBook.save();

    res.status(201).json({
      message: "Book added successfully",
      book: {
        id: newBook._id,
        name: newBook.name,
        coverImage: newBook.coverImage,
        rented: newBook.rented,
        userId: newBook.userId,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong while adding the book." });
  }
};
