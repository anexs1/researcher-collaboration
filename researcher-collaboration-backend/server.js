const express = require("express");
const mysql = require("mysql2");
const app = express();
const port = 5001;

// MySQL connection configuration
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // Leave empty
  database: "researcher_collaboration",
});

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err.stack);
    process.exit(1); // Exit the process if the database connection fails
  }
  console.log("Connected to the MySQL database");
});

// Middleware for parsing JSON bodies
app.use(express.json());

// Input validation middleware for creating a profile
const validateProfileInput = (req, res, next) => {
  const { name, fieldOfResearch, bio, imageUrl } = req.body;

  if (!name || !fieldOfResearch || !bio || !imageUrl) {
    return res.status(400).json({ error: "All fields are required" });
  }

  next(); // Proceed to the next middleware/route handler
};

// Create researcher profile endpoint
app.post("/createProfile", validateProfileInput, (req, res) => {
  const { name, fieldOfResearch, bio, imageUrl } = req.body;

  // SQL query to insert a new researcher
  const query =
    "INSERT INTO researchers (name, fieldOfResearch, bio, imageUrl) VALUES (?, ?, ?, ?)";

  db.query(query, [name, fieldOfResearch, bio, imageUrl], (err, result) => {
    if (err) {
      console.error("Error inserting profile:", err);
      return res.status(500).json({ error: "Error saving profile" });
    }
    res
      .status(201)
      .json({ message: "Profile created successfully", id: result.insertId });
  });
});

// Endpoint to fetch all researchers
app.get("/researchers", (req, res) => {
  // SQL query to get all researchers
  db.query("SELECT * FROM researchers", (err, results) => {
    if (err) {
      console.error("Error fetching researchers:", err);
      return res.status(500).json({ error: "Error fetching researchers" });
    }
    res.status(200).json(results);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Internal server error:", err);
  res.status(500).json({ error: "Internal server error" });
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
// Example route to fetch a researcher by ID
app.get("/api/researchers/:id", (req, res) => {
  const researcherId = req.params.id;
  // Fetch the researcher from the database using the ID
  // For example:
  Researcher.findById(researcherId)
    .then((researcher) => res.json(researcher))
    .catch((err) =>
      res.status(500).json({ error: "Failed to fetch researcher" })
    );
});
