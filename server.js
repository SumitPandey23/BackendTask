const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("./models/userSchema");
const Book = require("./models/bookSchema");
const multer = require("multer");
const path = require("path");

const app = express();

app.use(express.json());

dotenv.config();

mongoose
  .connect(process.env.MONGODBURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ error: "Name, email, and password are required." });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: "Email is already in use." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.post("/borrow-book", async (req, res) => {
  const { bookName, email } = req.body;

  if (!bookName || !email) {
    return res.status(400).json({ error: "Book Name and Email are required." });
  }

  try {
    const user = await User.findOne({ email: email });
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
});

app.post("/return-book", async (req, res) => {
  const { bookId, userId } = req.body;

  if (!bookId || !userId) {
    return res.status(400).json({ error: "Book ID and User ID are required." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ error: "Book not found." });
    }

    if (book.userId.toString() !== userId) {
      return res
        .status(400)
        .json({ error: "You cannot return a book you haven't borrowed." });
    }

    book.rented = false;
    book.userId = null;
    await book.save();

    res.status(200).json({
      message: "Book returned successfully.",
      book,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong." });
  }
});

app.post("/add-book", upload.single("coverImage"), async (req, res) => {
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
    res
      .status(500)
      .json({ error: "Something went wrong while adding the book." });
  }
});

app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("Hello, MongoDB World!");
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
