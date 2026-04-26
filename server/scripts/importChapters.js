import dotenv from "dotenv";
import mysql from "mysql2/promise";
import mongoose from "mongoose";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Book from "../models/Book.js";
import Chapter from "../models/Chapter.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(__dirname, "../.env"),
});

const cleanText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  return String(value).trim();
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getChapterNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
};

const buildBookMap = async () => {
  const books = await Book.find().select("_id oldId slug url oldToken title").lean();

  const map = new Map();

  for (const book of books) {
    if (book.slug) map.set(String(book.slug), book);
    if (book.url) map.set(String(book.url), book);
    if (book.oldToken) map.set(String(book.oldToken), book);
  }

  return map;
};

const flushBatch = async (operations, label) => {
  if (operations.length === 0) return;

  await Chapter.bulkWrite(operations, {
    ordered: false,
  });

  console.log(`${label}: saved ${operations.length} chapters`);
};

const run = async () => {
  let sql;

  try {
    console.time("Total import time");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected:", mongoose.connection.name);

    sql = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE,
    });

    console.log("MySQL connected");

    const bookMap = await buildBookMap();

    console.log("Books loaded from MongoDB:", bookMap.size);

    const [rows] = await sql.query(`
      SELECT
        id,
        chapter,
        title,
        content,
        access,
        likes,
        sid,
        token,
        date
      FROM chapters
      ORDER BY sid ASC, chapter ASC, id ASC
    `);

    console.log("Chapters found in MySQL:", rows.length);

    const batchSize = 500;
    let operations = [];

    let imported = 0;
    let skippedNoBook = 0;
    let emptyContent = 0;

    const chapterMetaByBookSlug = new Map();

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];

      const sid = cleanText(row.sid);
      const token = cleanText(row.token);

      const book = bookMap.get(sid) || bookMap.get(token);

      if (!book) {
        skippedNoBook++;
        continue;
      }

      const bookSlug = book.slug || book.url || sid;
      const chapterNumber = getChapterNumber(row.chapter, index + 1);
      const title = cleanText(row.title, `Chapter ${chapterNumber}`);
      const content = cleanText(row.content);

      if (!content) {
        emptyContent++;
      }

      operations.push({
        updateOne: {
          filter: {
            bookSlug,
            chapterNumber,
          },
          update: {
            $set: {
              oldId: toNumber(row.id, null),
              book: book._id,
              bookSlug,
              chapterNumber,
              title,
              content,
              access: row.access || "",
              likes: toNumber(row.likes, 0),
              oldToken: token,
              oldDate: row.date || null,
            },
          },
          upsert: true,
        },
      });

      if (!chapterMetaByBookSlug.has(bookSlug)) {
        chapterMetaByBookSlug.set(bookSlug, []);
      }

      chapterMetaByBookSlug.get(bookSlug).push({
        number: chapterNumber,
        title,
      });

      imported++;

      if (operations.length >= batchSize) {
        await flushBatch(operations, `Progress ${imported}/${rows.length}`);
        operations = [];
      }
    }

    await flushBatch(operations, `Final progress ${imported}/${rows.length}`);

    console.log("Updating chapter metadata inside books...");

    const bookMetaOps = [];

    for (const [bookSlug, chapters] of chapterMetaByBookSlug.entries()) {
      const sortedChapters = chapters
        .sort((a, b) => a.number - b.number)
        .filter((chapter, index, array) => {
          return index === 0 || chapter.number !== array[index - 1].number;
        });

      bookMetaOps.push({
        updateOne: {
          filter: {
            $or: [{ slug: bookSlug }, { url: bookSlug }],
          },
          update: {
            $set: {
              totalChapters: sortedChapters.length,
              chapters: sortedChapters,
            },
          },
        },
      });
    }

    if (bookMetaOps.length > 0) {
      await Book.bulkWrite(bookMetaOps, {
        ordered: false,
      });
    }

    console.log("Chapters imported into MongoDB:", imported);
    console.log("Skipped because book was not found:", skippedNoBook);
    console.log("Chapters with empty content:", emptyContent);
    console.log("Books updated with chapter list:", bookMetaOps.length);

    await sql.end();
    await mongoose.disconnect();

    console.timeEnd("Total import time");
    process.exit(0);
  } catch (error) {
    if (sql) await sql.end();

    console.error("Import chapters failed:");
    console.error(error);

    process.exit(1);
  }
};

run();