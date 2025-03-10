// config/db.js
import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "researcher_portal",
});

db.connect((err) => {
  if (err) {
    console.error("DB connection failed: " + err.stack);
    return;
  }
  console.log("Connected to database");
});

export default db;
