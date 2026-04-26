import "dotenv/config";
import fs from "node:fs";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/User.js";
import Bookshelf from "../models/Bookshelf.js";

const csvPath = process.argv[2];

if (!csvPath) {
  console.error("Usage: node scripts/import-authy-csv.js <path-to-authy.csv>");
  process.exit(1);
}

const parseCsv = (text) => {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        value += '"';
        index++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(value);
      value = "";
    } else if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
    } else if (char !== "\r") {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  const headers = rows.shift();
  return rows
    .filter((item) => item.length === headers.length)
    .map((item) =>
      Object.fromEntries(headers.map((header, index) => [header, item[index]]))
    );
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const run = async () => {
  console.log(`Reading authy CSV: ${csvPath}`);
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));

  const users = rows
    .filter((row) => row.provider === "email" && row.pid && row.password)
    .map((row) => ({
      oldId: toNumber(row.id),
      provider: row.provider,
      email: row.pid.toLowerCase().trim(),
      passwordHash: row.password,
      oldToken: row.token,
      mode: toNumber(row.mode),
      oldCreatedTime: row.time,
    }));

  await connectDB();

  console.log("Removing existing users...");
  await User.deleteMany({});

  if (users.length) {
    await User.insertMany(users, { ordered: false });
  }

  const insertedUsers = await User.find({}, { oldToken: 1 }).lean();
  const userByToken = new Map(
    insertedUsers
      .filter((user) => user.oldToken)
      .map((user) => [user.oldToken, user._id])
  );

  let relinkedBookshelves = 0;
  const shelves = await Bookshelf.find({}, { oldToken: 1 }).lean();

  for (const shelf of shelves) {
    const userId = userByToken.get(shelf.oldToken) ?? null;
    await Bookshelf.updateOne({ _id: shelf._id }, { $set: { user: userId } });
    if (userId) relinkedBookshelves++;
  }

  console.log(`CSV rows parsed: ${rows.length}`);
  console.log(`Users inserted: ${users.length}`);
  console.log(`Bookshelves relinked to users: ${relinkedBookshelves}`);
  console.log(`Bookshelves without matching user: ${shelves.length - relinkedBookshelves}`);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("Authy CSV import failed:", error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
