import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/user.js"; // Ensure your User model has necessary methods (findUserByEmail, createUser)
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

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." });
  }

  // Check if the email already exists
  const existingUser = await User.findUserByEmail(email);
  if (existingUser) {
    return res.status(400).json({ message: "Email already exists." });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Save the user, including the uploaded profile image path
    const profileImagePath = req.file ? req.file.path : null;

    // Create a new user in the database (ensure your User model has a method for this)
    await User.createUser({
      username,
      email,
      password: hashedPassword,
      expertise,
      bio,
      location,
      phone,
      profileImage: profileImagePath, // Save the profile image path in the database
    });

    res.status(201).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
