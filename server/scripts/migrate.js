import "dotenv/config";
import connectDB from "../config/db.js";
import connectMySQL from "../config/mysql.js";

import User from "../models/User.js";
import Book from "../models/Book.js";
import Bookshelf from "../models/Bookshelf.js";

const safeJsonParse = (value, fallback = []) => {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const migrateUsers = async (sql) => {
  console.log("Migrating users...");

  const [users] = await sql.query(`
    SELECT id, provider, pid, password, token, mode, time
    FROM authy
    WHERE provider = 'email'
      AND pid IS NOT NULL
      AND password IS NOT NULL
  `);

  for (const item of users) {
    await User.findOneAndUpdate(
      { email: item.pid.toLowerCase() },
      {
        oldId: item.id,
        provider: item.provider,
        email: item.pid.toLowerCase(),
        passwordHash: item.password,
        oldToken: item.token,
        mode: item.mode,
        oldCreatedTime: item.time,
      },
      { upsert: true, new: true }
    );
  }

  console.log(`Users migrated: ${users.length}`);
};

const migrateBooks = async (sql) => {
  console.log("Migrating books...");

  const [books] = await sql.query(`
    SELECT *
    FROM books
  `);

  for (const item of books) {
    await Book.findOneAndUpdate(
      { slug: item.slug },
      {
        oldId: item.id,
        title: item.title,
        slug: item.slug,
        language: item.language,
        type: item.type,
        rating: item.rating,
        genre: item.genre,
        tags: safeJsonParse(item.tags, []),
        views: Number(item.views || 0),
        description: item.description,
        cover: item.cover,
        oldToken: item.token,
        oldDate: item.date,
        status: item.status,
      },
      { upsert: true, new: true }
    );
  }

  console.log(`Books migrated: ${books.length}`);
};

const migrateBookshelf = async (sql) => {
  console.log("Migrating bookshelf...");

  const [items] = await sql.query(`
    SELECT id, sid, reading, verses, token, date
    FROM bookshelf
  `);

  let migrated = 0;
  let skipped = 0;

  for (const item of items) {
    const user = await User.findOne({ oldToken: item.token });
    const book = await Book.findOne({ slug: item.sid });

    if (!user) {
      skipped++;
      continue;
    }

    await Bookshelf.findOneAndUpdate(
      {
        user: user._id,
        sid: item.sid,
      },
      {
        oldId: item.id,
        user: user._id,
        book: book ? book._id : null,
        sid: item.sid,
        reading: Number(item.reading || 1),
        verses: safeJsonParse(item.verses, []),
        oldToken: item.token,
        date: item.date,
      },
      { upsert: true, new: true }
    );

    migrated++;
  }

  console.log(`Bookshelf migrated: ${migrated}`);
  console.log(`Bookshelf skipped: ${skipped}`);
};

const run = async () => {
  try {
    await connectDB();
    const sql = await connectMySQL();

    await migrateUsers(sql);
    await migrateBooks(sql);
    await migrateBookshelf(sql);

    await sql.end();

    console.log("Migration complete");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
};

run();