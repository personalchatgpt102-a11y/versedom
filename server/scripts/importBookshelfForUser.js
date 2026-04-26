import dotenv from "dotenv";
import mysql from "mysql2/promise";
import mongoose from "mongoose";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import User from "../models/User.js";
import Book from "../models/Book.js";
import Bookshelf from "../models/Bookshelf.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(__dirname, "../.env"),
});

const safeJsonParse = (value, fallback = []) => {
  try {
    if (!value) return fallback;

    if (Array.isArray(value)) {
      return value;
    }

    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const run = async () => {
  let sql;

  try {
    const email = process.argv[2] || "goldenbutterfly890@gmail.com";

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

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      console.log("User not found in MongoDB:", email);
      process.exit(1);
    }

    console.log("MongoDB user found:", user.email);

    const [rows] = await sql.query(
      `
      SELECT 
        a.pid AS email,
        a.token AS userToken,

        bs.id AS bookshelfId,
        bs.sid,
        bs.reading,
        bs.verses,
        bs.token AS bookshelfToken,
        bs.date AS bookshelfDate,

        b.id AS bookId,
        b.title,
        b.url,
        b.lang,
        b.novel,
        b.rating,
        b.genre,
        b.tags,
        b.views,
        b.likes,
        b.status,
        b.progress,
        b.synopsis,
        b.img,
        b.token AS bookToken,
        b.date AS bookDate,
        b.Reviewed_status AS reviewedStatus

      FROM authy a
      JOIN bookshelf bs ON bs.token = a.token
      LEFT JOIN books b ON b.url = bs.sid
      WHERE a.pid = ?
      ORDER BY bs.date DESC
      `,
      [email]
    );

    console.log("Bookshelf rows found in MySQL:", rows.length);

    let imported = 0;
    let missingBooks = 0;

    for (const row of rows) {
      let bookDoc = null;

      if (row.bookId) {
        bookDoc = await Book.findOneAndUpdate(
          { slug: row.url },
          {
            oldId: row.bookId,
            title: row.title,
            slug: row.url,
            language: row.lang,
            type: row.novel,
            rating: row.rating,
            genre: row.genre,
            tags: safeJsonParse(row.tags, []),
            views: Number(row.views || 0),
            likes: Number(row.likes || 0),
            status: row.status,
            progress: row.progress,
            description: row.synopsis,
            cover: row.img,
            oldToken: row.bookToken,
            oldDate: row.bookDate,
            reviewedStatus: row.reviewedStatus,
          },
          {
            upsert: true,
            new: true,
          }
        );
      } else {
        missingBooks++;
      }

      await Bookshelf.findOneAndUpdate(
        { oldId: row.bookshelfId },
        {
          oldId: row.bookshelfId,
          user: user._id,
          book: bookDoc ? bookDoc._id : null,
          sid: row.sid,
          reading: Number(row.reading || 1),
          verses: safeJsonParse(row.verses, []),
          oldToken: row.bookshelfToken,
          date: row.bookshelfDate,
        },
        {
          upsert: true,
          new: true,
        }
      );

      imported++;
    }

    console.log("Bookshelf imported into MongoDB:", imported);
    console.log("Rows with missing book details:", missingBooks);

    await sql.end();
    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    if (sql) {
      await sql.end();
    }

    console.error("Bookshelf import failed:");
    console.error(error);

    process.exit(1);
  }
};

run();