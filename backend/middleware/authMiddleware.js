const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

exports.authMiddleware = (req, res, next) => {
  // <---- check exports here
  const token = req.header("Authorization");

  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};
