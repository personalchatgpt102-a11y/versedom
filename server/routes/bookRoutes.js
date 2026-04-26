import express from "express";
import Book from "../models/Book.js";
import Chapter from "../models/Chapter.js";
import Bookshelf from "../models/Bookshelf.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

const getChapterNumber = (chapter) => {
  if (typeof chapter === "number") return chapter;
  if (typeof chapter === "string") return Number(chapter);

  return (
    chapter?.chapter ||
    chapter?.chapterNumber ||
    chapter?.number ||
    chapter?.id ||
    chapter?.index
  );
};

const normalizeReadNumbers = (verses = []) => {
  return [
    ...new Set(
      verses
        .map((chapter) => Number(getChapterNumber(chapter)))
        .filter((chapter) => Number.isFinite(chapter) && chapter > 0)
    ),
  ].sort((a, b) => a - b);
};

const resolveBook = async (slugOrUrl) => {
  return Book.findOne({
    $or: [{ slug: slugOrUrl }, { url: slugOrUrl }],
  });
};

const resolveUserFromAuthHeader = async (authorizationHeader) => {
  try {
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authorizationHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return User.findById(decoded.id).select("_id email");
  } catch {
    return null;
  }
};

const resolveBookshelfItem = async (userId, book, slugOrUrl) => {
  const sidCandidates = [slugOrUrl, book?.slug, book?.url].filter(Boolean);

  return Bookshelf.findOne({
    user: userId,
    $or: [{ book: book?._id || null }, { sid: { $in: sidCandidates } }],
  });
};

const normalizeBookPayload = (book) => {
  return {
    _id: book._id,
    oldId: book.oldId,
    title: book.title,
    slug: book.slug,
    url: book.url,
    genre: book.genre,
    rating: book.rating,
    language: book.language,
    type: book.type,
    views: book.views,
    likes: book.likes,
    status: book.status,
    progress: book.progress,
    description: book.description || book.synopsis || "",
    cover: book.cover || book.img || "",
    author: {
      oldId: book.author?.oldId || null,
      penName: book.author?.penName || "Unknown Author",
      gender: book.author?.gender || "",
      bio: book.author?.bio || "",
      token: book.author?.token || "",
    },
  };
};

const getBookSlugCandidates = (book, fallbackSlug) => {
  return [book.slug, book.url, fallbackSlug].filter(Boolean);
};

router.get("/", async (req, res) => {
  try {
    const search = req.query.search || "";
    const genre = req.query.genre || "all";
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 24);

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { genre: { $regex: search, $options: "i" } },
        { "author.penName": { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (genre !== "all") {
      query.genre = { $regex: `^${genre}$`, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      Book.find(query).sort({ oldId: -1 }).skip(skip).limit(limit),
      Book.countDocuments(query),
    ]);

    return res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      books,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get books",
      error: error.message,
    });
  }
});

router.get("/genres", async (_req, res) => {
  try {
    const genres = await Book.distinct("genre");

    const cleaned = genres
      .filter(Boolean)
      .map((genre) => String(genre).trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));

    return res.json({ genres: cleaned });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get genres",
      error: error.message,
    });
  }
});

router.get("/:slug/chapters", async (req, res) => {
  try {
    const slug = req.params.slug;
    const book = await resolveBook(slug);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const slugCandidates = getBookSlugCandidates(book, slug);

    const chapters = await Chapter.find({
      bookSlug: { $in: slugCandidates },
    })
      .sort({ chapterNumber: 1 })
      .select("_id chapterNumber title")
      .lean();

    const user = await resolveUserFromAuthHeader(req.headers.authorization);
    const shelfItem = user
      ? await resolveBookshelfItem(user._id, book, slug)
      : null;

    const currentChapter = Number(shelfItem?.reading || 1);
    const readChapters = normalizeReadNumbers(shelfItem?.verses || []);

    return res.json({
      slug: book.slug || book.url || slug,
      book: normalizeBookPayload(book),
      progress: {
        currentChapter,
        readChapters,
      },
      totalChapters: chapters.length,
      chapters: chapters.map((chapter) => ({
        id: chapter._id,
        number: chapter.chapterNumber,
        title: chapter.title || `Chapter ${chapter.chapterNumber}`,
      })),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get chapters",
      error: error.message,
    });
  }
});

router.get("/:slug/chapters/:chapter", async (req, res) => {
  try {
    const slug = req.params.slug;
    const chapterNumber = Number(req.params.chapter);

    if (!Number.isFinite(chapterNumber) || chapterNumber < 1) {
      return res.status(400).json({ message: "Invalid chapter number" });
    }

    const book = await resolveBook(slug);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const slugCandidates = getBookSlugCandidates(book, slug);

    const chapter = await Chapter.findOne({
      bookSlug: { $in: slugCandidates },
      chapterNumber,
    }).lean();

    if (!chapter) {
      return res.status(404).json({
        message: "Chapter not found. Run node scripts/importChapters.js first.",
      });
    }

    return res.json({
      book: normalizeBookPayload(book),
      chapter: {
        id: chapter._id,
        number: chapter.chapterNumber,
        title: chapter.title || `Chapter ${chapter.chapterNumber}`,
        content: chapter.content || "",
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get chapter",
      error: error.message,
    });
  }
});

router.patch("/:slug/progress", async (req, res) => {
  try {
    const user = await resolveUserFromAuthHeader(req.headers.authorization);

    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const slug = req.params.slug;
    const chapter = Number(req.body?.chapter);

    if (!Number.isFinite(chapter) || chapter < 1) {
      return res.status(400).json({ message: "Invalid chapter" });
    }

    const book = await resolveBook(slug);

    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    const sid = book.slug || book.url || slug;

    let item = await resolveBookshelfItem(user._id, book, slug);

    if (!item) {
      item = await Bookshelf.create({
        user: user._id,
        book: book._id,
        sid,
        reading: chapter,
        verses: [chapter],
        date: new Date(),
      });
    } else {
      const readNumbers = normalizeReadNumbers([
        ...(item.verses || []),
        chapter,
      ]);

      item.book = item.book || book._id;
      item.sid = item.sid || sid;
      item.reading = Math.max(Number(item.reading || 1), chapter);
      item.verses = readNumbers;
      item.date = new Date();

      await item.save();
    }

    return res.json({
      message: "Progress updated",
      progress: {
        currentChapter: item.reading,
        readChapters: normalizeReadNumbers(item.verses || []),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update progress",
      error: error.message,
    });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const book = await resolveBook(req.params.slug);

    if (!book) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    return res.json(normalizeBookPayload(book));
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get book",
      error: error.message,
    });
  }
});

export default router;