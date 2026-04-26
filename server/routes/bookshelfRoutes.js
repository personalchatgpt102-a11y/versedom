import express from "express";
import Bookshelf from "../models/Bookshelf.js";
import Book from "../models/Book.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const items = await Bookshelf.find({ user: req.user._id })
      .populate("book")
      .sort({ date: -1 });

    const missingSids = [
      ...new Set(items.filter((item) => !item.book && item.sid).map((item) => item.sid)),
    ];

    let fallbackBookMap = new Map();

    if (missingSids.length > 0) {
      const fallbackBooks = await Book.find({
        $or: [{ slug: { $in: missingSids } }, { url: { $in: missingSids } }],
      }).lean();

      fallbackBookMap = new Map();

      for (const fallbackBook of fallbackBooks) {
        if (fallbackBook.slug) {
          fallbackBookMap.set(fallbackBook.slug, fallbackBook);
        }

        if (fallbackBook.url) {
          fallbackBookMap.set(fallbackBook.url, fallbackBook);
        }
      }
    }

    const books = items.map((item) => {
      if (item.book || !item.sid) {
        return item;
      }

      const fallbackBook = fallbackBookMap.get(item.sid);

      if (!fallbackBook) {
        return item;
      }

      const normalized = item.toObject();
      normalized.book = fallbackBook;
      return normalized;
    });

    res.json({
      count: books.length,
      books,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get bookshelf",
      error: error.message,
    });
  }
});

export default router;
