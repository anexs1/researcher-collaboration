const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const db = require("./config/db"); // This should work if db.js uses CommonJS

const app = express();

app.use(bodyParser.json());
app.use("/uploads", express.static("uploads")); // Serve uploaded files
app.use("/api", publicationRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
