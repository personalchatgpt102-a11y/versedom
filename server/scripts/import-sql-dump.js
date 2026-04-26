import "dotenv/config";
import fs from "node:fs";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/User.js";
import Book from "../models/Book.js";
import Bookshelf from "../models/Bookshelf.js";

const dumpPath = process.argv[2];

if (!dumpPath) {
  console.error("Usage: node scripts/import-sql-dump.js <path-to-sql-dump>");
  process.exit(1);
}

const targetTables = ["authy", "books", "bookshelf"];

const safeJsonParse = (value, fallback = []) => {
  try {
    if (!value) return fallback;
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? null : date;
};

const findStatementEnd = (sql, start) => {
  let inString = false;

  for (let index = start; index < sql.length; index++) {
    const char = sql[index];

    if (inString) {
      if (char === "\\") {
        index++;
      } else if (char === "'") {
        inString = false;
      }
      continue;
    }

    if (char === "'") {
      inString = true;
    } else if (char === ";") {
      return index + 1;
    }
  }

  return -1;
};

const getInsertStatement = (sql, table) => {
  const start = sql.indexOf(`INSERT INTO \`${table}\``);
  if (start === -1) return null;

  const end = findStatementEnd(sql, start);
  if (end === -1) {
    throw new Error(`Could not find end of INSERT statement for ${table}`);
  }

  return sql.slice(start, end);
};

const parseColumns = (statement) => {
  const match = statement.match(/INSERT INTO `[^`]+` \(([^)]+)\) VALUES/i);
  if (!match) {
    throw new Error("Could not parse INSERT columns");
  }

  return match[1].split(",").map((column) => column.trim().replaceAll("`", ""));
};

const parseSqlValue = (value) => {
  if (value === null) return null;

  const trimmed = value.trim();
  if (/^null$/i.test(trimmed)) return null;
  return trimmed;
};

const unescapeSqlChar = (char) => {
  switch (char) {
    case "0":
      return "\0";
    case "n":
      return "\n";
    case "r":
      return "\r";
    case "t":
      return "\t";
    case "b":
      return "\b";
    case "Z":
      return "\x1a";
    default:
      return char;
  }
};

const parseRows = (statement, columns) => {
  const valuesIndex = statement.search(/\bVALUES\b/i);
  if (valuesIndex === -1) {
    throw new Error("Could not find VALUES in INSERT statement");
  }

  const values = statement.slice(valuesIndex + "VALUES".length, -1);
  const rows = [];
  let currentRow = null;
  let currentValue = "";
  let inString = false;
  let rowDepth = 0;

  const pushValue = () => {
    currentRow.push(parseSqlValue(currentValue));
    currentValue = "";
  };

  const pushRow = () => {
    const row = {};
    columns.forEach((column, index) => {
      row[column] = currentRow[index] ?? null;
    });
    rows.push(row);
    currentRow = null;
  };

  for (let index = 0; index < values.length; index++) {
    const char = values[index];

    if (inString) {
      if (char === "\\") {
        currentValue += unescapeSqlChar(values[index + 1] ?? "");
        index++;
      } else if (char === "'") {
        inString = false;
      } else {
        currentValue += char;
      }
      continue;
    }

    if (char === "'") {
      inString = true;
      continue;
    }

    if (char === "(" && rowDepth === 0) {
      currentRow = [];
      currentValue = "";
      rowDepth = 1;
      continue;
    }

    if (!currentRow) continue;

    if (char === "," && rowDepth === 1) {
      pushValue();
      continue;
    }

    if (char === ")" && rowDepth === 1) {
      pushValue();
      pushRow();
      rowDepth = 0;
      continue;
    }

    currentValue += char;
  }

  return rows;
};

const parseTable = (sql, table) => {
  const statement = getInsertStatement(sql, table);
  if (!statement) return [];

  const columns = parseColumns(statement);
  return parseRows(statement, columns);
};

const importUsers = async (rows) => {
  const operations = rows
    .filter((row) => row.provider === "email" && row.pid && row.password)
    .map((row) => ({
      updateOne: {
        filter: { email: row.pid.toLowerCase().trim() },
        update: {
          $set: {
            oldId: toNumber(row.id),
            provider: row.provider,
            email: row.pid.toLowerCase().trim(),
            passwordHash: row.password,
            oldToken: row.token,
            mode: toNumber(row.mode),
            oldCreatedTime: row.time,
          },
        },
        upsert: true,
      },
    }));

  if (operations.length) {
    await User.bulkWrite(operations, { ordered: false });
  }

  return operations.length;
};

const importBooks = async (rows) => {
  const operations = rows
    .filter((row) => row.url)
    .map((row) => ({
      updateOne: {
        filter: { slug: row.url },
        update: {
          $set: {
            oldId: toNumber(row.id),
            title: row.title,
            slug: row.url,
            language: row.lang,
            type: row.novel,
            rating: row.rating,
            genre: row.genre,
            tags: safeJsonParse(row.tags, []),
            views: toNumber(row.views),
            description: row.synopsis,
            cover: row.img,
            oldToken: row.token,
            oldDate: toDate(row.date),
            status: toNumber(row.status),
          },
        },
        upsert: true,
      },
    }));

  if (operations.length) {
    await Book.bulkWrite(operations, { ordered: false });
  }

  return operations.length;
};

const importBookshelves = async (rows) => {
  const [users, books] = await Promise.all([
    User.find({}, { oldToken: 1 }).lean(),
    Book.find({}, { slug: 1 }).lean(),
  ]);

  const userByToken = new Map(users.filter((user) => user.oldToken).map((user) => [user.oldToken, user._id]));
  const bookBySlug = new Map(books.filter((book) => book.slug).map((book) => [book.slug, book._id]));

  let missingUser = 0;
  const operations = [];

  for (const row of rows) {
    const user = userByToken.get(row.token) ?? null;

    const book = bookBySlug.get(row.sid) ?? null;
    if (!user) missingUser++;

    operations.push({
      updateOne: {
        filter: { oldId: toNumber(row.id) },
        update: {
          $set: {
            oldId: toNumber(row.id),
            user,
            book,
            sid: row.sid,
            reading: toNumber(row.reading, 1),
            verses: safeJsonParse(row.verses, []),
            oldToken: row.token,
            date: toDate(row.date),
          },
        },
        upsert: true,
      },
    });
  }

  if (operations.length) {
    await Bookshelf.bulkWrite(operations, { ordered: false });
  }

  return {
    migrated: operations.length,
    missingUser,
  };
};

const run = async () => {
  console.log(`Reading SQL dump: ${dumpPath}`);
  const sql = fs.readFileSync(dumpPath, "utf8");

  const parsed = Object.fromEntries(targetTables.map((table) => [table, parseTable(sql, table)]));

  console.log(`Parsed authy rows: ${parsed.authy.length}`);
  console.log(`Parsed books rows: ${parsed.books.length}`);
  console.log(`Parsed bookshelf rows: ${parsed.bookshelf.length}`);

  await connectDB();

  await Bookshelf.collection.dropIndex("user_1_sid_1").catch(() => {});

  const users = await importUsers(parsed.authy);
  const books = await importBooks(parsed.books);
  const bookshelf = await importBookshelves(parsed.bookshelf);

  console.log(`Users imported: ${users}`);
  console.log(`Books imported: ${books}`);
  console.log(`Bookshelf imported: ${bookshelf.migrated}`);
  console.log(`Bookshelf rows without matching user: ${bookshelf.missingUser}`);

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error("SQL dump import failed:", error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
