// Import necessary modules
import dotenv from "dotenv";
import express from "express";
import mysql from "mysql2";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import authRoutes from "./routes/authRoutes.js";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Set up the MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: process.env.DB_PASSWORD, // Use environment variable for password
  database: process.env.DB_NAME, // Use environment variable for database name
});

// Middleware to parse JSON bodies
app.use(express.json());

// Use the auth routes (assuming you've defined them in authRoutes.js)
app.use("/api/auth", authRoutes);

// Handle user signup
app.post("/signup", (req, res) => {
  const {
    username,
    email,
    password,
    expertise,
    profileImage,
    bio,
    location,
    phone,
  } = req.body;

  // Validate that all fields are provided
  if (
    !username ||
    !email ||
    !password ||
    !expertise ||
    !profileImage ||
    !bio ||
    !location ||
    !phone
  ) {
    return res.status(400).json({ error: "Please fill in all fields." });
  }

  // Check password strength (you can adjust the regex as needed)
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error:
        "Password must be at least 8 characters long and include letters, numbers, and special characters.",
    });
  }

  // Hash the password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: "Error hashing password" });
    }

    // Save the user data in the database
    const query =
      "INSERT INTO users (username, email, password, expertise, profileImage, bio, location, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.query(
      query,
      [
        username,
        email,
        hashedPassword,
        expertise,
        profileImage,
        bio,
        location,
        phone,
      ],
      (err, results) => {
        if (err) {
          return res.status(500).json({ error: "Error saving user data" });
        }
        res.status(201).json({ message: "User registered successfully" });
      }
    );
  });
});

// Handle user login
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Fetch user details from the database
  const query = "SELECT * FROM users WHERE username = ?";
  db.query(query, [username], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const user = results[0];

    // Compare passwords
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(400).json({ error: "Invalid username or password" });
      }

      // Generate JWT token for the user
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        process.env.JWT_SECRET, // Use environment variable for JWT secret
        { expiresIn: "1h" }
      );

      res.status(200).json({ message: "Login successful", token });
    });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
