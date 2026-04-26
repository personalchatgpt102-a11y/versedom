import express from "express";
import Bookshelf from "../models/Bookshelf.js";
import Book from "../models/Book.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const normalizeBook = (book) => {
  if (!book) return null;

  return {
    _id: book._id,
    oldId: book.oldId,
    title: book.title,
    slug: book.slug,
    url: book.url,
    language: book.language,
    type: book.type,
    rating: book.rating,
    genre: book.genre,
    tags: book.tags,
    views: book.views,
    likes: book.likes,
    status: book.status,
    progress: book.progress,
    description: book.description,
    cover: book.cover || book.img || "",
    img: book.img || "",
    author: {
      oldId: book.author?.oldId || null,
      penName: book.author?.penName || "Unknown Author",
      gender: book.author?.gender || "",
      bio: book.author?.bio || "",
      token: book.author?.token || "",
    },
  };
};

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const items = await Bookshelf.find({
      user: req.user._id,
    })
      .populate("book")
      .sort({ date: -1 });

    const missingSids = [
      ...new Set(
        items
          .filter((item) => !item.book && item.sid)
          .map((item) => item.sid)
      ),
    ];

    let fallbackBookMap = new Map();

    if (missingSids.length > 0) {
      const fallbackBooks = await Book.find({
        $or: [
          { slug: { $in: missingSids } },
          { url: { $in: missingSids } },
        ],
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
      const plainItem = item.toObject();

      let resolvedBook = plainItem.book;

      if (!resolvedBook && plainItem.sid) {
        resolvedBook = fallbackBookMap.get(plainItem.sid) || null;
      }

      return {
        _id: plainItem._id,
        oldId: plainItem.oldId,
        user: plainItem.user,
        sid: plainItem.sid,
        reading: plainItem.reading,
        verses: plainItem.verses || [],
        oldToken: plainItem.oldToken,
        date: plainItem.date,
        createdAt: plainItem.createdAt,
        updatedAt: plainItem.updatedAt,
        book: normalizeBook(resolvedBook),
      };
    });

    return res.json({
      count: books.length,
      books,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get bookshelf",
      error: error.message,
    });
  }
});

export default router;
