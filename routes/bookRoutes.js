const express = require("express");
const bookController = require("../controllers/bookController");
const upload = require("../utils/multerConfig");

const router = express.Router();

router.post("/borrow-book", bookController.borrowBook);
router.post("/return-book", bookController.returnBook);
router.post("/add-book", upload.single("coverImage"), bookController.addBook);

module.exports = router;
