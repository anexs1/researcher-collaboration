// controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.js"; // Import the User model

export const registerUser = async (req, res) => {
  const {
    username,
    email,
    password,
    expertise,
    profileImage,
    bio,
    location,
    phone,
    role, // Role from the request body
  } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default the role to 'user'
    let assignedRole = "user";

    // Check if the user making the request is an admin *and* a role was actually sent
    if (req.user && req.user.role === "admin" && role) {
      // Add check for role existence
      if (["user", "admin", "moderator"].includes(role)) {
        // Validate the value
        assignedRole = role;
      } else {
        return res.status(400).json({ message: "Invalid role." }); // Bad Request
      }
    }
    //The rest of this is a test, it does not require user, it only requires the existence of role
    else if (role) {
      if (["user", "admin", "moderator"].includes(role)) {
        // Validate the value
        assignedRole = role;
      }
    }

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      expertise,
      profileImage,
      bio,
      location,
      phone,
      role: assignedRole, // Use the assigned role
    });

    res.status(201).json({ message: "Registration successful", user: newUser }); // 201 Created
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt for username:", username); // Debug Log

  try {
    const user = await User.findOne({ where: { username } });

    console.log("User from database:", user); // Debug Log

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    console.log("Password valid:", isPasswordValid); // Debug Log

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    // Inside loginUser function in controllers/authController.js
    res.json({ message: "Login successful", token: token, role: user.role }); // <=== ADD user.role Here!!
  } catch (error) {
    console.error("Error during user login:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
