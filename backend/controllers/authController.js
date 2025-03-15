import User from "../models/user.js"; // ✅ Import User Model

export const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username, password } });
    if (user) {
      res.json({ message: "Login successful", user });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

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
  } = req.body;
  try {
    const newUser = await User.create({
      username,
      email,
      password,
      expertise,
      profileImage,
      bio,
      location,
      phone,
    });
    res.json({ message: "Registration successful", user: newUser });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
