import mysql from "mysql2";
import process from "node:process";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "researcher_portal",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL database.");
});

export default db;
