import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const JWT_SECRET = "your-secret-key";

const registerUser = async (req, res) => {
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
    return res.status(400).json({ message: "Please fill in all fields." });
  }

  userModel.findUserByUsername(username, async (err, result) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (result.length > 0) {
      return res.status(400).json({ message: "Username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    userModel.createUser(
      username,
      email,
      hashedPassword,
      expertise,
      profileImage,
      bio,
      location,
      phone,
      (err) => {
        if (err) return res.status(500).json({ message: "Database error." });
        res.status(201).json({ message: "Account created successfully!" });
      }
    );
  });
};

const loginUser = (req, res) => {
  const { username, password } = req.body;

  userModel.findUserByUsername(username, async (err, result) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (result.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = result[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { username: user.username, id: user.id },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      isAdmin: user.is_admin,
    });
  });
};

// Exporting the functions with the correct names
export { registerUser, loginUser };
