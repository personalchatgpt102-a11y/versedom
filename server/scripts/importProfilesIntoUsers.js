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

const safeJsonParse = (value, fallback = []) => {
  try {
    if (!value) return fallback;

    if (Array.isArray(value)) {
      return value;
    }

    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return fallback;
  } catch {
    return fallback;
  }
};

const cleanText = (value) => {
  if (!value) return "";
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

    const [profiles] = await sql.query(`
      SELECT
        id,
        usid,
        cat,
        firstname,
        lastname,
        email,
        dob,
        nation,
        genre,
        img,
        coins,
        last_coin_update,
        beta_coins,
        token
      FROM profile
      WHERE email IS NOT NULL
        AND email != ''
    `);

    console.log("Profiles found in MySQL:", profiles.length);

    let updated = 0;
    let skipped = 0;

    for (const oldProfile of profiles) {
      const email = cleanText(oldProfile.email).toLowerCase();

      if (!email) {
        skipped++;
        continue;
      }

      const firstName = cleanText(oldProfile.firstname);
      const lastName = cleanText(oldProfile.lastname);
      const fullName = `${firstName} ${lastName}`.trim();

      const result = await User.findOneAndUpdate(
        {
          $or: [
            { email },
            { oldToken: oldProfile.token },
          ],
        },
        {
          email,

          profile: {
            oldProfileId: oldProfile.id,
            usid: oldProfile.usid,
            cat: oldProfile.cat || "alpha",
            firstName,
            lastName,
            fullName,
            dob: oldProfile.dob || null,
            nation: oldProfile.nation,
            genres: safeJsonParse(oldProfile.genre, []),
            image: oldProfile.img || "default.png",
            coins: Number(oldProfile.coins || 0),
            betaCoins: Number(oldProfile.beta_coins || 0),
            lastCoinUpdate: oldProfile.last_coin_update || null,
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

    console.log("Users updated with profile:", updated);
    console.log("Profiles skipped:", skipped);

    const testUser = await User.findOne({
      email: "goldenbutterfly890@gmail.com",
    }).select("-passwordHash");

    console.log("Test user after profile merge:");
    console.log(JSON.stringify(testUser, null, 2));

    await sql.end();
    await mongoose.disconnect();

    process.exit(0);
  } catch (error) {
    if (sql) {
      await sql.end();
    }

    console.error("Profile import failed:");
    console.error(error);

    process.exit(1);
  }
};

run();