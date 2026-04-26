import express from "express";
import Book from "../models/Book.js";
import Chapter from "../models/Chapter.js";
import authMiddleware from "../middleware/authMiddleware.js";
import authorMiddleware from "../middleware/authorMiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, authorMiddleware, async (req, res) => {
  return res.json({
    author: req.user.authorProfile,
    user: {
      id: req.user._id,
      email: req.user.email,
      profile: req.user.profile || {},
    },
  });
});

router.get("/my-books", authMiddleware, authorMiddleware, async (req, res) => {
  try {
    const authorToken = req.user.authorProfile?.token;
    const penName = req.user.authorProfile?.penName;

    const query = {
      $or: [
        { "author.token": authorToken },
        { "author.penName": penName },
      ],
    };

    const books = await Book.find(query).sort({
      oldId: -1,
    }).lean();

    const slugCandidates = [
      ...new Set(
        books
          .flatMap((book) => [book.slug, book.url])
          .filter(Boolean)
      ),
    ];

    const chapterCountsRaw =
      slugCandidates.length > 0
        ? await Chapter.aggregate([
            {
              $match: {
                bookSlug: { $in: slugCandidates },
              },
            },
            {
              $group: {
                _id: "$bookSlug",
                count: { $sum: 1 },
              },
            },
          ])
        : [];

    const chapterCountMap = new Map(
      chapterCountsRaw.map((item) => [String(item._id), Number(item.count || 0)])
    );

    const booksWithChapters = books.map((book) => {
      const countBySlug = chapterCountMap.get(String(book.slug || "")) || 0;
      const countByUrl = chapterCountMap.get(String(book.url || "")) || 0;

      return {
        ...book,
        chapterCount: Math.max(countBySlug, countByUrl),
      };
    });

    return res.json({
      count: booksWithChapters.length,
      books: booksWithChapters,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get author books",
      error: error.message,
    });
  }
});

export default router;
