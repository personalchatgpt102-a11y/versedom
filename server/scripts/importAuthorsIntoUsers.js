import dotenv from "dotenv";
import mysql from "mysql2/promise";
import mongoose from "mongoose";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import User from "../models/User.js";

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

    const [authors] = await sql.query(`
      SELECT
        au.id AS authorId,
        au.pen_name AS penName,
        au.gender,
        au.bio,
        au.token AS authorToken,

        a.id AS authId,
        a.pid AS email,
        a.token AS userToken

      FROM author au
      LEFT JOIN authy a ON a.token = au.token
      WHERE au.token IS NOT NULL
        AND au.token != ''
    `);

    console.log("Authors found in MySQL:", authors.length);

    let updated = 0;
    let skipped = 0;

    for (const oldAuthor of authors) {
      const email = cleanText(oldAuthor.email).toLowerCase();
      const authorToken = cleanText(oldAuthor.authorToken);

      if (!email && !authorToken) {
        skipped++;
        continue;
      }

      const result = await User.findOneAndUpdate(
        {
          $or: [
            email ? { email } : null,
            authorToken ? { oldToken: authorToken } : null,
          ].filter(Boolean),
        },
        {
          $set: {
            authorProfile: {
              isAuthor: true,
              oldAuthorId: oldAuthor.authorId,
              penName: cleanText(oldAuthor.penName, "Unknown Author"),
              gender: cleanText(oldAuthor.gender),
              bio: cleanText(oldAuthor.bio),
              token: authorToken,
            },
          },
        },
        {
          returnDocument: "after",
        }
      );

      if (!result) {
        skipped++;
        continue;
      }

      updated++;
    }

    console.log("Users updated as authors:", updated);
    console.log("Authors skipped:", skipped);

    const sample = await User.findOne({
      "authorProfile.isAuthor": true,
    }).select("email authorProfile");

    console.log("Sample author user:");
    console.log(JSON.stringify(sample, null, 2));

    await sql.end();
    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    if (sql) {
      await sql.end();
    }

    console.error("Import authors into users failed:");
    console.error(error);

    process.exit(1);
  }
};

run();