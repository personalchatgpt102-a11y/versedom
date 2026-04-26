import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(__dirname, "../.env"),
});

const run = async () => {
  let sql;

  try {
    console.log("Trying MySQL connection with:");
    console.log({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER,
      database: process.env.MYSQL_DATABASE,
    });

    sql = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE,
    });

    console.log("MySQL connected successfully");

    const [userRows] = await sql.query(
      `
      SELECT id, provider, pid, token, mode
      FROM authy
      WHERE pid = ?
      LIMIT 1
      `,
      ["goldenbutterfly890@gmail.com"]
    );

    console.log("User rows:");
    console.log(userRows);

    const [bookshelfRows] = await sql.query(
      `
      SELECT 
        a.pid,
        bs.sid,
        bs.reading,
        bs.verses,
        bs.date
      FROM authy a
      JOIN bookshelf bs ON bs.token = a.token
      WHERE a.pid = ?
      `,
      ["goldenbutterfly890@gmail.com"]
    );

    console.log("Bookshelf rows count:", bookshelfRows.length);
    console.log("First bookshelf row:");
    console.log(bookshelfRows[0] || null);

    await sql.end();

    console.log("MySQL test completed");
    process.exit(0);
  } catch (error) {
    if (sql) {
      await sql.end();
    }

    console.error("MySQL test failed");
    console.error("Code:", error.code);
    console.error("Message:", error.message);

    process.exit(1);
  }
};

run();