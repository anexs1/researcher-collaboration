import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js";
import multer from "multer";

const router = express.Router();

// Configure Multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); // Specify the folder to save the file
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Use a unique file name
  },
});

const upload = multer({ storage: storage });

// Signup route that handles form data and profile image upload
router.post("/signup", upload.single("profileImage"), async (req, res) => {
  const {
    username,
    email,
    password,
    confirmPassword,
    expertise,
    bio,
    location,
    phone,
  } = req.body;

  // Validate required fields
  if (!username || !email || !password || !confirmPassword) {
    return res
      .status(400)
      .json({ message: "Please fill in all required fields." });
  }

  // Check if passwords match
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  // Check if the email already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: "Email already exists." });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Save the user, including the uploaded profile image path
    const profileImagePath = req.file ? req.file.path : null;

    // Create a new user in the database (ensure the field names match the model)
    await User.create({
      username, // Ensure username is included
      name: username, // You may want to also store the username as "name"
      email,
      password: hashedPassword,
      expertise,
      bio,
      location,
      phone,
      profileImage: profileImagePath, // Store the image path if available
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error("Error during signup:", error); // Log error details
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

// Login route (with bcrypt password comparison and JWT token generation)
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log("Login attempt for username:", username); // Debug log
    // Find user by username
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h", // Token expiry time
    });

    // Send the response with the token
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Error during login:", error); // Full error log
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

export default router;
