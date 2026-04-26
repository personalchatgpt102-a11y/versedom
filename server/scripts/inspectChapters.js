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
    sql = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD || "",
      database: process.env.MYSQL_DATABASE,
    });

    console.log("MySQL connected");

    const [structure] = await sql.query("DESCRIBE chapters");
    console.log("Chapters table structure:");
    console.table(structure);

    const [rows] = await sql.query("SELECT * FROM chapters LIMIT 3");
    console.log("Sample rows:");
    console.dir(rows, { depth: null });

    await sql.end();
    process.exit(0);
  } catch (error) {
    if (sql) await sql.end();

    console.error("Inspect chapters failed:");
    console.error(error);
    process.exit(1);
  }
};

run();