import dotenv from "dotenv";
import mysql from "mysql2/promise";
import mongoose from "mongoose";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Book from "../models/Book.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(__dirname, "../.env"),
});

const cleanText = (value, fallback = "") => {
  if (!value) return fallback;
  return String(value).trim();
};

const run = async () => {
  let sql;

  try {
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

    const [rows] = await sql.query(`
      SELECT
        b.id AS bookId,
        b.title,
        b.url,
        b.token AS bookToken,

        a.id AS authorId,
        a.pen_name AS penName,
        a.gender,
        a.bio,
        a.token AS authorToken

      FROM books b
      LEFT JOIN author a ON a.token = b.token
      WHERE b.url IS NOT NULL
        AND b.url != ''
    `);

    console.log("Book author rows found:", rows.length);

    let updated = 0;
    let missingAuthors = 0;

    for (const row of rows) {
      const slug = cleanText(row.url);

      if (!slug) continue;

      if (!row.authorId) {
        missingAuthors++;
      }

      const result = await Book.findOneAndUpdate(
        {
          $or: [{ slug }, { url: slug }],
        },
        {
          $set: {
            slug,
            url: slug,
            author: {
              oldId: row.authorId || null,
              penName: cleanText(row.penName, "Unknown Author"),
              gender: row.gender || "",
              bio: row.bio || "",
              token: row.authorToken || row.bookToken || "",
            },
          },
        },
        {
          returnDocument: "after",
        }
      );

      if (result) {
        updated++;
      }
    }

    console.log("Books updated with author:", updated);
    console.log("Books with missing author:", missingAuthors);

    const sample = await Book.findOne().select("title slug author");

    console.log("Sample book:");
    console.log(JSON.stringify(sample, null, 2));

    await sql.end();
    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    if (sql) {
      await sql.end();
    }

    console.error("Author import failed:");
    console.error(error);

    process.exit(1);
  }
};

run();